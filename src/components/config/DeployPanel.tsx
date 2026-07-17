// 部署配置面板: 量化精度 + 批大小 + 序列长度 + 并发 + 框架
import { useCalcStore } from "@/store/useCalcStore";
import {
  SectionTitle,
  Field,
  NumberInput,
  SelectInput,
} from "@/components/ui/primitives";
import {
  BYTES_PER_PARAM,
  FRAMEWORK_LABEL,
} from "@/lib/vram";
import type { Precision, Framework } from "@/types";

const PRECISION_OPTS: { value: Precision; label: string }[] = [
  { value: "FP32", label: "FP32 · 4 B/参" },
  { value: "FP16", label: "FP16 · 2 B/参" },
  { value: "BF16", label: "BF16 · 2 B/参" },
  { value: "INT8", label: "INT8 · 1 B/参" },
  { value: "INT4", label: "INT4 · 0.5 B/参" },
];

const FRAMEWORK_OPTS: { value: Framework; label: string }[] = [
  { value: "vllm", label: "vLLM · ~1.0 GB" },
  { value: "tgi", label: "TGI · ~0.8 GB" },
  { value: "lmdeploy", label: "LMDeploy · ~0.7 GB" },
  { value: "llama_cpp", label: "llama.cpp · ~0.2 GB" },
  { value: "custom", label: "自定义 · ~0.5 GB" },
];

export function DeployPanel() {
  const deploy = useCalcStore((s) => s.deploy);
  const setDeploy = useCalcStore((s) => s.setDeploy);

  return (
    <div className="panel p-4 panel-hover">
      <SectionTitle index="02" title="部署配置" hint="推理参数" />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field
            label="权重量化精度"
            hint="决定模型权重字节数"
            unit="B/参"
          >
            <SelectInput
              value={deploy.weightPrecision}
              onChange={(v) => setDeploy({ weightPrecision: v })}
              options={PRECISION_OPTS}
            />
          </Field>
        </div>

        <div className="col-span-2">
          <Field
            label="KV 缓存精度"
            hint="可独立于权重精度量化 (如 KV INT8)"
            unit="B/参"
          >
            <SelectInput
              value={deploy.kvPrecision}
              onChange={(v) => setDeploy({ kvPrecision: v })}
              options={PRECISION_OPTS}
            />
          </Field>
        </div>

        <Field label="批大小" unit="batch">
          <NumberInput
            value={deploy.batchSize}
            onChange={(v) => setDeploy({ batchSize: v })}
            min={1}
          />
        </Field>

        <Field label="上下文长度" unit="tokens" hint="推理序列长度, 影响 KV Cache">
          <NumberInput
            value={deploy.seqLength}
            onChange={(v) => setDeploy({ seqLength: v })}
            min={1}
            step={512}
          />
        </Field>

        <Field
          label="并发请求数"
          unit="conc"
          hint="影响 KV Cache 总量"
        >
          <NumberInput
            value={deploy.concurrency}
            onChange={(v) => setDeploy({ concurrency: v })}
            min={1}
          />
        </Field>

        <Field label="推理框架" hint="启动开销">
          <SelectInput
            value={deploy.framework}
            onChange={(v) => setDeploy({ framework: v })}
            options={FRAMEWORK_OPTS}
          />
        </Field>

        <Field
          label="张量并行 TP"
          unit="路"
          hint="权重/KV/激活按 TP 切分到多卡"
        >
          <NumberInput
            value={deploy.tensorParallel}
            onChange={(v) => setDeploy({ tensorParallel: Math.max(1, v) })}
            min={1}
            max={64}
          />
        </Field>

        <Field
          label="专家并行 EP"
          unit="路"
          hint="MoE 专家分摊, 影响 GPU 总数"
        >
          <NumberInput
            value={deploy.expertParallel}
            onChange={(v) => setDeploy({ expertParallel: Math.max(1, v) })}
            min={1}
            max={64}
          />
        </Field>
      </div>

      {/* 部署摘要 */}
      <div className="mt-3 pt-3 border-t border-edge flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="label-tiny">权重</span>
          <span className="font-mono text-[11px] text-neon-300 tnum">
            {BYTES_PER_PARAM[deploy.weightPrecision]} B
          </span>
          <span className="text-ink-700">·</span>
          <span className="label-tiny">KV</span>
          <span className="font-mono text-[11px] text-neon-300 tnum">
            {BYTES_PER_PARAM[deploy.kvPrecision]} B
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-ink-500">
            {FRAMEWORK_LABEL[deploy.framework]}
          </span>
          <span className="text-ink-700">·</span>
          <span className="font-mono text-[10px] text-neon-300 tnum">
            TP{deploy.tensorParallel}×EP{deploy.expertParallel}
          </span>
          <span className="font-mono text-[10px] text-ink-500">
            ={deploy.tensorParallel * deploy.expertParallel}卡
          </span>
        </div>
      </div>
    </div>
  );
}
