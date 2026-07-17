// 内置预设模型库 - 主流大模型结构参数
// 参数来源: 各模型官方 config.json (经整理)
import type { PresetModel } from "@/types";

export const PRESET_MODELS: PresetModel[] = [
  {
    id: "llama3-8b",
    name: "Llama-3-8B",
    family: "Llama",
    totalParamsB: 8.03,
    modelscopeId: "LLM-Research/Meta-Llama-3-8B",
    arch: {
      numLayers: 32,
      numAttnHeads: 32,
      numKVHeads: 8, // GQA
      hiddenSize: 4096,
      intermediateSize: 14336,
      vocabSize: 128256,
      maxSeqLen: 8192,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "llama3-70b",
    name: "Llama-3-70B",
    family: "Llama",
    totalParamsB: 70.3,
    modelscopeId: "LLM-Research/Meta-Llama-3-70B",
    arch: {
      numLayers: 80,
      numAttnHeads: 64,
      numKVHeads: 8, // GQA
      hiddenSize: 8192,
      intermediateSize: 28672,
      vocabSize: 128256,
      maxSeqLen: 8192,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "qwen25-7b",
    name: "Qwen2.5-7B",
    family: "Qwen",
    totalParamsB: 7.62,
    modelscopeId: "Qwen/Qwen2.5-7B-Instruct",
    arch: {
      numLayers: 28,
      numAttnHeads: 28,
      numKVHeads: 4, // GQA
      hiddenSize: 3584,
      intermediateSize: 18944,
      vocabSize: 152064,
      maxSeqLen: 32768,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "qwen25-72b",
    name: "Qwen2.5-72B",
    family: "Qwen",
    totalParamsB: 72.7,
    modelscopeId: "Qwen/Qwen2.5-72B-Instruct",
    arch: {
      numLayers: 80,
      numAttnHeads: 64,
      numKVHeads: 8, // GQA
      hiddenSize: 8192,
      intermediateSize: 29568,
      vocabSize: 152064,
      maxSeqLen: 32768,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "glm4-9b",
    name: "GLM-4-9B-Chat",
    family: "GLM",
    totalParamsB: 9.4,
    modelscopeId: "ZhipuAI/glm-4-9b-chat",
    arch: {
      numLayers: 40,
      numAttnHeads: 32,
      numKVHeads: 2, // GQA
      hiddenSize: 4096,
      intermediateSize: 13696,
      vocabSize: 151552,
      maxSeqLen: 131072,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "deepseek-v2-lite",
    name: "DeepSeek-V2-Lite (MoE)",
    family: "DeepSeek",
    totalParamsB: 15.7, // 总参数 (含全部 64 专家), 激活约 2.4B
    modelscopeId: "deepseek-ai/DeepSeek-V2-Lite",
    arch: {
      numLayers: 27,
      numAttnHeads: 16,
      numKVHeads: 16,
      hiddenSize: 2048,
      intermediateSize: 5632, // moe_intermediate_size (单专家)
      vocabSize: 102400,
      maxSeqLen: 4096,
      headDim: 128,
      isGQA: false,
      isMoE: true,
      numExperts: 64, // n_routed_experts
      numActivatedExperts: 6, // num_activated_experts
    },
  },
  {
    id: "mistral-7b",
    name: "Mistral-7B",
    family: "Mistral",
    totalParamsB: 7.24,
    modelscopeId: "AI-ModelScope/Mistral-7B-Instruct-v0.2",
    arch: {
      numLayers: 32,
      numAttnHeads: 32,
      numKVHeads: 8, // GQA
      hiddenSize: 4096,
      intermediateSize: 14336,
      vocabSize: 32000,
      maxSeqLen: 32768,
      headDim: 128,
      isGQA: true,
      isMoE: false,
      numExperts: 0,
      numActivatedExperts: 0,
    },
  },
  {
    id: "mixtral-8x7b",
    name: "Mixtral-8x7B (MoE)",
    family: "Mistral",
    totalParamsB: 46.7, // 总参数 (含全部 8 专家), 激活约 12.9B
    modelscopeId: "AI-ModelScope/Mixtral-8x7B-Instruct-v0.1",
    arch: {
      numLayers: 32,
      numAttnHeads: 32,
      numKVHeads: 8, // GQA
      hiddenSize: 4096,
      intermediateSize: 14336, // 单专家中间维度
      vocabSize: 32000,
      maxSeqLen: 32768,
      headDim: 128,
      isGQA: true,
      isMoE: true,
      numExperts: 8,
      numActivatedExperts: 2,
    },
  },
];
