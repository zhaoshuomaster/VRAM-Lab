// 自定义模型结构参数表单
import { useCalcStore } from "@/store/useCalcStore";
import { SectionTitle, Field, NumberInput, Pill } from "@/components/ui/primitives";

export function CustomForm() {
  const arch = useCalcStore((s) => s.arch);
  const totalParamsB = useCalcStore((s) => s.totalParamsB);
  const setArch = useCalcStore((s) => s.setArch);

  return (
    <div className="panel p-4 panel-hover">
      <SectionTitle
        index="01"
        title="模型结构参数"
        hint="手动输入或调整"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Transformer 层数" unit="L">
          <NumberInput
            value={arch.numLayers}
            onChange={(v) => setArch({ numLayers: v })}
            min={1}
          />
        </Field>
        <Field label="注意力头数" unit="H">
          <NumberInput
            value={arch.numAttnHeads}
            onChange={(v) => setArch({ numAttnHeads: v })}
            min={1}
          />
        </Field>
        <Field
          label="KV 头数"
          unit="KV"
          hint={arch.isGQA ? "GQA 已启用" : "MHA (KV=H)"}
        >
          <NumberInput
            value={arch.numKVHeads}
            onChange={(v) => setArch({ numKVHeads: v })}
            min={1}
          />
        </Field>
        <Field label="每头维度" unit="d_h">
          <NumberInput
            value={arch.headDim}
            onChange={(v) => setArch({ headDim: v })}
            min={1}
          />
        </Field>
        <Field label="隐藏维度" unit="d_model">
          <NumberInput
            value={arch.hiddenSize}
            onChange={(v) => setArch({ hiddenSize: v })}
            min={1}
            step={64}
          />
        </Field>
        <Field label="FFN 中间维度" unit="d_ff">
          <NumberInput
            value={arch.intermediateSize}
            onChange={(v) => setArch({ intermediateSize: v })}
            min={1}
            step={64}
          />
        </Field>
        <Field label="词表大小" unit="V">
          <NumberInput
            value={arch.vocabSize}
            onChange={(v) => setArch({ vocabSize: v })}
            min={1}
            step={256}
          />
        </Field>
        <Field label="最大序列长度" unit="seq">
          <NumberInput
            value={arch.maxSeqLen}
            onChange={(v) => setArch({ maxSeqLen: v })}
            min={1}
            step={512}
          />
        </Field>
        <Field
          label="专家数 (MoE)"
          unit="路"
          hint={arch.isMoE ? "总专家数, 0=dense" : "0 = 稠密模型"}
        >
          <NumberInput
            value={arch.numExperts}
            onChange={(v) =>
              setArch({
                numExperts: v,
                isMoE: v > 1,
                numActivatedExperts:
                  v > 1 && arch.numActivatedExperts < 1
                    ? 2
                    : arch.numActivatedExperts,
              })
            }
            min={0}
          />
        </Field>
        {arch.isMoE && (
          <Field
            label="激活专家数 (top-k)"
            unit="路"
            hint="每次推理激活的专家数"
          >
            <NumberInput
              value={arch.numActivatedExperts}
              onChange={(v) =>
                setArch({
                  numActivatedExperts: Math.max(1, Math.min(v, arch.numExperts)),
                })
              }
              min={1}
              max={arch.numExperts || undefined}
            />
          </Field>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-edge flex items-center justify-between">
        <span className="label-tiny">估算参数量</span>
        <div className="flex items-center gap-2">
          {arch.isGQA && <Pill tone="magenta">GQA</Pill>}
          {arch.isMoE && (
            <Pill tone="neon">
              MoE {arch.numExperts}/{arch.numActivatedExperts}
            </Pill>
          )}
          <span className="font-mono text-sm tnum text-neon-300 font-semibold">
            {totalParamsB.toFixed(2)} B
          </span>
        </div>
      </div>
    </div>
  );
}
