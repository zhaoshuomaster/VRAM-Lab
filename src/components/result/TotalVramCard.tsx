// 总显存结果卡: 单卡显存大数字 + 环图 + 并行配置 + 状态徽章
import { motion } from "framer-motion";
import { Cpu, TriangleAlert, CircleX, Layers, Server } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { calcVram } from "@/lib/vram";
import { RingChart, type RingSegment } from "./RingChart";
import { Pill } from "@/components/ui/primitives";
import { SEGMENT_COLORS } from "@/lib/colors";

export function TotalVramCard() {
  // 使用快照数据, 保证点击"开始计算"后右侧结果稳定不随输入跳动
  const snapshot = useCalcStore((s) => s.calcSnapshot);
  const arch = snapshot?.arch ?? useCalcStore.getState().arch;
  const deploy = snapshot?.deploy ?? useCalcStore.getState().deploy;
  const totalParams = snapshot?.totalParams ?? useCalcStore.getState().totalParams;
  const breakdown = calcVram(arch, deploy, totalParams);

  // 单卡显存 (考虑 TP 切分) - 部署核心指标
  const perGpuGB = breakdown.perGpu.total / 1024 ** 3;
  const totalGB = breakdown.total / 1024 ** 3;
  const { tp, ep, gpuCount } = breakdown.perGpu;
  const isParallel = gpuCount > 1;

  // 状态判定 (单卡显存相对参考卡)
  const state =
    perGpuGB <= 24
      ? "ok"
      : perGpuGB <= 80
        ? "warn"
        : "err";
  const stateMeta = {
    ok: { tone: "neon" as const, icon: Cpu, label: "可单卡部署" },
    warn: { tone: "amber" as const, icon: TriangleAlert, label: "需大显存卡" },
    err: { tone: "magenta" as const, icon: CircleX, label: "需更高并行" },
  }[state];
  const StateIcon = stateMeta.icon;

  // 环图分项 - 单卡视角
  const segments: RingSegment[] = [
    { key: "weights", label: "权重", value: breakdown.perGpu.weights, color: SEGMENT_COLORS.weights },
    { key: "kvCache", label: "KV Cache", value: breakdown.perGpu.kvCache, color: SEGMENT_COLORS.kvCache },
    { key: "activations", label: "激活", value: breakdown.perGpu.activations, color: SEGMENT_COLORS.activations },
    { key: "framework", label: "框架", value: breakdown.perGpu.framework, color: SEGMENT_COLORS.framework },
  ];

  return (
    <div className="panel p-5 relative overflow-hidden">
      {/* 背景辉光 */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-neon-400/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-magenta-500/5 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center">
        {/* 顶部标签 + 并行配置 */}
        <div className="flex items-center gap-2 mb-1 flex-wrap justify-center">
          <span className="label-tiny">单卡显存需求</span>
          <Pill tone={stateMeta.tone}>
            <StateIcon className="w-2.5 h-2.5" />
            {stateMeta.label}
          </Pill>
        </div>

        {/* 并行配置徽章 */}
        {isParallel && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-1"
          >
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-neon-400/30 bg-neon-400/5 font-mono text-[10px] text-neon-300">
              <Layers className="w-2.5 h-2.5" />
              TP{tp} × EP{ep}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-edge bg-void-800 font-mono text-[10px] text-ink-300">
              <Server className="w-2.5 h-2.5" />
              {gpuCount} 卡
            </span>
          </motion.div>
        )}

        {/* 环图 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="my-2"
        >
          <RingChart segments={segments} size={200} thickness={18} />
        </motion.div>

        {/* 总数读数 - 单卡显存为主 */}
        <motion.div
          key={perGpuGB.toFixed(2)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="font-mono text-[10px] text-ink-500 uppercase tracking-widest">
            Per-GPU VRAM
          </div>
          <div className="font-display text-4xl font-bold tnum text-ink-100 leading-none mt-1">
            {perGpuGB.toFixed(2)}
            <span className="text-lg text-neon-400 ml-1">GB</span>
          </div>
          {isParallel && (
            <div className="font-mono text-[10px] text-ink-500 mt-1.5 tnum">
              集群总量 {totalGB.toFixed(2)} GB
            </div>
          )}
        </motion.div>

        {/* 底部对照 */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-edge">
          <Reference label="RTX 4090" cap={24} used={perGpuGB} />
          <Reference label="A100 80G" cap={80} used={perGpuGB} />
          <Reference label="H200 141G" cap={141} used={perGpuGB} />
        </div>
      </div>
    </div>
  );
}

function Reference({
  label,
  cap,
  used,
}: {
  label: string;
  cap: number;
  used: number;
}) {
  const ratio = used / cap;
  const fit = ratio <= 1;
  return (
    <div className="text-center">
      <div className="label-tiny mb-0.5">{label}</div>
      <div
        className={`font-mono text-[11px] tnum ${fit ? "text-neon-300" : "text-magenta-400"}`}
      >
        {fit ? "✓ 可部署" : `超出 ${ratio.toFixed(1)}×`}
      </div>
      <div className="font-mono text-[9px] text-ink-700 tnum mt-0.5">
        {((ratio > 1 ? 1 : ratio) * 100).toFixed(0)}%
      </div>
    </div>
  );
}
