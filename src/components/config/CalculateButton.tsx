// 开始计算按钮 - 显式触发显存评估
import { motion } from "framer-motion";
import { Calculator, RotateCcw, ChevronRight } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { formatGB } from "@/lib/vram";

export function CalculateButton() {
  const arch = useCalcStore((s) => s.arch);
  const deploy = useCalcStore((s) => s.deploy);
  const totalParams = useCalcStore((s) => s.totalParams);
  const modelName = useCalcStore((s) => s.modelName);
  const hasCalculated = useCalcStore((s) => s.hasCalculated);
  const calculate = useCalcStore((s) => s.calculate);
  const resetCalc = useCalcStore((s) => s.resetCalc);

  const canCalculate = arch.numLayers > 0 && arch.numAttnHeads > 0 && arch.hiddenSize > 0;

  // 预览: 权重部分 (TP>1 时显示单卡分摊后的预览)
  const PRECISION_BYTES: Record<string, number> = {
    FP32: 4, FP16: 2, BF16: 2, INT8: 1, INT4: 0.5,
  };
  const tp = Math.max(1, deploy.tensorParallel || 1);
  const previewWeights = totalParams * PRECISION_BYTES[deploy.weightPrecision];
  const previewPerGpu = previewWeights / tp;
  const isParallel = tp > 1 || deploy.expertParallel > 1;

  return (
    <div className="sticky bottom-3 z-20">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="panel p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md bg-void-900/90"
      >
        <div className="flex items-center gap-3">
          {/* 左侧: 预览读数 */}
          <div className="flex-shrink-0">
            <div className="label-tiny mb-0.5">
              {isParallel ? `单卡权重 (TP${tp})` : "预估权重"}
            </div>
            <div className="font-mono text-[13px] tnum text-neon-300 font-semibold">
              {formatGB(previewPerGpu, 2)}
            </div>
          </div>

          <div className="w-px h-9 bg-edge" />

          {/* 中间: 模型名 */}
          <div className="flex-1 min-w-0">
            <div className="label-tiny mb-0.5">当前模型</div>
            <div className="font-display text-[13px] text-ink-100 truncate font-medium">
              {modelName}
            </div>
          </div>

          {/* 右侧: 按钮 */}
          {hasCalculated ? (
            <button
              onClick={() => {
                resetCalc();
                calculate();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-neon-400/50 bg-neon-400/15 text-neon-300 text-[13px] font-semibold hover:bg-neon-400/25 hover:shadow-neon-soft transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重新计算
            </button>
          ) : (
            <button
              onClick={calculate}
              disabled={!canCalculate}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-md bg-neon-400 text-void-950 text-[13px] font-bold hover:bg-neon-300 hover:shadow-neon-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Calculator className="w-4 h-4" strokeWidth={2.5} />
              开始计算
              <ChevronRight
                className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.5}
              />
            </button>
          )}
        </div>

        {/* 提示条 */}
        {!canCalculate && (
          <div className="mt-2 pt-2 border-t border-edge text-[10px] font-mono text-amber-500">
            ⚠ 请先完成模型参数配置 (层数 / 注意力头数 / 隐藏维度均需 &gt; 0)
          </div>
        )}
      </motion.div>
    </div>
  );
}
