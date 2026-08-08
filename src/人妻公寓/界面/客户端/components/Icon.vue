<script lang="ts">
// 从 App.vue 内联函数组件外移的行为等价 render 组件：
// 根节点单个 <svg>，属性语义与旧 innerHTML 实现一致，SVG 内容由 icons.ts 纯函数合成。
import { defineComponent, h } from 'vue';
import { 合成图标SVG } from '../icons';

export default defineComponent({
  name: 'Ic',
  props: {
    n: { type: String, required: true },
  },
  render() {
    return h('svg', {
      class: 'ic',
      viewBox: '0 0 24 24',
      role: 'img',
      'aria-hidden': 'true',
      innerHTML: 合成图标SVG(this.n),
    });
  },
});
</script>

<style scoped>
/* ═══ 梧桐里主题图标：暖白珐琅底 + 墨色圆角线 + 荧光小点 ═══ */

.ic {
  width: 16px;
  height: 16px;
  overflow: visible;
  vertical-align: -3px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 1px rgba(62, 49, 76, 0.14));
}

/* plate/gem 由 innerHTML 注入，不带 scoped attribute，须用 :deep 命中注入子节点 */
.ic :deep(.ic-plate) {
  fill: rgba(255, 252, 247, 0.72);
  stroke: currentColor;
  stroke-width: 0.55;
  opacity: 0.34;
}

.ic :deep(.ic-gem) {
  fill: var(--pink);
  stroke: currentColor;
  stroke-width: 1.25;
}
</style>
