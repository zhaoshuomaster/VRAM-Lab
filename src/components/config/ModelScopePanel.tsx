// ModelScope 拉取面板 - 输入模型 ID 拉取 config.json
import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { useCalcStore } from "@/store/useCalcStore";
import { SectionTitle, Pill } from "@/components/ui/primitives";

const SAMPLES = [
  "Qwen/Qwen3.6-27B",
  "Qwen/Qwen2.5-7B-Instruct",
  "LLM-Research/Meta-Llama-3-8B",
  "deepseek-ai/DeepSeek-V2-Lite",
];

export function ModelScopePanel() {
  const modelscopeId = useCalcStore((s) => s.modelscopeId);
  const setModelscopeId = useCalcStore((s) => s.setModelscopeId);
  const fetchStatus = useCalcStore((s) => s.fetchStatus);
  const fetchError = useCalcStore((s) => s.fetchError);
  const fetchProgress = useCalcStore((s) => s.fetchProgress);
  const fetchModelscope = useCalcStore((s) => s.fetchModelscope);
  const arch = useCalcStore((s) => s.arch);
  const totalParamsB = useCalcStore((s) => s.totalParamsB);
  const [touched, setTouched] = useState(false);

  const loading = fetchStatus === "loading";

  return (
    <div className="panel p-4 panel-hover">
      <SectionTitle
        index="01"
        title="魔搭社区模型拉取"
        hint="modelscope.cn"
      />

      {/* 输入 + 按钮 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-500" />
          <input
            type="text"
            className="field w-full pl-8 pr-2 py-2 text-[13px]"
            placeholder="namespace/name"
            value={modelscopeId}
            onChange={(e) => {
              setModelscopeId(e.target.value);
              setTouched(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) fetchModelscope();
            }}
          />
        </div>
        <button
          onClick={() => fetchModelscope()}
          disabled={loading || !modelscopeId.trim()}
          className="px-3 py-1.5 rounded-md border border-neon-400/40 bg-neon-400/10 text-neon-300 text-[12px] font-medium hover:bg-neon-400/20 hover:shadow-neon-soft transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          拉取
        </button>
      </div>

      {/* 示例 */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => setModelscopeId(s)}
            className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-edge bg-void-800/60 text-ink-500 hover:text-neon-300 hover:border-neon-400/30 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* 状态 */}
      <div className="mt-3 min-h-[60px]">
        {loading && (
          <div className="sweep-line rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="font-mono text-[11px] text-amber-400">
                {fetchProgress || "正在拉取..."}
              </span>
            </div>
          </div>
        )}

        {fetchStatus === "success" && (
          <div className="rounded-md border border-neon-400/30 bg-neon-400/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-neon-400" />
              <span className="font-mono text-[11px] text-neon-300">
                拉取成功, config.json 已解析
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-mono">
              <Stat label="L" value={arch.numLayers} />
              <Stat label="H/KV" value={`${arch.numAttnHeads}/${arch.numKVHeads}`} />
              <Stat label="hidden" value={arch.hiddenSize} />
              <Stat label="params" value={`${totalParamsB.toFixed(2)}B`} />
            </div>
          </div>
        )}

        {fetchStatus === "error" && (
          <div className="rounded-md border border-magenta-500/30 bg-magenta-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-magenta-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-mono text-[11px] text-magenta-400 mb-0.5">
                  拉取失败
                </div>
                <div className="text-[11px] text-ink-300 leading-snug">
                  {fetchError}
                </div>
              </div>
            </div>
          </div>
        )}

        {fetchStatus === "idle" && !touched && (
          <div className="text-[11px] text-ink-500 leading-relaxed">
            输入魔搭社区模型 ID (格式 <Pill tone="muted" className="mx-1">namespace/name</Pill>
            ), 拉取后自动解析 config.json 填充结构参数。{" "}
            <a
              href="https://modelscope.cn/models"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-neon-400 hover:underline"
            >
              浏览模型库 <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-ink-700 uppercase">{label}</div>
      <div className="text-ink-100 tnum">{value}</div>
    </div>
  );
}
