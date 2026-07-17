// 顶部状态栏: Logo + 标题 + ModelScope 状态 + 当前显存总量
import { Cpu, Activity, Radio } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { calcVram } from "@/lib/vram";
import { formatGB } from "@/lib/vram";
import { StatusDot } from "@/components/ui/primitives";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const arch = useCalcStore((s) => s.calcSnapshot?.arch ?? s.arch);
  const deploy = useCalcStore((s) => s.calcSnapshot?.deploy ?? s.deploy);
  const totalParams = useCalcStore(
    (s) => s.calcSnapshot?.totalParams ?? s.totalParams,
  );
  const hasCalculated = useCalcStore((s) => s.hasCalculated);
  const fetchStatus = useCalcStore((s) => s.fetchStatus);
  const modelName = useCalcStore(
    (s) => s.calcSnapshot?.modelName ?? s.modelName,
  );

  const breakdown = calcVram(arch, deploy, totalParams);
  const perGpuGB = breakdown.perGpu.total / 1024 ** 3;
  const { gpuCount } = breakdown.perGpu;

  const dotTone =
    fetchStatus === "loading"
      ? "warn"
      : fetchStatus === "success"
        ? "ok"
        : fetchStatus === "error"
          ? "err"
          : "idle";

  return (
    <header className="sticky top-0 z-30 panel glow-line rounded-none border-x-0 border-t-0 px-6 py-3 backdrop-blur-md bg-void-900/85">
      <div className="flex items-center gap-4">
        {/* Logo 区 */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-md bg-gradient-to-br from-neon-400/30 to-magenta-500/20 border border-neon-400/40 flex items-center justify-center shadow-neon-soft">
            <Cpu className="w-4 h-4 text-neon-400" strokeWidth={2} />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-400 animate-blink-dot" />
          </div>
          <div className="leading-none">
            <div className="font-display text-base font-bold tracking-tight text-ink-100">
              VRAM<span className="text-neon-400">·</span>Lab
            </div>
            <div className="font-mono text-[9px] text-ink-500 uppercase tracking-[0.2em] mt-0.5">
              显存评估计算平台 v1.0
            </div>
          </div>
        </div>

        {/* 中段: 模型名 */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-edge">
          <Activity className="w-3.5 h-3.5 text-ink-500" />
          <span className="font-mono text-[11px] text-ink-300">当前模型</span>
          <span className="font-display text-sm text-ink-100 font-medium">
            {modelName}
          </span>
        </div>

        {/* 右侧: ModelScope 状态 + 总显存 */}
        <div className="ml-auto flex items-center gap-5">
          {/* ModelScope 状态 */}
          <div className="hidden sm:flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-ink-500" />
            <span className="font-mono text-[10px] text-ink-500 uppercase tracking-wider">
              ModelScope
            </span>
            <StatusDot tone={dotTone} />
            <span className="font-mono text-[10px] text-ink-300 capitalize">
              {fetchStatus === "idle" ? "待机" : fetchStatus}
            </span>
          </div>

          {/* 单卡显存读数 */}
          <div className="flex items-center gap-2.5 pl-4 border-l border-edge">
            <div className="text-right leading-none">
              <div className="label-tiny mb-0.5">
                {gpuCount > 1 ? `单卡显存 · ${gpuCount}卡` : "总显存需求"}
              </div>
              <div className="font-mono text-lg font-bold tnum text-neon-300">
                {hasCalculated ? formatGB(breakdown.perGpu.total) : "- -"}
              </div>
            </div>
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-neon-400/50 to-transparent" />
            <div className="text-right leading-none hidden sm:block">
              <div className="label-tiny mb-0.5">利用率 (A100-80G)</div>
              <div className="font-mono text-sm tnum text-ink-300">
                {hasCalculated ? `${((perGpuGB / 80) * 100).toFixed(1)}%` : "- -"}
              </div>
            </div>
          </div>

          {/* 主题切换 */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
