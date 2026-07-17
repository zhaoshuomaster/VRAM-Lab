// 仪器面板通用 UI 原语
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 区段标题: 带 ID 编号 + 标签
export function SectionTitle({
  index,
  title,
  hint,
}: {
  index?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {index && (
        <span className="font-mono text-[10px] text-neon-400/80 px-1.5 py-0.5 rounded border border-neon-400/30 bg-neon-400/5">
          {index}
        </span>
      )}
      <h3 className="font-display text-sm font-semibold tracking-wide text-ink-100">
        {title}
      </h3>
      {hint && <span className="label-tiny ml-auto">{hint}</span>}
    </div>
  );
}

// 字段包装: label + 输入控件 + 单位
export function Field({
  label,
  unit,
  hint,
  children,
}: {
  label: string;
  unit?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[12px] text-ink-300">{label}</span>
        {unit && <span className="font-mono text-[10px] text-ink-700">{unit}</span>}
      </div>
      {children}
      {hint && <span className="block mt-1 text-[10px] text-ink-700 leading-tight">{hint}</span>}
    </label>
  );
}

// 数字输入
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  value: number | string;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      className="field w-full px-2.5 py-1.5 tnum"
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      placeholder={placeholder}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(v);
      }}
    />
  );
}

// 下拉选择
export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        className="field w-full px-2.5 py-1.5 pr-7 appearance-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-void-800">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-500 text-[10px]">
        ▼
      </span>
    </div>
  );
}

// 徽章
export function Pill({
  children,
  tone = "neon",
  className,
}: {
  children: ReactNode;
  tone?: "neon" | "amber" | "magenta" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neon: "border-neon-400/40 bg-neon-400/8 text-neon-300",
    amber: "border-amber-500/40 bg-amber-500/8 text-amber-400",
    magenta: "border-magenta-500/40 bg-magenta-500/8 text-magenta-400",
    muted: "border-edge bg-void-800 text-ink-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// 状态点
export function StatusDot({ tone }: { tone: "ok" | "warn" | "err" | "idle" }) {
  const colors: Record<string, string> = {
    ok: "bg-neon-400 shadow-[0_0_8px_rgb(var(--neon-400)/0.8)]",
    warn: "bg-amber-500 shadow-[0_0_8px_rgb(var(--amber-500)/0.8)]",
    err: "bg-magenta-500 shadow-[0_0_8px_rgb(var(--magenta-500)/0.8)]",
    idle: "bg-ink-700",
  };
  return <span className={cn("inline-block w-1.5 h-1.5 rounded-full", colors[tone])} />;
}
