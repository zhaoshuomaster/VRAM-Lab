// 大模型显存评估 - 类型定义

// 量化精度
export type Precision = "FP32" | "FP16" | "BF16" | "INT8" | "INT4";

// 推理框架
export type Framework = "vllm" | "tgi" | "lmdeploy" | "llama_cpp" | "custom";

// 模型来源
export type ModelSource = "custom" | "modelscope" | "preset";

// 模型架构参数 (统一解析后)
export interface ModelArch {
  numLayers: number;
  numAttnHeads: number;
  numKVHeads: number; // 无 GQA 时等于 numAttnHeads
  hiddenSize: number;
  intermediateSize: number; // dense: FFN 中间维度; MoE: 单个专家的中间维度
  vocabSize: number;
  maxSeqLen: number;
  // 派生 (计算时使用)
  headDim: number; // hiddenSize / numAttnHeads
  isGQA: boolean;
  // MoE (混合专家) 字段 - dense 模型为 0/false
  isMoE: boolean;
  numExperts: number; // 总专家数 (如 Mixtral=8, DeepSeek-V4-Flash=256+)
  numActivatedExperts: number; // 每次推理激活的专家数 (如 Mixtral=2)
}

// 部署配置
export interface DeployConfig {
  weightPrecision: Precision;
  kvPrecision: Precision;
  batchSize: number;
  seqLength: number; // 上下文长度 (推理序列长度, 影响 KV Cache 与激活值)
  concurrency: number; // 并发请求数 (影响 KV Cache 总量)
  tensorParallel: number; // TP 张量并行度 (分摊权重/KV/激活到多卡)
  expertParallel: number; // EP 专家并行度 (MoE 专家分摊, 影响 GPU 总数)
  framework: Framework;
}

// 单卡显存明细 (考虑 TP/EP 切分后, 每张卡的实际占用)
export interface PerGpuBreakdown {
  weights: number; // 权重 ÷ TP
  kvCache: number; // KV 缓存 ÷ TP
  activations: number; // 激活值 ÷ TP
  framework: number; // 框架开销 (每卡独立)
  total: number; // 单卡总显存
  gpuCount: number; // 所需 GPU 总数 = TP × EP
  tp: number;
  ep: number;
}

// 显存分项计算结果 (字节)
export interface VramBreakdown {
  weights: number; // 模型权重 (总量)
  kvCache: number; // KV 缓存 (总量)
  activations: number; // 临时激活值 (总量)
  framework: number; // 框架开销
  total: number; // 总显存 (未切分)
  perGpu: PerGpuBreakdown; // 单卡视角 (切分后)
}

// 单项详情 (带说明, 用于 UI 展示)
export interface VramItem {
  key: keyof Omit<VramBreakdown, "total">;
  label: string;
  bytes: number;
  gb: number;
  formula: string;
  note: string;
}

// 预设模型
export interface PresetModel {
  id: string;
  name: string;
  family: string;
  arch: ModelArch;
  totalParamsB: number; // 参数量 (十亿)
  modelscopeId?: string; // 对应魔搭 ID
}

// GPU 规格
export interface GpuSpec {
  id: string;
  name: string;
  vramGB: number;
  tier: "consumer" | "datacenter" | "domestic"; // domestic = 国产算力卡
  vendor: "nvidia" | "amd" | "ascend" | "cambricon" | "iluvatar" | "moore" | "metax";
  releaseYear: number;
  notes?: string;
}

// ModelScope 拉取状态
export type FetchStatus = "idle" | "loading" | "success" | "error";

// ModelScope 拉取结果
export interface ModelScopeResult {
  modelId: string;
  arch: ModelArch;
  totalParamsB: number;
  modelType?: string;
  rawConfig?: Record<string, unknown>;
}

// ModelScope config.json 原始字段 (多家族兼容)
export interface RawModelConfig {
  // Llama / Mistral / Qwen / DeepSeek 标准字段
  num_hidden_layers?: number;
  num_attention_heads?: number;
  num_key_value_heads?: number; // GQA
  hidden_size?: number;
  intermediate_size?: number;
  vocab_size?: number;
  max_position_embeddings?: number;
  // GPT / Falcon 兼容字段
  n_layers?: number;
  n_heads?: number;
  n_embd?: number;
  n_inner?: number;
  n_positions?: number;
  // GLM / ChatGLM 特有
  num_layers?: number; // GLM 也用此字段
  ffn_hidden_size?: number;
  padded_vocab_size?: number;
  seq_length?: number;
  kv_channels?: number;
  multi_query_attention?: boolean;
  multi_query_group_num?: number;
  head_dim?: number;
  num_kv_heads?: number;
  max_sequence_length?: number;
  // MoE / 其他
  moe_intermediate_size?: number;
  model_type?: string;
  torch_dtype?: string;
  architectures?: string[];
  // MoE 专家配置 (多家族命名兼容)
  num_experts?: number; // 总专家数 (Mixtral/Qwen-MoE/DeepSeek-MoE)
  num_activated_experts?: number; // 每次激活专家数 (DeepSeek-V2/V3)
  num_local_experts?: number; // Mixtral 风格
  expert_intermediate_size?: number; // 单专家中间维度 (部分实现)
  moe_num_experts?: number; // GLM-MoE 风格
  moe_topk?: number; // 激活 top-k 专家数
  n_routed_experts?: number; // DeepSeek-V2 风格
  num_experts_per_tok?: number; // 每token激活专家数 (通用)
}
