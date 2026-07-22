# VRAM·Lab — 大模型部署显存评估平台

> 自定义模型或从魔搭社区拉取 config.json，精确分解权重 / KV 缓存 / 临时激活值 / 框架开销四项显存，并给出主流 GPU（含国产算力卡）适配建议与 vLLM 启动参数。

## 功能概览

### 四项显存精确计算

| 分项 | 说明 | 关键参数 |
|------|------|----------|
| **模型权重** | 加载模型权重的基础显存 | 参数量 × 量化精度 (FP16=2B/参, INT4=0.5B/参) |
| **KV 缓存** | 生成式任务特有，存储历史 Token 的 Key/Value | 2 × L × KV头 × head_dim × seq × 并发 |
| **临时激活值** | 前向计算中间张量，算完即弃，仅 prefill 峰值 | batch × seq × (4×hidden + 2×intermediate × 激活专家) |
| **框架开销** | 推理框架启动开销 | vLLM ~1GB / TGI ~0.8GB / llama.cpp ~0.2GB |

### 三种模型来源

- **预设模型库**：内置 4 款国内主流开源模型（DeepSeek-V4-Pro MoE、DeepSeek-V4-Flash MoE、Qwen3.6-27B、GLM-5.2 MoE）
- **魔搭拉取**：输入 ModelScope 模型 ID，自动拉取并解析 config.json（支持多模态 VLM 嵌套结构、多家族字段兼容、多 CORS 代理兜底）
- **自定义输入**：手动填写层数、隐藏维度、KV 头数等架构参数

### MoE 混合专家支持

- 解析 `num_experts` / `num_activated_experts` 等字段（兼容 Mixtral / DeepSeek / Qwen-MoE / GLM-MoE 命名）
- 权重显存按**总参数**（含全部专家）计算
- 激活值按**激活参数**（仅 top-k 专家）计算

### 部署参数配置

- 权重精度：FP32 / FP16 / BF16 / INT8 / INT4
- KV 缓存精度：FP16 / INT8
- 上下文长度、批大小、并发数
- 张量并行 TP（1-64）、专家并行 EP（1-64）
- 推理框架：vLLM / TGI / LMDeploy / llama.cpp

### GPU 适配对比

- 内置 25 款显卡，含国产算力卡（华为昇腾、寒武纪、海光、沐曦、摩尔线程、天数智芯）
- 按厂商分组（NVIDIA / AMD / 国产算力卡）
- 自动计算单卡能否部署 + 超出时所需最少卡数（向上取整到 TP 整数倍）

### vLLM 启动参数生成

参考 [vLLM Docs](https://docs.vllm.ai/) 最佳实践，根据模型架构与显存评估自动生成：

- **核心参数**：`--model`、`--dtype`、`--tensor-parallel-size`、`--expert-parallel-size`
- **服务配置**：`--served-model-name`、`--api-key`
- **量化参数**：`--quantization` (fp8 / awq)
- **显存/上下文**：`--max-model-len`、`--gpu-memory-utilization`、`--kv-cache-dtype`
- **性能优化**：`--enable-chunked-prefill`、`--max-num-batched-tokens`、`--max-num-seqs`
- **工具调用**：`--enable-auto-tool-choice`、`--tool-call-parser` (qwen3_coder / deepseek_v3 / glm4)
- **推理输出**：`--enable-reasoning`、`--reasoning-parser` (qwen3 / deepseek_r1)
- 完整命令行预览 + 一键复制

### 双主题

- **暗色主题**：纯黑画布 (#121212) + 纯白关键数据 + 蓝色强调
- **明亮主题**：极浅蓝底 + 深蓝灰文字 + 蓝色主调
- 默认明亮模式，支持手动切换，localStorage 持久化，防闪烁加载

## 技术栈

| 技术 | 说明 |
|------|------|
| React 18 + TypeScript | 前端框架 |
| Vite 6 | 构建工具，HMR 热更新 |
| Tailwind CSS 3 | 原子化 CSS，CSS 变量驱动双主题 |
| Zustand 5 | 轻量状态管理（快照模式锁定计算结果） |
| Framer Motion 11 | 组件动画 |
| lucide-react | 图标库 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

开发服务器默认运行在 `http://localhost:5173/`。

## 项目结构

```
src/
├── components/
│   ├── config/            # 左侧配置区
│   │   ├── SourceTabs.tsx       # 模型来源切换 (预设/魔搭/自定义)
│   │   ├── PresetPicker.tsx     # 预设模型选择
│   │   ├── ModelScopePanel.tsx  # 魔搭模型拉取
│   │   ├── CustomForm.tsx       # 自定义参数表单
│   │   ├── DeployPanel.tsx      # 部署参数配置
│   │   ├── CalculateButton.tsx  # 开始计算按钮
│   │   └── ConfigColumn.tsx     # 左列容器
│   ├── result/            # 右侧结果区
│   │   ├── TotalVramCard.tsx    # 总显存卡片
│   │   ├── BreakdownList.tsx    # 分项明细
│   │   ├── RingChart.tsx        # 环形占比图
│   │   ├── GpuComparison.tsx    # GPU 适配对比
│   │   ├── LaunchConfigCard.tsx # vLLM 启动参数
│   │   ├── FormulaDrawer.tsx    # 公式说明抽屉
│   │   └── ResultColumn.tsx     # 右列容器
│   ├── layout/            # 布局
│   │   ├── TopBar.tsx           # 顶部状态栏
│   │   └── ThemeToggle.tsx      # 主题切换
│   └── ui/
│       └── primitives.tsx       # 基础 UI 组件
├── data/
│   ├── presetModels.ts          # 预设模型库
│   └── gpuSpecs.ts              # GPU 规格库
├── lib/
│   ├── vram.ts                  # 显存计算引擎 + 启动参数生成
│   ├── modelscope.ts            # 魔搭 API 解析
│   └── colors.ts                # 主题颜色工具
├── store/
│   └── useCalcStore.ts          # Zustand 状态管理
├── hooks/
│   └── useTheme.ts              # 主题 Hook
├── types/
│   └── index.ts                 # TypeScript 类型定义
├── pages/
│   └── Home.tsx                 # 主页布局
└── index.css                    # 全局样式 + 双主题变量
```

## 显存计算公式

### 1. 模型权重

```
权重显存 = 参数量 × 每参数字节数
```

- Dense 模型参数量 ≈ embedding + L × (注意力 + FFN) + lm_head
- MoE 模型参数量 ≈ embedding + L × (注意力 + numExperts × 单专家FFN) + lm_head

### 2. KV 缓存

```
KV缓存 = 2 × num_layers × num_kv_heads × head_dim × seq_length × 并发数 × bytes_per_param
```

TP 切分后单卡持有部分 KV 头。

### 3. 临时激活值

```
激活显存 = batch × seq × (4×hidden + 2×intermediate × activeExperts) × bytes
```

- 仅计算单层激活峰值（跨层复用缓冲，不乘 num_layers）
- MoE 模型 activeExperts = 激活专家数（非全部专家）

### 4. 框架开销

```
框架显存 = 固定开销 (vLLM ~1GB, TGI ~0.8GB, LMDeploy ~0.7GB, llama.cpp ~0.2GB)
```

### 单卡视角（TP/EP 切分）

```
单卡显存 = (权重 + KV + 激活) ÷ TP + 框架开销
GPU 总数 = TP × EP
```

## 内置 GPU 规格库

| 厂商 | 型号 | 显存 |
|------|------|------|
| NVIDIA | RTX 4060 Ti / 4080 / 3090 / 4090 | 16-24 GB |
| NVIDIA | A6000 / L40S / A100 / H100 | 40-80 GB |
| NVIDIA | H200 / B200 | 141-192 GB |
| AMD | MI300X / MI250X | 128-192 GB |
| 华为昇腾 | 910A / 910B / 910C / 310P | 24-80 GB |
| 寒武纪 | 思元 370 / 590 | 48 GB |
| 海光 | Z100 / K100 | 32-64 GB |
| 沐曦 | 曦云 C500 | 64 GB |
| 摩尔线程 | MTT S4000 | 48 GB |
| 天数智芯 | 天垓 BI-V150 | 32 GB |

## 说明

- 计算结果为工程化估算，实际占用因框架实现而异（±5-15%）
- 魔搭拉取使用公共 CORS 代理，稳定性受网络环境影响
- vLLM 启动参数仅供参考，实际部署需根据硬件和负载调优
