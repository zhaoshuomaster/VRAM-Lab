// SVG 占比环图 - 四项显存占比可视化
import { motion } from "framer-motion";

export interface RingSegment {
  key: string;
  label: string;
  value: number; // 字节
  color: string; // 描边色
}

// 单环多段 donut chart
export function RingChart({
  segments,
  size = 180,
  thickness = 16,
}: {
  segments: RingSegment[];
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // 每段长度 + 起始偏移
  let accOffset = 0;
  const segs = segments.map((s) => {
    const fraction = s.value / total;
    const length = fraction * circumference;
    const seg = {
      ...s,
      fraction,
      length,
      dashOffset: accOffset,
    };
    accOffset += length;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 底环 - 跟随主题 */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgb(var(--ring-track))"
          strokeWidth={thickness}
        />
        {/* 段 */}
        {segs.map((s, i) => (
          <motion.circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            strokeDasharray={`${s.length} ${circumference - s.length}`}
            strokeDashoffset={-s.dashOffset}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: "easeOut" }}
            style={{ transformOrigin: "center" }}
          />
        ))}
        {/* 中心点辉光 - 跟随主题 */}
        <circle cx={cx} cy={cy} r={2} fill="rgb(var(--ring-center))" opacity={0.6} />
      </svg>
      {/* 中心数字层 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="label-tiny">总显存</span>
        <span className="font-display text-2xl font-bold text-ink-100 tnum leading-tight">
          {(total / 1024 ** 3).toFixed(1)}
        </span>
        <span className="font-mono text-[10px] text-ink-500">GB</span>
      </div>
    </div>
  );
}

// 迷你横条: 单项占比条
export function MiniBar({
  fraction,
  color,
}: {
  fraction: number;
  color: string;
}) {
  return (
    <div className="h-1 w-full rounded-full bg-void-800 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(fraction * 100, 100)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}
