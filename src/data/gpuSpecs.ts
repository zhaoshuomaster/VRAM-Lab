// 内置 GPU 规格库 - 主流显卡 + 国产算力卡显存
import type { GpuSpec } from "@/types";

export const GPU_SPECS: GpuSpec[] = [
  // ============ NVIDIA 消费级 ============
  {
    id: "rtx4060ti16",
    name: "RTX 4060 Ti",
    vramGB: 16,
    tier: "consumer",
    vendor: "nvidia",
    releaseYear: 2023,
    notes: "入门级 LLM 推理",
  },
  {
    id: "rtx4080",
    name: "RTX 4080",
    vramGB: 16,
    tier: "consumer",
    vendor: "nvidia",
    releaseYear: 2022,
  },
  {
    id: "rtx3090",
    name: "RTX 3090",
    vramGB: 24,
    tier: "consumer",
    vendor: "nvidia",
    releaseYear: 2020,
    notes: "消费级性价比首选",
  },
  {
    id: "rtx4090",
    name: "RTX 4090",
    vramGB: 24,
    tier: "consumer",
    vendor: "nvidia",
    releaseYear: 2022,
    notes: "消费级单卡最强",
  },

  // ============ NVIDIA 数据中心 ============
  {
    id: "rtx-a6000",
    name: "RTX A6000",
    vramGB: 48,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2020,
  },
  {
    id: "l40s",
    name: "L40S",
    vramGB: 48,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2022,
    notes: "推理优化卡",
  },
  {
    id: "a100-40",
    name: "A100 (40GB)",
    vramGB: 40,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2020,
  },
  {
    id: "a100-80",
    name: "A100 (80GB)",
    vramGB: 80,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2021,
    notes: "训练推理通用",
  },
  {
    id: "h100-80",
    name: "H100 (80GB)",
    vramGB: 80,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2022,
    notes: "Hopper 架构旗舰",
  },
  {
    id: "h200-141",
    name: "H200 (141GB)",
    vramGB: 141,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2024,
    notes: "超大显存, 单卡部署 70B+ 模型",
  },
  {
    id: "b200-192",
    name: "B200 (192GB)",
    vramGB: 192,
    tier: "datacenter",
    vendor: "nvidia",
    releaseYear: 2024,
    notes: "Blackwell 架构, 单卡部署超大模型",
  },

  // ============ AMD ============
  {
    id: "mi300x",
    name: "Instinct MI300X",
    vramGB: 192,
    tier: "datacenter",
    vendor: "amd",
    releaseYear: 2023,
    notes: "AMD CDNA3, 192GB HBM3",
  },
  {
    id: "mi250x",
    name: "Instinct MI250X",
    vramGB: 128,
    tier: "datacenter",
    vendor: "amd",
    releaseYear: 2021,
  },

  // ============ 华为昇腾 Ascend ============
  {
    id: "ascend-910b",
    name: "昇腾 910B",
    vramGB: 64,
    tier: "domestic",
    vendor: "ascend",
    releaseYear: 2023,
    notes: "华为昇腾, 达芬奇架构",
  },
  {
    id: "ascend-910c",
    name: "昇腾 910C",
    vramGB: 80,
    tier: "domestic",
    vendor: "ascend",
    releaseYear: 2024,
    notes: "昇腾旗舰, 对标 H100",
  },
  {
    id: "ascend-910a",
    name: "昇腾 910A",
    vramGB: 32,
    tier: "domestic",
    vendor: "ascend",
    releaseYear: 2020,
  },
  {
    id: "ascend-310p",
    name: "昇腾 310P",
    vramGB: 24,
    tier: "domestic",
    vendor: "ascend",
    releaseYear: 2021,
    notes: "推理卡, 低功耗",
  },

  // ============ 寒武纪 Cambricon ============
  {
    id: "mlu-370",
    name: "思元 370",
    vramGB: 48,
    tier: "domestic",
    vendor: "cambricon",
    releaseYear: 2021,
    notes: "寒武纪 MLU370, 推理训练",
  },
  {
    id: "mlu-590",
    name: "思元 590",
    vramGB: 48,
    tier: "domestic",
    vendor: "cambricon",
    releaseYear: 2023,
    notes: "寒武纪新一代",
  },

  // ============ 海光 DCU ============
  {
    id: "hygon-z100",
    name: "海光 Z100",
    vramGB: 32,
    tier: "domestic",
    vendor: "amd",
    releaseYear: 2022,
    notes: "海光 DCU, 类 MI100 架构",
  },
  {
    id: "hygon-k100",
    name: "海光 K100",
    vramGB: 64,
    tier: "domestic",
    vendor: "amd",
    releaseYear: 2023,
  },

  // ============ 沐曦 Metax ============
  {
    id: "metax-macap500",
    name: "曦云 C500",
    vramGB: 64,
    tier: "domestic",
    vendor: "metax",
    releaseYear: 2023,
    notes: "沐曦 GPU",
  },

  // ============ 摩尔线程 Moore Threads ============
  {
    id: "mthreads-s4000",
    name: "MTT S4000",
    vramGB: 48,
    tier: "domestic",
    vendor: "moore",
    releaseYear: 2023,
    notes: "摩尔线程, 推理卡",
  },

  // ============ 天数智芯 Iluvatar ============
  {
    id: "iluvatar-bi-v150",
    name: "天垓 BI-V150",
    vramGB: 32,
    tier: "domestic",
    vendor: "iluvatar",
    releaseYear: 2022,
    notes: "天数智芯, 通用 GPU",
  },
];
