// 四项显存分项明细列表
import { motion } from "framer-motion";
import { Box, Database, Zap, Settings2 } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { calcVram, buildVramItems, formatGB } from "@/lib/vram";
import { SEGMENT_COLORS, soft } from "@/lib/colors";
import { MiniBar } from "./RingChart";
import { SectionTitle } from "@/components/ui/primitives";
import type { LucideIcon } from "lucide-react";

const ITEM_ICONS: Record<string, LucideIcon> = {
  weights: Box,
  kvCache: Database,
  activations: Zap,
  framework: Settings2,
};

export function BreakdownList() {
  // 使用快照数据
  const snapshot = useCalcStore((s) => s.calcSnapshot);
  const arch = snapshot?.arch ?? useCalcStore.getState().arch;
  const deploy = snapshot?.deploy ?? useCalcStore.getState().deploy;
  const totalParams = snapshot?.totalParams ?? useCalcStore.getState().totalParams;
  const breakdown = calcVram(arch, deploy, totalParams);
  const items = buildVramItems(breakdown, arch, deploy, totalParams);
  // 占比基于单卡总量 (与 item.bytes 的单卡视角一致)
  const total = breakdown.perGpu.total || 1;
  const isParallel = breakdown.perGpu.gpuCount > 1;
  const openDrawer = useCalcStore((s) => s.openDrawer);

  return (
    <div className="panel p-4">
      <SectionTitle
        index="03"
        title={isParallel ? `单卡显存分项 (TP${breakdown.perGpu.tp})` : "显存分项明细"}
        hint={`${items.length} 项`}
      />

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const Icon = ITEM_ICONS[item.key];
          const color = SEGMENT_COLORS[item.key];
          const fraction = item.bytes / total;
          const pct = (fraction * 100).toFixed(1);

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="group relative p-3 rounded-md border border-edge bg-void-800/40 hover:border-neon-400/30 hover:bg-void-800/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center border"
                  style={{
                    borderColor: soft(item.key, 0.3),
                    background: soft(item.key, 0.08),
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[13px] font-medium text-ink-100">
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-500">
                      {pct}%
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-ink-700 truncate mt-0.5">
                    {item.formula}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="font-mono text-sm font-semibold tnum"
                    style={{ color }}
                  >
                    {item.gb.toFixed(2)}
                  </div>
                  <div className="font-mono text-[9px] text-ink-700">GB</div>
                </div>
              </div>

              {/* 占比条 */}
              <div className="mt-2">
                <MiniBar fraction={fraction} color={color} />
              </div>

              {/* 说明 */}
              <p className="mt-2 text-[10px] text-ink-500 leading-snug">
                {item.note}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* 公式抽屉触发 */}
      <button
        onClick={() => openDrawer(true)}
        className="mt-3 w-full py-2 rounded-md border border-edge bg-void-800/40 hover:border-neon-400/30 hover:bg-void-800/70 transition-colors text-[11px] text-ink-300 font-mono"
      >
        查看完整计算公式 →
      </button>
    </div>
  );
}
