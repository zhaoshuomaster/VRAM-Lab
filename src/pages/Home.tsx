// 计算主页: 顶部状态栏 + 简介 + 双栏布局 + 公式抽屉
import { TopBar } from "@/components/layout/TopBar";
import { ConfigColumn } from "@/components/config/ConfigColumn";
import { ResultColumn } from "@/components/result/ResultColumn";
import { FormulaDrawer } from "@/components/result/FormulaDrawer";
import { Gauge, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      {/* 简介横幅 */}
      <section className="px-6 py-5 border-b border-edge/50">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-end gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 min-w-[280px]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Gauge className="w-3.5 h-3.5 text-neon-400" />
              <span className="label-tiny">VRAM ESTIMATION ENGINE</span>
              <span className="w-1 h-1 rounded-full bg-neon-400 animate-blink-dot" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink-100 leading-tight">
              大模型部署显存
              <span className="text-neon-400">·</span>
              <span className="bg-gradient-to-r from-neon-400 via-neon-300 to-magenta-400 bg-clip-text text-transparent">
                精确评估
              </span>
            </h1>
            <p className="mt-1.5 text-[13px] text-ink-500 max-w-2xl leading-relaxed">
              自定义模型或从魔搭社区拉取 config.json, 实时分解
              <span className="text-neon-300"> 权重 / KV 缓存 / 临时激活 / 框架开销 </span>
              四项显存, 并给出主流 GPU 适配建议。
            </p>
          </motion.div>

          {/* 流程指示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 text-[10px] font-mono"
          >
            {["配置模型", "调整部署", "查看结果", "GPU 对比"].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-2 py-1 rounded border border-edge bg-void-800/40 text-ink-500 uppercase tracking-wider">
                  {String(i + 1).padStart(2, "0")} {step}
                </span>
                {i < 3 && <ArrowRight className="w-3 h-3 text-ink-700" />}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 双栏主体 */}
      <main className="flex-1 px-6 py-5">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(420px,1fr)_minmax(440px,1.05fr)] gap-5">
          {/* 左: 配置 */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ConfigColumn />
          </motion.div>

          {/* 右: 结果 */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <ResultColumn />
          </motion.div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="px-6 py-4 border-t border-edge/50">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-3 text-[10px] font-mono text-ink-700">
          <span>VRAM·Lab v1.0</span>
          <span>·</span>
          <span>计算为工程化估算, 实际占用因框架实现而异 ±5-15%</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-blink-dot" />
            数据源: ModelScope + 内置模型库
          </span>
        </div>
      </footer>

      {/* 浮动公式抽屉 */}
      <FormulaDrawer />
    </div>
  );
}
