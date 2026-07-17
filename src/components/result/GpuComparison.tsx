// GPU 适配横条对比 - 含国产算力卡 + 所需显卡数计算
import { motion } from "framer-motion";
import { useCalcStore } from "@/store/useCalcStore";
import { calcVram } from "@/lib/vram";
import { GPU_SPECS } from "@/data/gpuSpecs";
import { SectionTitle, Pill } from "@/components/ui/primitives";
import { Server, Check, X } from "lucide-react";
import type { GpuSpec } from "@/types";

// 厂商分组配置
const VENDOR_GROUPS: {
  key: string;
  label: string;
  vendors: GpuSpec["vendor"][];
}[] = [
  { key: "nvidia", label: "NVIDIA", vendors: ["nvidia"] },
  { key: "amd", label: "AMD", vendors: ["amd"] },
  { key: "domestic", label: "国产算力卡", vendors: ["ascend", "cambricon", "metax", "moore", "iluvatar"] },
];

export function GpuComparison() {
  // 使用快照数据
  const snapshot = useCalcStore((s) => s.calcSnapshot);
  const arch = snapshot?.arch ?? useCalcStore.getState().arch;
  const deploy = snapshot?.deploy ?? useCalcStore.getState().deploy;
  const totalParams = snapshot?.totalParams ?? useCalcStore.getState().totalParams;
  const breakdown = calcVram(arch, deploy, totalParams);
  // 单卡显存是适配判断依据 (TP 切分后每卡占用)
  const perGpuGB = breakdown.perGpu.total / 1024 ** 3;
  const totalVramGB = breakdown.total / 1024 ** 3;
  const { gpuCount, tp, ep } = breakdown.perGpu;
  const isParallel = gpuCount > 1;

  // 按显存升序, 用于可视化
  const gpus = [...GPU_SPECS].sort((a, b) => a.vramGB - b.vramGB);
  const maxVram = Math.max(...gpus.map((g) => g.vramGB), perGpuGB);

  // 计算单款 GPU 所需最少卡数 (按 TP 切分后单卡占用 vs 该卡显存)
  // 卡数 = ceil(单卡占用 / 该卡显存) 再向上取到 TP 的整数倍 (TP 必须整除卡数)
  function cardsNeeded(g: GpuSpec): number {
    if (g.vramGB >= perGpuGB) return gpuCount; // 单卡够, 用配置的卡数
    // 单卡不够, 需要更多卡: 按总显存 ÷ 该卡显存向上取整
    const byTotal = Math.ceil(totalVramGB / (g.vramGB * 0.9)); // 90% 利用率上限
    // 向上取到 TP 的整数倍 (保证 TP 整除)
    const tpVal = Math.max(1, tp);
    return Math.max(tpVal, Math.ceil(byTotal / tpVal) * tpVal);
  }

  return (
    <div className="panel p-4">
      <SectionTitle
        index="04"
        title="GPU 适配对比"
        hint={`${gpus.length} 款显卡 (含国产)`}
      />

      {/* 当前需求指示线 */}
      <div className="mb-3 flex items-center gap-2 text-[11px] flex-wrap">
        <Pill tone="neon">
          <Server className="w-2.5 h-2.5" />
          单卡需求
        </Pill>
        <span className="font-mono tnum text-neon-300 font-semibold">
          {perGpuGB.toFixed(2)} GB
        </span>
        {isParallel && (
          <>
            <span className="text-ink-700">·</span>
            <span className="font-mono text-[10px] text-ink-500">
              TP{tp}×EP{ep} = {gpuCount} 卡
            </span>
          </>
        )}
        <span className="text-ink-700">·</span>
        <span className="font-mono text-[10px] text-ink-500">
          可单卡: {gpus.filter((g) => g.vramGB >= perGpuGB).length} / {gpus.length} 款
        </span>
      </div>

      {/* 按厂商分组渲染 */}
      <div className="flex flex-col gap-4">
        {VENDOR_GROUPS.map((group) => {
          const groupGpus = gpus.filter((g) => group.vendors.includes(g.vendor));
          if (groupGpus.length === 0) return null;
          return (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
                  {group.label}
                </span>
                <span className="flex-1 h-px bg-edge" />
                <span className="font-mono text-[9px] text-ink-700">
                  {groupGpus.length} 款
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {groupGpus.map((g, i) => {
                  const fit = g.vramGB >= perGpuGB;
                  const usageRatio = Math.min(perGpuGB / g.vramGB, 1);
                  const widthRatio = g.vramGB / maxVram;
                  const need = cardsNeeded(g);

                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="flex items-center gap-2"
                    >
                      {/* 名称 */}
                      <div className="w-28 flex-shrink-0 flex items-center gap-1.5">
                        {fit ? (
                          <Check className="w-3 h-3 text-neon-400 flex-shrink-0" />
                        ) : (
                          <X className="w-3 h-3 text-magenta-400 flex-shrink-0" />
                        )}
                        <span className="font-mono text-[11px] text-ink-300 truncate">
                          {g.name}
                        </span>
                      </div>

                      {/* 横条 */}
                      <div className="flex-1 relative h-5 rounded bg-void-850 overflow-hidden border border-edge/50">
                        {/* GPU 显存容量条 */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthRatio * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.1 + i * 0.04 }}
                          className={`absolute inset-y-0 left-0 ${
                            fit
                              ? "bg-gradient-to-r from-neon-400/15 to-neon-400/30"
                              : "bg-gradient-to-r from-magenta-500/15 to-magenta-500/25"
                          }`}
                        />
                        {/* 占用部分 */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthRatio * usageRatio * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.3 + i * 0.04 }}
                          className={`absolute inset-y-0 left-0 ${
                            fit
                              ? "bg-gradient-to-r from-neon-400/60 to-neon-400"
                              : "bg-gradient-to-r from-magenta-500/70 to-magenta-500"
                          }`}
                          style={{ boxShadow: fit ? "0 0 12px rgba(var(--neon-400), 0.5)" : "0 0 12px rgba(var(--magenta-500), 0.5)" }}
                        />
                        {/* 需求指示线 (超出的情况) */}
                        {!fit && (
                          <div className="absolute inset-y-0 right-0 w-0.5 bg-amber-400 shadow-[0_0_6px_rgb(var(--amber-400)/0.8)]" />
                        )}
                        {/* 容量标签 */}
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 font-mono text-[9px] text-ink-300 tnum">
                          {g.vramGB}G
                        </span>
                      </div>

                      {/* 状态 + 所需卡数 */}
                      <div className="w-20 flex-shrink-0 text-right">
                        {fit ? (
                          <div className="flex flex-col items-end leading-tight">
                            <span className="font-mono text-[10px] text-neon-300">
                              {isParallel ? `${gpuCount}× 卡` : "单卡可部署"}
                            </span>
                            <span className="font-mono text-[8px] text-ink-700 tnum">
                              {(usageRatio * 100).toFixed(0)}% 占用
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end leading-tight">
                            <span className="font-mono text-[10px] text-amber-400">
                              需 {need}× 卡
                            </span>
                            <span className="font-mono text-[8px] text-ink-700 tnum">
                              TP{Math.max(1, tp)} 起
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-3 pt-3 border-t border-edge flex items-center gap-4 text-[10px] font-mono flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-neon-400" />
          <span className="text-ink-500">可单卡部署</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-magenta-500" />
          <span className="text-ink-500">需多卡 (标注张数)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2 h-2 rounded-sm bg-amber-400" />
          <span className="text-ink-500">超出单卡上限</span>
        </div>
      </div>
    </div>
  );
}
