// 模型来源切换 Tab: 自定义 / ModelScope / 预设
import { SlidersHorizontal, CloudDownload, Library } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import type { ModelSource } from "@/types";
import { cn } from "@/lib/utils";

const TABS: { key: ModelSource; label: string; icon: typeof SlidersHorizontal }[] = [
  { key: "preset", label: "预设模型", icon: Library },
  { key: "modelscope", label: "魔搭拉取", icon: CloudDownload },
  { key: "custom", label: "自定义", icon: SlidersHorizontal },
];

export function SourceTabs() {
  const source = useCalcStore((s) => s.source);
  const setSource = useCalcStore((s) => s.setSource);

  return (
    <div className="panel p-1.5 flex gap-1">
      {TABS.map((t) => {
        const active = source === t.key;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => setSource(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-[12px] font-medium transition-all duration-200 relative",
              active
                ? "bg-neon-400/10 text-neon-300 border border-neon-400/40 shadow-neon-soft"
                : "text-ink-500 hover:text-ink-300 border border-transparent hover:bg-void-800/50",
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{t.label}</span>
            {active && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-px bg-neon-400 shadow-[0_0_6px_rgba(61,217,214,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
