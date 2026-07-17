// 左侧配置列: Tab + 当前来源面板 + 部署配置 + GPU 适配对比 + 计算按钮
import { useCalcStore } from "@/store/useCalcStore";
import { SourceTabs } from "./SourceTabs";
import { PresetPicker } from "./PresetPicker";
import { ModelScopePanel } from "./ModelScopePanel";
import { CustomForm } from "./CustomForm";
import { DeployPanel } from "./DeployPanel";
import { CalculateButton } from "./CalculateButton";
import { GpuComparison } from "@/components/result/GpuComparison";

export function ConfigColumn() {
  const source = useCalcStore((s) => s.source);
  const hasCalculated = useCalcStore((s) => s.hasCalculated);

  return (
    <div className="flex flex-col gap-3 pb-16">
      <SourceTabs />

      {source === "preset" && <PresetPicker />}
      {source === "modelscope" && <ModelScopePanel />}
      {source === "custom" && <CustomForm />}

      <DeployPanel />

      {/* GPU 适配对比: 计算后才显示 */}
      {hasCalculated && <GpuComparison />}

      <CalculateButton />
    </div>
  );
}
