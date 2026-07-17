// 显存分项颜色 - 基于 CSS 变量, 跟随主题自动翻转
// 暗色: 霓虹青/琥珀橙/品红/灰
// 浅色: 蓝色系邻近色族 (蓝/靛/青/灰) 保证白底协调又可辨

// 每项对应的 CSS 变量名 (不含 --)
// 使用专用 --seg-* 变量, 与状态色 (amber/magenta) 解耦
export const SEGMENT_VARS: Record<string, string> = {
  weights: "--seg-weights",
  kvCache: "--seg-kv",
  activations: "--seg-act",
  framework: "--seg-framework",
};

// 兼容旧接口: 实色字符串 (用于 SVG stroke / 单色填充)
export const SEGMENT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(SEGMENT_VARS).map(([k, v]) => [k, `rgb(var(${v}))`]),
);

// 构造带透明度的颜色 (替代原 hex+alpha 写法)
export function alpha(varName: string, a: number): string {
  return `rgba(var(${varName}), ${a})`;
}

// 取单项颜色 (实色)
export function solid(key: string): string {
  return `rgb(var(${SEGMENT_VARS[key]}))`;
}

// 取单项带透明度颜色
export function soft(key: string, a: number): string {
  return alpha(SEGMENT_VARS[key], a);
}
