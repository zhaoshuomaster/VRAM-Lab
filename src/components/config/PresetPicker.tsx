// 预设模型库选择器
import { Check, Layers } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { PRESET_MODELS } from "@/data/presetModels";
import { SectionTitle, Pill } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export function PresetPicker() {
  const selectPreset = useCalcStore((s) => s.selectPreset);
  const arch = useCalcStore((s) => s.arch);
  const totalParamsB = useCalcStore((s) => s.totalParamsB);
  const modelName = useCalcStore((s) => s.modelName);

  return (
    <div className="panel p-4 panel-hover">
      <SectionTitle
        index="01"
        title="预设模型库"
        hint={`${PRESET_MODELS.length} 款主流模型`}
      />

      <div className="grid grid-cols-1 gap-1.5 max-h-[280px] overflow-y-auto pr-1">
        {PRESET_MODELS.map((m) => {
          const active = m.name === modelName;
          return (
            <button
              key={m.id}
              onClick={() => selectPreset(m)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-all",
                active
                  ? "border-neon-400/50 bg-neon-400/8 shadow-neon-soft"
                  : "border-edge bg-void-800/40 hover:border-neon-400/30 hover:bg-void-800/70",
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center border",
                  active
                    ? "border-neon-400/50 bg-neon-400/15"
                    : "border-edge bg-void-850 group-hover:border-neon-400/30",
                )}
              >
                <Layers
                  className={cn(
                    "w-3.5 h-3.5",
                    active ? "text-neon-400" : "text-ink-500",
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[13px] font-medium text-ink-100 truncate">
                    {m.name}
                  </span>
                  {active && (
                    <Check className="w-3 h-3 text-neon-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] text-ink-500">
                    {m.family}
                  </span>
                  <span className="font-mono text-[10px] text-ink-700">·</span>
                  <span className="font-mono text-[10px] tnum text-neon-300/80">
                    {m.totalParamsB}B
                  </span>
                  {m.arch.isGQA && (
                    <Pill tone="magenta" className="!text-[9px] !px-1 !py-0">
                      GQA
                    </Pill>
                  )}
                  {m.arch.isMoE && (
                    <Pill tone="neon" className="!text-[9px] !px-1 !py-0">
                      MoE
                    </Pill>
                  )}
                </div>
              </div>

              <div className="font-mono text-[10px] text-ink-700 text-right">
                <div>{m.arch.numLayers}L</div>
                <div>{m.arch.hiddenSize}d</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 当前选择概览 */}
      <div className="mt-3 pt-3 border-t border-edge grid grid-cols-3 gap-2 text-center">
        <MiniStat label="参数量" value={`${totalParamsB.toFixed(2)}B`} />
        <MiniStat label="层数" value={`${arch.numLayers}`} />
        <MiniStat label="隐藏维" value={`${arch.hiddenSize}`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label-tiny mb-0.5">{label}</div>
      <div className="font-mono text-sm tnum text-ink-100">{value}</div>
    </div>
  );
}
