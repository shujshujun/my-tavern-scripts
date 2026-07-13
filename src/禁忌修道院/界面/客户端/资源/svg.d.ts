/** webpack 兜底 raw 规则(resourceQuery:/raw/ → asset/source)把 SVG 当字符串内联进包 */
declare module '*.svg?raw' {
  const 内容: string;
  export default 内容;
}
