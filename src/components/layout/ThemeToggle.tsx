// 主题切换按钮: 暗色 <-> 明亮
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "切换到明亮主题" : "切换到暗色主题"}
      title={isDark ? "切换到明亮主题" : "切换到暗色主题"}
      className={cn(
        "relative w-8 h-8 rounded-md border border-edge bg-void-800/60 hover:border-neon-400/40 hover:bg-neon-400/8 flex items-center justify-center transition-colors group overflow-hidden",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="w-3.5 h-3.5 text-neon-300" strokeWidth={2} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" strokeWidth={2} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* 状态指示弧 */}
      <span
        className={cn(
          "absolute -bottom-px left-1/2 -translate-x-1/2 h-px transition-all duration-300",
          isDark
            ? "w-4 bg-neon-400 shadow-[0_0_6px_rgb(var(--neon-400)/0.8)]"
            : "w-4 bg-amber-500 shadow-[0_0_6px_rgb(var(--amber-500)/0.6)]",
        )}
      />
      <span className="sr-only">{theme}</span>
    </button>
  );
}
