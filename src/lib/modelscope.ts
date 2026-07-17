// ModelScope API 客户端 - 多代理兜底 + 宽容解析
import type {
  RawModelConfig,
  ModelScopeResult,
  ModelArch,
} from "@/types";
import { estimateParams } from "./vram";

const MS_BASE = "https://www.modelscope.cn/api/v1/models";

// CORS 代理候选 (按顺序尝试, 失败切换下一个)
// 注: 公共代理不稳定, 提供多个备选
const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url) => `https://proxy.cors.sh/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

export class ModelScopeError extends Error {
  constructor(
    message: string,
    public kind: "format" | "network" | "notfound" | "cors",
    public rawSample?: string,
  ) {
    super(message);
    this.name = "ModelScopeError";
  }
}

/**
 * 拉取模型 config.json
 * @param modelId 形如 "ZhipuAI/glm-4-9b-chat"
 */
export async function fetchModelConfig(
  modelId: string,
): Promise<ModelScopeResult> {
  const id = modelId.trim();
  if (!id || !id.includes("/")) {
    throw new ModelScopeError(
      "模型 ID 格式错误, 应为 namespace/name (如 ZhipuAI/glm-4-9b-chat)",
      "format",
    );
  }

  // 主接口: 直连拉取 config.json
  const cfgUrl = `${MS_BASE}/${id}/repo?Revision=master&FilePath=config.json`;
  const raw = await fetchWithFallback(cfgUrl);

  // 兼容包装格式: 有些代理会包成 { data: {...} } 或 { Data: {...} }
  const config = extractConfig(raw);
  if (!config) {
    const sample = JSON.stringify(raw).slice(0, 200);
    throw new ModelScopeError(
      `拉取成功但内容不是有效的 config.json, 缺少模型结构字段。响应片段: ${sample}`,
      "format",
      sample,
    );
  }

  const arch = parseConfig(config);
  const totalParams = estimateParams(arch);
  return {
    modelId: id,
    arch,
    totalParamsB: totalParams / 1e9,
    modelType: config.model_type,
    rawConfig: raw as Record<string, unknown>,
  };
}

// 从可能被包装的响应中提取 config 对象
function extractConfig(raw: unknown): RawModelConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  // 直接是 config (含结构字段)
  if (hasStructFields(r)) {
    return r as RawModelConfig;
  }

  // 多模态模型 (VLM): 结构字段嵌套在 text_config / language_config 中
  // 例如 Qwen3_5ForConditionalGeneration / Qwen-VL / InternVL / Llava 等
  // 顶层只是 wrapper, 真正的语言模型参数在子对象里
  for (const key of [
    "text_config",
    "language_config",
    "llm_config",
    "language_model_config",
    "text_model_config",
  ]) {
    const inner = r[key];
    if (inner && typeof inner === "object") {
      const innerObj = inner as Record<string, unknown>;
      if (hasStructFields(innerObj)) {
        // 合并: 保留顶层元信息 (model_type / architectures),
        // 结构字段以嵌套语言模型配置为准
        return { ...r, ...innerObj } as RawModelConfig;
      }
    }
  }

  // 包装在 Data / data / Config 中
  for (const key of ["Data", "data", "Config", "config", "Body"]) {
    const inner = r[key];
    if (inner && typeof inner === "object") {
      const innerObj = inner as Record<string, unknown>;
      if (hasStructFields(innerObj)) {
        return innerObj as RawModelConfig;
      }
    }
  }

  return null;
}

// 判断对象是否包含足够的模型结构字段用于解析
function hasStructFields(obj: Record<string, unknown>): boolean {
  return (
    "num_hidden_layers" in obj ||
    "hidden_size" in obj ||
    "n_layers" in obj ||
    "num_layers" in obj ||
    "n_embd" in obj
  );
}

// 依次尝试直连与代理, 返回首个成功的 JSON
async function fetchWithFallback(url: string): Promise<unknown> {
  // 1. 直连 (ModelScope 部分接口允许 CORS)
  const direct = await tryFetchJson(url);
  if (direct.ok) return direct.data;

  // 2. 代理兜底
  for (const proxy of CORS_PROXIES) {
    const r = await tryFetchJson(proxy(url));
    if (r.ok) return r.data;
  }

  throw new ModelScopeError(
    "拉取失败: ModelScope 接口被浏览器 CORS 拦截, 且所有公共代理均不可用。可改用「预设模型」或「自定义」手动输入结构参数。",
    "cors",
  );
}

// 尝试 fetch 并解析 JSON, 失败返回 { ok: false }
// 处理代理可能返回的字符串包装 ({contents: "..."} 等)
async function tryFetchJson(
  url: string,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json,text/plain;q=0.9,*/*;q=0.1" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const text = await res.text();

    // 直接解析
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch {
      // 可能是 allorigins 的包装格式 {contents: "...", status: {...}}
      try {
        const wrapped = JSON.parse(text);
        if (wrapped && typeof wrapped === "object") {
          // allorigins/get 格式: {contents: "<原始JSON字符串>"}
          if (typeof wrapped.contents === "string") {
            try {
              return { ok: true, data: JSON.parse(wrapped.contents) };
            } catch {
              // contents 不是 JSON
            }
          }
          // 其他包装: {data: "..."} 或 {body: "..."}
          for (const key of ["data", "body", "text"]) {
            if (typeof wrapped[key] === "string") {
              try {
                return { ok: true, data: JSON.parse(wrapped[key]) };
              } catch {
                // 不是 JSON
              }
            }
          }
        }
      } catch {
        // 不是 JSON
      }
      return { ok: false, error: "非 JSON 响应" };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "网络错误",
    };
  }
}

/**
 * 解析 config.json -> 统一 ModelArch
 * 兼容多家族字段命名:
 *   Llama / Mistral / Qwen / DeepSeek: num_hidden_layers, num_attention_heads, hidden_size, intermediate_size
 *   GLM / ChatGLM: num_layers, num_attention_heads, multi_query_group_num, ffn_hidden_size, padded_vocab_size, seq_length, kv_channels
 *   GPT / Falcon: n_layers, n_heads, n_embd, n_inner
 */
export function parseConfig(cfg: RawModelConfig): ModelArch {
  // 层数 (多种字段名)
  const numLayers = cfg.num_hidden_layers ?? cfg.num_layers ?? cfg.n_layers ?? 0;

  // 注意力头数
  const numAttnHeads = cfg.num_attention_heads ?? cfg.n_heads ?? 0;

  // 隐藏维度
  const hiddenSize = cfg.hidden_size ?? cfg.n_embd ?? 0;

  // 词表大小
  const vocabSize = cfg.vocab_size ?? cfg.padded_vocab_size ?? 32000;

  // 最大序列长度
  const maxSeqLen =
    cfg.max_position_embeddings ??
    cfg.seq_length ??
    cfg.max_sequence_length ??
    cfg.n_positions ??
    4096;

  // FFN 中间维度
  const intermediateSize =
    cfg.intermediate_size ??
    cfg.ffn_hidden_size ??
    cfg.n_inner ??
    cfg.moe_intermediate_size ??
    Math.floor((hiddenSize || 4096) * 4 * (4 / 3));

  // KV 头数 - GQA/MQA 兼容
  let numKVHeads =
    cfg.num_key_value_heads ??
    cfg.multi_query_group_num ??
    cfg.num_kv_heads ??
    numAttnHeads;

  // MQA 标志位 (GLM 用 multi_query_attention: true 表示, num_kv_heads=1)
  if (
    cfg.multi_query_attention === true &&
    !cfg.multi_query_group_num &&
    !cfg.num_key_value_heads
  ) {
    numKVHeads = 1;
  }

  const isGQA = numKVHeads < numAttnHeads;

  // head_dim: 通常 hidden / heads, GLM 用 kv_channels
  const headDim =
    cfg.kv_channels ??
    cfg.head_dim ??
    (hiddenSize && numAttnHeads ? hiddenSize / numAttnHeads : 128);

  if (!numLayers || !numAttnHeads || !hiddenSize) {
    const found = Object.keys(cfg).slice(0, 15).join(", ");
    throw new ModelScopeError(
      `config.json 缺少关键结构字段 (num_hidden_layers / num_attention_heads / hidden_size), 无法解析。已识别字段: ${found}`,
      "format",
    );
  }

  // numKVHeads 不能超过 numAttnHeads
  if (numKVHeads > numAttnHeads) numKVHeads = numAttnHeads;

  // MoE 专家配置 (多家族命名兼容)
  // 总专家数: num_experts / num_local_experts / moe_num_experts / n_routed_experts
  const numExperts =
    cfg.num_experts ??
    cfg.num_local_experts ??
    cfg.moe_num_experts ??
    cfg.n_routed_experts ??
    0;
  // 每次激活专家数 (top-k): num_activated_experts / moe_topk / num_experts_per_tok
  const numActivatedExperts =
    cfg.num_activated_experts ??
    cfg.moe_topk ??
    cfg.num_experts_per_tok ??
    0;
  // MoE 判定: 有专家数且 > 1 即视为 MoE
  const isMoE = numExperts > 1;
  // MoE 单专家中间维度优先于通用 intermediate_size
  const moeIntermediate =
    cfg.expert_intermediate_size ?? cfg.moe_intermediate_size ?? null;
  const finalIntermediate = isMoE && moeIntermediate
    ? moeIntermediate
    : intermediateSize;

  return {
    numLayers,
    numAttnHeads,
    numKVHeads,
    hiddenSize,
    intermediateSize: finalIntermediate,
    vocabSize,
    maxSeqLen,
    headDim,
    isGQA,
    isMoE,
    numExperts,
    numActivatedExperts: numActivatedExperts || (isMoE ? 2 : 0),
  };
}
