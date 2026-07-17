// 全局状态: 模型 + 部署配置 + ModelScope 拉取状态
import { create } from "zustand";
import type {
  ModelArch,
  DeployConfig,
  ModelSource,
  FetchStatus,
  PresetModel,
  ModelScopeResult,
} from "@/types";
import { PRESET_MODELS } from "@/data/presetModels";
import { fetchModelConfig, ModelScopeError } from "@/lib/modelscope";
import { estimateParams } from "@/lib/vram";

// 默认架构 (Llama-3-8B 对齐, 便于首次进入即看到完整结果)
const DEFAULT_ARCH: ModelArch = {
  numLayers: 32,
  numAttnHeads: 32,
  numKVHeads: 8,
  hiddenSize: 4096,
  intermediateSize: 14336,
  vocabSize: 128256,
  maxSeqLen: 8192,
  headDim: 128,
  isGQA: true,
  isMoE: false,
  numExperts: 0,
  numActivatedExperts: 0,
};

const DEFAULT_DEPLOY: DeployConfig = {
  weightPrecision: "FP16",
  kvPrecision: "FP16",
  batchSize: 1,
  seqLength: 4096,
  concurrency: 1,
  tensorParallel: 1,
  expertParallel: 1,
  framework: "vllm",
};

interface CalcState {
  source: ModelSource;
  arch: ModelArch;
  totalParamsB: number; // 显式参数量 (十亿), 可被预设/ModelScope 覆盖
  modelName: string;
  deploy: DeployConfig;

  // ModelScope 拉取
  modelscopeId: string;
  fetchStatus: FetchStatus;
  fetchError: string;
  fetchProgress: string;

  // 公式抽屉
  drawerOpen: boolean;

  // 是否已点击"开始计算" - 控制右侧结果显示
  hasCalculated: boolean;
  // 上次计算快照 (锁定后的输入, 用于显示稳定结果)
  calcSnapshot: {
    arch: ModelArch;
    deploy: DeployConfig;
    totalParams: number;
    modelName: string;
  } | null;

  // actions
  setSource: (s: ModelSource) => void;
  setArch: (patch: Partial<ModelArch>) => void;
  setDeploy: (patch: Partial<DeployConfig>) => void;
  setModelscopeId: (id: string) => void;
  selectPreset: (m: PresetModel) => void;
  fetchModelscope: () => Promise<void>;
  openDrawer: (open: boolean) => void;
  calculate: () => void;
  resetCalc: () => void;

  // 派生
  totalParams: number; // 总参数量 (原始个数)
}

export const useCalcStore = create<CalcState>((set, get) => ({
  source: "preset",
  arch: DEFAULT_ARCH,
  totalParamsB: PRESET_MODELS[0].totalParamsB,
  modelName: PRESET_MODELS[0].name,
  deploy: DEFAULT_DEPLOY,

  modelscopeId: "Qwen/Qwen3.6-27B",
  fetchStatus: "idle",
  fetchError: "",
  fetchProgress: "",

  drawerOpen: false,

  hasCalculated: false,
  calcSnapshot: null,

  setSource: (s) => {
    if (s === "custom") {
      set({
        source: s,
        modelName: "自定义模型",
        fetchStatus: "idle",
        fetchError: "",
        hasCalculated: false, // 切换来源重置计算状态
      });
    } else {
      set({ source: s, fetchStatus: "idle", fetchError: "", hasCalculated: false });
    }
  },

  setArch: (patch) => {
    const nextArch = { ...get().arch, ...patch };
    // head_dim 自动重算 (除非显式设置)
    if (
      (patch.hiddenSize !== undefined || patch.numAttnHeads !== undefined) &&
      patch.headDim === undefined
    ) {
      nextArch.headDim =
        nextArch.numAttnHeads > 0
          ? Math.floor(nextArch.hiddenSize / nextArch.numAttnHeads)
          : nextArch.headDim;
    }
    nextArch.isGQA = nextArch.numKVHeads < nextArch.numAttnHeads;
    const totalParams = estimateParams(nextArch);
    set({
      arch: nextArch,
      totalParamsB: totalParams / 1e9,
      totalParams,
    });
  },

  setDeploy: (patch) => set((st) => ({ deploy: { ...st.deploy, ...patch } })),
  setModelscopeId: (id) => set({ modelscopeId: id }),
  selectPreset: (m) =>
    set({
      source: "preset",
      modelName: m.name,
      arch: { ...m.arch },
      totalParamsB: m.totalParamsB,
      totalParams: m.totalParamsB * 1e9,
      fetchStatus: "idle",
      fetchError: "",
      hasCalculated: false, // 选择新模型重置
      calcSnapshot: null,
    }),

  fetchModelscope: async () => {
    const id = get().modelscopeId.trim();
    if (!id) return;
    set({
      fetchStatus: "loading",
      fetchError: "",
      fetchProgress: "正在连接魔搭社区...",
      hasCalculated: false, // 拉取中重置
      calcSnapshot: null,
    });
    try {
      set({ fetchProgress: "拉取 config.json..." });
      const result: ModelScopeResult = await fetchModelConfig(id);
      set({
        arch: { ...result.arch },
        totalParamsB: result.totalParamsB,
        totalParams: result.totalParamsB * 1e9,
        modelName: id.split("/").pop() || id,
        fetchStatus: "success",
        fetchProgress: "",
        hasCalculated: false, // 拉取成功后等待用户点击计算
        calcSnapshot: null,
      });
    } catch (e) {
      const msg =
        e instanceof ModelScopeError
          ? e.message
          : e instanceof Error
            ? e.message
            : "未知错误";
      set({ fetchStatus: "error", fetchError: msg, fetchProgress: "" });
    }
  },

  openDrawer: (open) => set({ drawerOpen: open }),

  // 点击"开始计算" - 锁定当前输入作为快照, 渲染右侧结果
  calculate: () => {
    const st = get();
    set({
      hasCalculated: true,
      calcSnapshot: {
        arch: { ...st.arch },
        deploy: { ...st.deploy },
        totalParams: st.totalParams,
        modelName: st.modelName,
      },
    });
  },

  resetCalc: () =>
    set({ hasCalculated: false, calcSnapshot: null }),

  totalParams: estimateParams(DEFAULT_ARCH),
}));

// 计算初始 totalParams
useCalcStore.setState((st) => ({
  totalParams: estimateParams(st.arch),
}));
