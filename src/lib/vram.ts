// 显存计算引擎 - 四项公式实现
import type {
  ModelArch,
  DeployConfig,
  VramBreakdown,
  VramItem,
  Precision,
} from "@/types";

// 精度 -> 每参数字节数
export const BYTES_PER_PARAM: Record<Precision, number> = {
  FP32: 4,
  FP16: 2,
  BF16: 2,
  INT8: 1,
  INT4: 0.5,
};

// 框架开销 (GB) - 含 CUDA context + 元数据
export const FRAMEWORK_OVERHEAD_GB: Record<DeployConfig["framework"], number> = {
  vllm: 1.0,
  tgi: 0.8,
  lmdeploy: 0.7,
  llama_cpp: 0.2,
  custom: 0.5,
};

export const FRAMEWORK_LABEL: Record<DeployConfig["framework"], string> = {
  vllm: "vLLM",
  tgi: "TGI",
  lmdeploy: "LMDeploy",
  llama_cpp: "llama.cpp",
  custom: "Custom",
};

const GB = 1024 ** 3;

/**
 * 估算模型总参数量 (用于权重显存: 所有参数必须加载到显存)
 *
 * dense 模型:
 *   embedding + L×(attn + 1×FFN) + lm_head
 *
 * MoE 模型:
 *   embedding + L×(attn + numExperts×单专家FFN) + lm_head
 *   每层所有专家权重都要驻留显存 (推理时按 token 路由到不同专家)
 *
 * 注: 注意力部分 dense/MoE 相同 (不切专家), 仅 FFN 部分按专家数放大
 */
export function estimateParams(arch: ModelArch): number {
  const {
    numLayers: L,
    numAttnHeads: H,
    numKVHeads: KV,
    hiddenSize: hs,
    intermediateSize: is,
    vocabSize: V,
    isMoE,
    numExperts,
  } = arch;

  const embedding = V * hs;
  const lmHead = V * hs;
  const kvRatio = KV / H;
  const attnPerLayer =
    hs * hs * 3 + // QKV (合并近似)
    2 * (hs * hs) * kvRatio + // K/V proj (GQA 缩减)
    hs * hs; // O proj
  // FFN: dense 为 1 个; MoE 为全部专家 (权重都需驻留显存)
  const expertCount = isMoE && numExperts > 1 ? numExperts : 1;
  const ffnPerLayer = expertCount * 4 * hs * is;

  return embedding + L * (attnPerLayer + ffnPerLayer) + lmHead;
}

/**
 * 估算激活参数量 (用于激活值计算: 每次推理实际参与计算的参数)
 *
 * dense 模型: 激活参数 = 总参数
 * MoE 模型: 激活参数 = embedding + L×(attn + numActivatedExperts×单专家FFN) + lm_head
 *   每次推理只路由激活 top-k 个专家参与计算
 */
export function estimateActiveParams(arch: ModelArch): number {
  const {
    numLayers: L,
    numAttnHeads: H,
    numKVHeads: KV,
    hiddenSize: hs,
    intermediateSize: is,
    vocabSize: V,
    isMoE,
    numActivatedExperts,
  } = arch;

  // 非 MoE 或无激活专家数, 退化为总参数
  if (!isMoE || numActivatedExperts < 1) {
    return estimateParams(arch);
  }

  const embedding = V * hs;
  const lmHead = V * hs;
  const kvRatio = KV / H;
  const attnPerLayer =
    hs * hs * 3 +
    2 * (hs * hs) * kvRatio +
    hs * hs;
  // 激活 FFN: 仅 top-k 个专家参与计算
  const activeFfnPerLayer = numActivatedExperts * 4 * hs * is;

  return embedding + L * (attnPerLayer + activeFfnPerLayer) + lmHead;
}

/**
 * 1. 模型权重显存
 * VRAM = totalParams × bytesPerParam
 */
export function calcWeights(
  totalParams: number,
  precision: Precision,
): number {
  return totalParams * BYTES_PER_PARAM[precision];
}

/**
 * 2. KV 缓存显存
 * VRAM = 2 × L × num_kv_heads × head_dim × seq_len × batch × bytesPerKV
 * 系数 2: Key + Value
 * 并发请求时按 concurrency × batch 聚合
 */
export function calcKvCache(
  arch: ModelArch,
  cfg: DeployConfig,
): number {
  const { numLayers: L, numKVHeads: KV, headDim } = arch;
  const bytes = BYTES_PER_PARAM[cfg.kvPrecision];
  const totalSeqs = cfg.batchSize * cfg.concurrency;
  return 2 * L * KV * headDim * cfg.seqLength * totalSeqs * bytes;
}

/**
 * 3. 临时激活值显存 (推理 prefill 阶段峰值)
 *
 * 物理本质: 激活值是"算完即弃"的中间张量, 跨层复用同一块显存缓冲。
 * 因此任意瞬间显存只驻留"当前正在计算的那一层"的激活, 而非所有层铺开。
 * 故只计算单层激活峰值, 不乘 num_layers。
 *
 * 单层每 token 激活:
 *   注意力 QKV+O 投影中间态 ≈ 4 × hidden
 *   FFN up/down 投影中间态  ≈ 2 × intermediate
 * prefill 阶段全序列并行, 同一瞬间持有整条序列的当前层中间态:
 *   dense: VRAM ≈ batch × seq × (4×hidden + 2×intermediate) × bytes
 *   MoE:   VRAM ≈ batch × seq × (4×hidden + numActivated×2×intermediate) × bytes
 *          (每次推理只激活 top-k 个专家, 仅这 k 个专家的 FFN 中间态驻留)
 *
 * 注: 实际框架会进一步优化 (如 FlashAttention 不落盘 attention 矩阵),
 * 此为保守上界估计。
 */
export function calcActivations(
  arch: ModelArch,
  cfg: DeployConfig,
): number {
  const { hiddenSize: hs, intermediateSize: is, isMoE, numActivatedExperts } = arch;
  const bytes = BYTES_PER_PARAM[cfg.kvPrecision];
  // MoE: FFN 部分仅按激活专家数计算 (不是全部专家)
  const activeExpertCount =
    isMoE && numActivatedExperts > 0 ? numActivatedExperts : 1;
  // 单层激活 (per token): 注意力 QKV+O 约 4×hidden, FFN up/down 约 2×intermediate×激活专家数
  const perToken = (4 * hs + 2 * is * activeExpertCount) * bytes;
  // prefill 阶段: 全序列并行处理, 仅当前层激活驻留显存, 跨层复用缓冲不累积
  return cfg.batchSize * cfg.seqLength * perToken;
}

/**
 * 4. 框架开销
 */
export function calcFramework(
  framework: DeployConfig["framework"],
): number {
  return FRAMEWORK_OVERHEAD_GB[framework] * GB;
}

// 主计算入口
export function calcVram(
  arch: ModelArch,
  cfg: DeployConfig,
  totalParams?: number,
): VramBreakdown {
  // 若未提供参数量则估算
  const params = totalParams ?? estimateParams(arch);
  const weights = calcWeights(params, cfg.weightPrecision);
  const kvCache = calcKvCache(arch, cfg);
  const activations = calcActivations(arch, cfg);
  const framework = calcFramework(cfg.framework);
  const total = weights + kvCache + activations + framework;

  // 单卡显存: TP 分摊权重/KV/激活, EP 影响 GPU 总数 (MoE 专家分摊)
  // 对 dense 模型, EP 不额外缩减单卡权重; TP 是主要的切分维度
  const tp = Math.max(1, Math.floor(cfg.tensorParallel || 1));
  const ep = Math.max(1, Math.floor(cfg.expertParallel || 1));
  const gpuCount = tp * ep;
  const perGpuWeights = weights / tp;
  const perGpuKV = kvCache / tp;
  const perGpuAct = activations / tp;
  const perGpuFramework = framework; // 每卡独立运行时开销
  const perGpuTotal = perGpuWeights + perGpuKV + perGpuAct + perGpuFramework;

  return {
    weights,
    kvCache,
    activations,
    framework,
    total,
    perGpu: {
      weights: perGpuWeights,
      kvCache: perGpuKV,
      activations: perGpuAct,
      framework: perGpuFramework,
      total: perGpuTotal,
      gpuCount,
      tp,
      ep,
    },
  };
}

// 将 VramBreakdown 转为 UI 项 (带公式与说明)
// 展示单卡视角 (考虑 TP 切分), 这是部署时每张卡的实际占用
export function buildVramItems(
  breakdown: VramBreakdown,
  arch: ModelArch,
  cfg: DeployConfig,
  totalParams: number,
): VramItem[] {
  const totalB = totalParams / 1e9;
  const wBytes = BYTES_PER_PARAM[cfg.weightPrecision];
  const kvBytes = BYTES_PER_PARAM[cfg.kvPrecision];
  const totalSeqs = cfg.batchSize * cfg.concurrency;
  const tp = breakdown.perGpu.tp;
  const ep = breakdown.perGpu.ep;
  const tpSuffix = tp > 1 ? ` ÷ TP${tp}` : "";
  const moeActiveLabel = arch.isMoE
    ? `${arch.numActivatedExperts}`
    : "1";
  const items: VramItem[] = [
    {
      key: "weights",
      label: "模型权重",
      bytes: breakdown.perGpu.weights,
      gb: breakdown.perGpu.weights / GB,
      formula:
        arch.isMoE
          ? `${totalB.toFixed(2)}B (总${arch.numExperts}专家) × ${wBytes} B/参${tpSuffix}`
          : `${totalB.toFixed(2)}B × ${wBytes} B/参${tpSuffix}`,
      note:
        arch.isMoE
          ? `MoE: 所有 ${arch.numExperts} 个专家权重都需驻留显存, 激活仅 ${arch.numActivatedExperts} 个; 总参数含全部专家`
          : tp > 1
            ? `权重总量按 TP=${tp} 切分, 单卡持有 1/${tp}; EP=${ep} 时 MoE 专家可进一步分摊`
            : "加载模型权重所需的基础显存, 取决于参数量与量化精度",
    },
    {
      key: "kvCache",
      label: "KV 缓存",
      bytes: breakdown.perGpu.kvCache,
      gb: breakdown.perGpu.kvCache / GB,
      formula: `2 × ${arch.numLayers}层 × ${arch.numKVHeads} KV头 × ${arch.headDim}dim × ${cfg.seqLength}seq × ${totalSeqs}并发 × ${kvBytes}B${tpSuffix}`,
      note:
        tp > 1
          ? `KV 头按 TP=${tp} 切分到各卡, 单卡仅持有部分 KV 头`
          : "生成式任务特有, 存储历史 Token 的 Key/Value 矩阵以避免重复计算, 随序列长度线性增长",
    },
    {
      key: "activations",
      label: "临时激活值",
      bytes: breakdown.perGpu.activations,
      gb: breakdown.perGpu.activations / GB,
      formula:
        arch.isMoE
          ? `${cfg.batchSize}批 × ${cfg.seqLength}seq × (4×${arch.hiddenSize}+2×${arch.intermediateSize}×${moeActiveLabel}专家) × ${kvBytes}B${tpSuffix}`
          : `${cfg.batchSize}批 × ${cfg.seqLength}seq × (4×${arch.hiddenSize}+2×${arch.intermediateSize}) × ${kvBytes}B${tpSuffix}`,
      note:
        arch.isMoE
          ? `MoE: 每次仅 ${arch.numActivatedExperts} 个激活专家的 FFN 中间态驻留, 非全部 ${arch.numExperts} 专家`
          : tp > 1
            ? `激活值按 TP=${tp} 切分, 每卡仅计算本地分片的中间态`
            : "仅当前层激活驻留显存, 跨层复用缓冲不累积, 远小于训练阶段",
    },
    {
      key: "framework",
      label: "框架开销",
      bytes: breakdown.perGpu.framework,
      gb: breakdown.perGpu.framework / GB,
      formula: `${FRAMEWORK_LABEL[cfg.framework]} 启动约 ${FRAMEWORK_OVERHEAD_GB[cfg.framework]} GB`,
      note: "推理框架启动所需显存: CUDA context + paged attention 元数据 + 临时缓冲 (每卡独立)",
    },
  ];
  return items;
}

// 格式化字节数为人类可读
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function formatGB(bytes: number, digits = 2): string {
  return `${(bytes / GB).toFixed(digits)} GB`;
}

// ============================================================
// vLLM 启动配置生成 (参考 https://recipes.vllm.ai/)
// ============================================================

export interface LaunchParam {
  flag: string; // --tensor-parallel-size
  value: string; // 2
  label: string; // 张量并行
  hint?: string; // 说明
  group: "core" | "memory" | "perf" | "quant";
}

export interface LaunchConfig {
  params: LaunchParam[];
  cmdLine: string; // 完整命令行
  notes: string[]; // 注意事项
  recipe: string; // 参考方案
}

/**
 * 根据模型架构与显存评估生成 vLLM 启动参数
 * 参考 vLLM recipes 的最佳实践
 */
export function buildLaunchConfig(
  arch: ModelArch,
  cfg: DeployConfig,
  breakdown: VramBreakdown,
  totalParams: number,
  modelName: string,
): LaunchConfig {
  const params: LaunchParam[] = [];
  const notes: string[] = [];
  const perGpuGB = breakdown.perGpu.total / GB;
  const totalVramGB = breakdown.total / GB;

  // ---- 核心参数 ----
  // 模型路径 (占位, 用户替换为实际路径)
  params.push({
    flag: "--model",
    value: modelName || "<模型路径/ID>",
    label: "模型路径",
    hint: "本地路径或 HuggingFace/ModelScope ID",
    group: "core",
  });

  // 张量并行 (TP > 1 时必填)
  const tp = breakdown.perGpu.tp;
  if (tp > 1) {
    params.push({
      flag: "--tensor-parallel-size",
      value: String(tp),
      label: "张量并行 TP",
      hint: `单卡显存 ${perGpuGB.toFixed(1)}GB, 需 ${tp} 卡切分`,
      group: "core",
    });
  }

  // 专家并行 (MoE 模型 EP > 1 时)
  const ep = breakdown.perGpu.ep;
  if (ep > 1) {
    params.push({
      flag: "--expert-parallel-size",
      value: String(ep),
      label: "专家并行 EP",
      hint: `MoE 模型, ${arch.numExperts} 专家分摊到 ${ep} 组`,
      group: "core",
    });
  }

  // ---- 量化参数 ----
  if (cfg.weightPrecision !== "FP16" && cfg.weightPrecision !== "BF16") {
    const quantMap: Record<string, { flag: string; hint: string }> = {
      INT8: {
        flag: "fp8",
        hint: "FP8 量化, 显存减半",
      },
      INT4: {
        flag: "awq",
        hint: "AWQ 4bit 量化, 显存降至 1/4",
      },
      FP32: {
        flag: "None",
        hint: "FP32 无量化",
      },
    };
    const q = quantMap[cfg.weightPrecision];
    if (q) {
      params.push({
        flag: "--quantization",
        value: q.flag,
        label: "量化方案",
        hint: q.hint,
        group: "quant",
      });
    }
  }

  // ---- 显存/上下文参数 ----
  // 最大序列长度 (vLLM 默认会读 config, 但建议显式设置)
  params.push({
    flag: "--max-model-len",
    value: String(cfg.seqLength),
    label: "最大序列长度",
    hint: `模型支持 ${arch.maxSeqLen.toLocaleString()}, 当前配置 ${cfg.seqLength.toLocaleString()}`,
    group: "memory",
  });

  // GPU 显存利用率 (vLLM recipes 推荐 0.85-0.95)
  const utilization = Math.min(0.95, Math.max(0.5, 1 - perGpuGB * 0.01));
  params.push({
    flag: "--gpu-memory-utilization",
    value: utilization.toFixed(2),
    label: "GPU 显存利用率",
    hint: "vLLM 默认 0.9, 预留缓冲后推荐值",
    group: "memory",
  });

  // KV Cache 数据类型 (FP16/BF16 时用默认, INT8/INT4 时可量化)
  if (cfg.kvPrecision === "INT8") {
    params.push({
      flag: "--kv-cache-dtype",
      value: "fp8",
      label: "KV Cache 量化",
      hint: "FP8 KV Cache, 减少缓存显存",
      group: "memory",
    });
  }

  // ---- 性能优化参数 ----
  // chunked prefill (长上下文必备, 参考 vLLM recipes)
  if (cfg.seqLength >= 8192) {
    params.push({
      flag: "--enable-chunked-prefill",
      value: "",
      label: "分块预填充",
      hint: "长上下文 (>8K) 推荐, 避免 prefill 激活值峰值 OOM",
      group: "perf",
    });
    // max-num-batched-tokens 推荐
    const chunkSize = cfg.seqLength >= 32768 ? 2048 : 4096;
    params.push({
      flag: "--max-num-batched-tokens",
      value: String(chunkSize),
      label: "单批最大 token 数",
      hint: "chunked prefill 的块大小, 平衡延迟与吞吐",
      group: "perf",
    });
  }

  // 并发/吞吐参数
  if (cfg.concurrency > 1) {
    params.push({
      flag: "--max-num-seqs",
      value: String(cfg.concurrency),
      label: "最大并发序列数",
      hint: "并发请求数, 影响 KV Cache 占用",
      group: "perf",
    });
  }

  // MoE 模型专用参数
  if (arch.isMoE) {
    notes.push(
      `MoE 模型: ${arch.numExperts} 专家, 每次激活 ${arch.numActivatedExperts} (top-k), 权重已含全部专家`,
    );
  }

  // ---- 注意事项 ----
  notes.push(
    `单卡显存需求 ${perGpuGB.toFixed(2)} GB, 集群总显存 ${totalVramGB.toFixed(2)} GB`,
  );
  if (tp > 1) {
    notes.push(
      `TP=${tp}: 使用 vllm serve --tensor-parallel-size ${tp}, 需确保多卡间 NVLink/PCIe 通信`,
    );
  }
  if (cfg.seqLength >= 32768) {
    notes.push(
      `超长上下文 (${cfg.seqLength.toLocaleString()}): 强烈建议启用 chunked prefill 并搭配 FlashAttention`,
    );
  }
  notes.push("建议搭配 --trust-remote-code (部分模型需要执行自定义代码)");

  // ---- 命令行 ----
  const cmdParts = [
    "vllm serve",
    modelName || "<模型路径/ID>",
  ];
  for (const p of params) {
    if (p.flag === "--model") continue; // 已在开头
    cmdParts.push(`${p.flag}${p.value ? " " + p.value : ""}`);
  }
  cmdParts.push("--trust-remote-code");

  return {
    params,
    cmdLine: cmdParts.join(" \\\n  "),
    notes,
    recipe: "https://recipes.vllm.ai/",
  };
}
