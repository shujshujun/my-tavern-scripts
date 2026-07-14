/** webpack 兜底 raw 规则(resourceQuery:/raw/ → asset/source)把 SVG 当字符串内联进包 */
declare module '*.svg?raw' {
  const 内容: string;
  export default 内容;
}

/** webpack 兜底 url 规则(resourceQuery:/url/ → asset/inline)把图片转 base64 data URI 内联进包 */
declare module '*.jpg?url' {
  const 地址: string;
  export default 地址;
}
