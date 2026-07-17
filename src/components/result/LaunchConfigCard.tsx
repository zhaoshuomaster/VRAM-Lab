// vLLM 启动参数配置卡片 - 参考 https://recipes.vllm.ai/
import { useState } from "react";
import { motion } from "framer-motion";
import { useCalcStore } from "@/store/useCalcStore";
import { calcVram, buildLaunchConfig } from "@/lib/vram";
import { SectionTitle, Pill } from "@/components/ui/primitives";
import {
  Terminal,
  Copy,
  Check,
  Cpu,
  Gauge,
  Settings,
  Layers,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { LaunchParam } from "@/lib/vram";

const GROUP_META: Record<
  LaunchParam["group"],
  { label: string; icon: typeof Cpu; tone: "neon" | "magenta" | "amber" | "muted" }
> = {
  core: { label: "核心", icon: Cpu, tone: "neon" },
  memory: { label: "显存/上下文", icon: Gauge, tone: "amber" },
  perf: { label: "性能优化", icon: Layers, tone: "muted" },
  quant: { label: "量化", icon: Settings, tone: "magenta" },
};

export function LaunchConfigCard() {
  const snapshot = useCalcStore((s) => s.calcSnapshot);
  const arch = snapshot?.arch ?? useCalcStore.getState().arch;
  const deploy = snapshot?.deploy ?? useCalcStore.getState().deploy;
  const totalParams = snapshot?.totalParams ?? useCalcStore.getState().totalParams;
  const modelName = snapshot?.modelName ?? useCalcStore.getState().modelName;
  const breakdown = calcVram(arch, deploy, totalParams);
  const config = buildLaunchConfig(arch, deploy, breakdown, totalParams, modelName);

  const [copied, setCopied] = useState(false);

  function copyCmd() {
    navigator.clipboard.writeText(config.cmdLine.replace(/\\\n\s*/g, " "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // 按组分类参数
  const groups = Object.keys(GROUP_META) as LaunchParam["group"][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="panel p-4"
    >
      <SectionTitle
        index="05"
        title="vLLM 启动参数"
        hint="参考 recipes.vllm.ai"
      />

      {/* 参考链接 */}
      <a
        href={config.recipe}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mb-3 text-[11px] text-neon-400 hover:text-neon-300 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        vLLM Recipes 官方参考
      </a>

      {/* 分组参数 */}
      <div className="flex flex-col gap-3 mb-4">
        {groups.map((group) => {
          const groupParams = config.params.filter((p) => p.group === group);
          if (groupParams.length === 0) return null;
          const meta = GROUP_META[group];
          const Icon = meta.icon;
          return (
            <div key={group}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-3 h-3 text-ink-500" />
                <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
                  {meta.label}
                </span>
                <span className="flex-1 h-px bg-edge" />
              </div>
              <div className="grid grid-cols-1 gap-1">
                {groupParams.map((p) => (
                  <div
                    key={p.flag}
                    className="flex items-start gap-2 px-2 py-1.5 rounded bg-void-850/50 border border-edge/40"
                  >
                    <code className="font-mono text-[11px] text-neon-300 whitespace-nowrap flex-shrink-0">
                      {p.flag}
                    </code>
                    {p.value && (
                      <code className="font-mono text-[11px] text-amber-400 whitespace-nowrap">
                        {p.value}
                      </code>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-ink-300">{p.label}</div>
                      {p.hint && (
                        <div className="text-[9px] text-ink-700 mt-0.5 leading-tight">
                          {p.hint}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 命令行 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-neon-400" />
            <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
              命令行
            </span>
          </div>
          <button
            onClick={copyCmd}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-ink-300 hover:text-neon-300 hover:bg-neon-400/10 border border-edge transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-2.5 h-2.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-2.5 h-2.5" />
                复制
              </>
            )}
          </button>
        </div>
        <pre className="font-mono text-[10px] leading-relaxed text-ink-300 bg-void-950/60 border border-edge rounded p-2.5 overflow-x-auto whitespace-pre-wrap break-all">
          <code>{config.cmdLine}</code>
        </pre>
      </div>

      {/* 注意事项 */}
      {config.notes.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
              注意事项
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {config.notes.map((note, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[10px] text-ink-500 leading-tight"
              >
                <span className="text-amber-400 mt-0.5">▸</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 底部标签 */}
      <div className="mt-3 pt-3 border-t border-edge flex items-center gap-2 flex-wrap">
        <Pill tone="neon">vLLM</Pill>
        {deploy.tensorParallel > 1 && (
          <Pill tone="amber">TP={deploy.tensorParallel}</Pill>
        )}
        {deploy.expertParallel > 1 && (
          <Pill tone="magenta">EP={deploy.expertParallel}</Pill>
        )}
        <Pill tone="muted">{deploy.weightPrecision}</Pill>
      </div>
    </motion.div>
  );
}
