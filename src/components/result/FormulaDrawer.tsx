// 公式说明抽屉 - 右侧滑入
import { motion, AnimatePresence } from "framer-motion";
import { X, FunctionSquare } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";

// 各分项颜色 - 基于 CSS 变量, 跟随主题
const FORMULAS = [
  {
    key: "weights",
    title: "1. 模型权重 (Model Weights)",
    varName: "--seg-weights",
    formula: "VRAM = totalParams × bytesPerParam",
    detail: `bytesPerParam 由量化精度决定:
  FP32 → 4 B/参
  FP16 / BF16 → 2 B/参
  INT8 → 1 B/参
  INT4 → 0.5 B/参

参数量估算 (无明确值时):
  embedding = vocab × hidden
  attn/L ≈ hidden² × (3 + 2 × kv_heads/attn_heads)
  ffn/L  ≈ 4 × hidden × intermediate
  total ≈ embedding + L × (attn + ffn) + lm_head

MoE (混合专家) 模型:
  权重参数 = embedding + L × (attn + numExperts × 单专家FFN) + lm_head
  所有 numExperts 个专家权重都需驻留显存 (推理时按 token 路由)
  权重显存按"总参数"计算, 不是激活参数

  例: Mixtral-8x7B 总 46.7B (8专家), 激活仅 12.9B (2专家)
      DeepSeek-V4-Flash 总 284B, 激活仅 13B
      权重显存按 284B 算, 而非 13B`,
  },
  {
    key: "kvCache",
    title: "2. KV 缓存 (KV Cache)",
    varName: "--seg-kv",
    formula: "VRAM = 2 × L × num_kv_heads × head_dim × seq_len × batch × concurrency × bytesPerKV",
    detail: `生成式任务特有, 存储历史 Token 的 Key 和 Value 矩阵以避免重复计算。

  系数 2: Key + Value 两份
  L: Transformer 层数
  num_kv_heads: GQA 模型为 num_key_value_heads (显著缩减)
  head_dim: hidden_size / num_attention_heads
  seq_len: 当前序列长度 (含 prompt + 生成)
  batch × concurrency: 并行处理的序列总数
  bytesPerKV: KV 缓存精度 (可独立量化, 如 KV INT8)

随序列长度线性增长, 是长上下文场景的主要显存消耗。`,
  },
  {
    key: "activations",
    title: "3. 临时激活值 (Temporary Activations)",
    varName: "--seg-act",
    formula: "VRAM ≈ batch × seq × (4×hidden + 2×intermediate × activeExperts) × bytes",
    detail: `推理阶段仅保留当前层计算所需的中间结果, 算完即弃, 跨层复用同一块显存缓冲。

prefill 阶段 (处理 prompt) 是激活峰值:
  每层每 Token 中间态 ≈ 4×hidden (QKV+O) + 2×intermediate × activeExperts
  同一瞬间仅驻留"当前层"的整条序列中间态, 跨层不累积

为何不乘 num_layers?
  激活值是"算完即弃"的临时张量, 第 N 层算完即可释放,
  第 N+1 层复用同一块缓冲。故任意瞬间显存只持有单层激活,
  而非所有层同时铺开。

MoE 模型 activeExperts = num_activated_experts (每次仅激活 top-k 个专家):
  仅激活专家的 FFN 中间态驻留显存, 非全部专家。
  dense 模型 activeExperts = 1。

解码阶段 (逐 token 生成) 激活远小于 prefill, 按峰值估算即可覆盖。
实际框架 (FlashAttention 等) 会进一步降低峰值, 此为保守上界。`,
  },
  {
    key: "framework",
    title: "4. 框架开销 (Framework Overhead)",
    varName: "--seg-framework",
    formula: "VRAM = frameworkStartupOverhead",
    detail: `推理框架启动所需的固定开销, 主要包括:

  CUDA context: ~300-500 MB
  PyTorch 运行时: ~500-800 MB
  paged attention 元数据 (vLLM): ~200-400 MB
  临时缓冲 / 通信: 视框架而定

各框架典型开销:
  vLLM      ≈ 1.0 GB
  TGI       ≈ 0.8 GB
  LMDeploy  ≈ 0.7 GB
  llama.cpp ≈ 0.2 GB (CPU/GPU 混合)
  自定义    ≈ 0.5 GB`,
  },
];

export function FormulaDrawer() {
  const open = useCalcStore((s) => s.drawerOpen);
  const openDrawer = useCalcStore((s) => s.openDrawer);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => openDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* 抽屉 */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 panel rounded-none border-y-0 border-r-0 overflow-y-auto"
          >
            {/* 头部 */}
            <div className="sticky top-0 panel glow-line rounded-none border-x-0 border-t-0 px-5 py-4 bg-void-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <FunctionSquare className="w-4 h-4 text-neon-400" />
                <h2 className="font-display text-base font-bold text-ink-100">
                  显存计算公式推导
                </h2>
                <button
                  onClick={() => openDrawer(false)}
                  className="ml-auto w-7 h-7 rounded-md border border-edge hover:border-neon-400/40 hover:bg-neon-400/8 flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-ink-300" />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-ink-500 leading-snug">
                各分项的计算公式与推导过程, 便于工程师审计与调参。
              </p>
            </div>

            {/* 公式列表 */}
            <div className="p-5 flex flex-col gap-4">
              {FORMULAS.map((f, idx) => {
                const solid = `rgb(var(${f.varName}))`;
                const softBg = `rgba(var(${f.varName}), 0.08)`;
                const softGlow = `0 0 8px rgba(var(${f.varName}), 0.6)`;
                return (
                  <div
                    key={f.key}
                    className="rounded-md border border-edge bg-void-800/40 overflow-hidden"
                  >
                    {/* 标题 */}
                    <div
                      className="px-3 py-2 border-b border-edge flex items-center gap-2"
                      style={{ background: softBg }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: solid, boxShadow: softGlow }}
                      />
                      <h3 className="font-display text-[13px] font-semibold text-ink-100">
                        {f.title}
                      </h3>
                      <span className="ml-auto font-mono text-[9px] text-ink-700">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* 公式块 */}
                    <div className="px-3 py-2.5">
                      <div
                        className="px-2.5 py-2 rounded bg-void-950 border-l-2 font-mono text-[11px] leading-relaxed text-ink-100"
                        style={{ borderColor: solid }}
                      >
                        {f.formula}
                      </div>
                      <pre className="mt-2 font-mono text-[10px] text-ink-500 leading-relaxed whitespace-pre-wrap">
                        {f.detail}
                      </pre>
                    </div>
                  </div>
                );
              })}

              {/* 总公式 */}
              <div className="rounded-md border border-neon-400/30 bg-neon-400/5 px-3 py-3">
                <div className="label-tiny mb-1">总显存</div>
                <div className="font-mono text-[12px] text-neon-300 font-semibold">
                  VRAM_total = weights + kvCache + activations + framework
                </div>
              </div>

              <p className="text-[10px] text-ink-700 leading-relaxed">
                * 以上为工程化估算, 实际占用因框架实现、CUDA 碎片、上下文管理策略而异。
                vLLM 等框架会预留显存给 paged attention, 实际可能比估算高 5-15%。
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
