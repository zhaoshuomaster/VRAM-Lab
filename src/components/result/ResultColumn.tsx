// 右侧结果列: 总显存卡 + 分项明细 + vLLM 启动参数
// 未点击"开始计算"前显示占位引导
import { motion } from "framer-motion";
import { Calculator, ArrowLeft, Gauge, Layers3 } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { TotalVramCard } from "./TotalVramCard";
import { BreakdownList } from "./BreakdownList";
import { LaunchConfigCard } from "./LaunchConfigCard";

export function ResultColumn() {
  const hasCalculated = useCalcStore((s) => s.hasCalculated);

  if (!hasCalculated) {
    return <Placeholder />;
  }

  return (
    <div className="flex flex-col gap-3">
      <TotalVramCard />
      <BreakdownList />
      <LaunchConfigCard />
    </div>
  );
}

// 占位提示: 引导用户点击左侧"开始计算"
function Placeholder() {
  const calculate = useCalcStore((s) => s.calculate);
  const arch = useCalcStore((s) => s.arch);
  const canCalculate = arch.numLayers > 0 && arch.numAttnHeads > 0 && arch.hiddenSize > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="panel p-8 relative overflow-hidden min-h-[480px] flex flex-col items-center justify-center"
    >
      {/* 装饰背景: 大号 ghost 图标 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Gauge className="w-64 h-64 text-neon-400/5" strokeWidth={0.5} />
      </div>

      {/* 装饰圆环 */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        width="280"
        height="280"
        viewBox="0 0 280 280"
      >
        <circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="rgb(var(--neon-400))"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.2"
        />
        <circle
          cx="140"
          cy="140"
          r="100"
          fill="none"
          stroke="rgb(var(--neon-400))"
          strokeWidth="1"
          strokeDasharray="2 6"
          opacity="0.15"
        />
      </svg>

      <div className="relative z-10 text-center max-w-md">
        {/* 主图标 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border border-neon-400/40 bg-neon-400/8 shadow-neon-soft"
        >
          <Calculator className="w-6 h-6 text-neon-400" strokeWidth={2} />
        </motion.div>

        <h3 className="font-display text-lg font-bold text-ink-100 mb-1.5">
          等待开始计算
        </h3>
        <p className="text-[12px] text-ink-500 leading-relaxed mb-5">
          在左侧选择模型来源 (预设 / 魔搭拉取 / 自定义),
          <br />
          配置部署参数后, 点击底部{" "}
          <span className="inline-flex items-center gap-0.5 font-mono text-[11px] text-neon-300">
            <Calculator className="w-3 h-3" />开始计算
          </span>{" "}
          按钮评估显存。
        </p>

        {/* 三项预览图例 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { icon: Layers3, label: "权重", colorVar: "--seg-weights" },
            { icon: Gauge, label: "KV Cache", colorVar: "--seg-kv" },
            { icon: Layers3, label: "激活/框架", colorVar: "--seg-act" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                className="px-2 py-3 rounded-md border border-edge bg-void-800/30"
              >
                <Icon
                  className="w-3.5 h-3.5 mx-auto mb-1"
                  style={{ color: `rgb(var(${item.colorVar}))` }}
                />
                <div className="font-mono text-[10px] text-ink-500">
                  {item.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 引导按钮 */}
        {canCalculate ? (
          <button
            onClick={calculate}
            className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-neon-400 text-void-950 text-[13px] font-bold hover:bg-neon-300 hover:shadow-neon-glow transition-all"
          >
            <Calculator className="w-4 h-4" strokeWidth={2.5} />
            立即开始计算
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 text-amber-500 text-[12px] font-mono">
            请先在左侧完成模型参数配置
          </div>
        )}
      </div>

      {/* 装饰刻度 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="block h-1 rounded-full bg-neon-400/30"
            style={{
              width: 16 + i * 6,
              animation: `blink-dot 1.4s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
