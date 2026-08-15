<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    imageUrl: string;
    title: string;
    kicker?: string;
    closeLabel?: string;
  }>(),
  {
    kicker: 'FAMILY PLAN',
    closeLabel: '收起剧情画面',
  },
);

const emit = defineEmits<{ close: []; imageError: [] }>();
</script>

<template>
  <Transition name="family-plan-fade">
    <section v-if="open" class="family-plan-stage" :style="{ '--family-plan-img': `url(${imageUrl})` }">
      <div class="family-plan-backdrop" aria-hidden="true"></div>
      <img :src="imageUrl" :alt="title" draggable="false" @error="emit('imageError')" />
      <div class="family-plan-caption">
        <span>{{ kicker }}</span>
        <b>{{ title }}</b>
      </div>
      <button type="button" :aria-label="closeLabel" @click="emit('close')">继续</button>
    </section>
  </Transition>
</template>

<style scoped>
.family-plan-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #17131a;
}

.family-plan-backdrop {
  position: absolute;
  inset: -18px;
  background: var(--family-plan-img) center / cover no-repeat;
  filter: blur(18px) brightness(0.48) saturate(0.8);
  transform: scale(1.08);
}

.family-plan-stage img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.5));
}

.family-plan-caption {
  position: absolute;
  left: 18px;
  bottom: 17px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-left: 3px solid #eecbd9;
  border-radius: 4px 10px 10px 4px;
  background: rgba(24, 17, 24, 0.74);
  color: #fff;
  backdrop-filter: blur(8px);
}

.family-plan-caption span {
  color: #eecbd9;
  font:
    700 9px/1.2 ui-monospace,
    monospace;
  letter-spacing: 0.16em;
}

.family-plan-caption b {
  font-size: 14px;
}

.family-plan-stage button {
  position: absolute;
  right: 16px;
  bottom: 16px;
  min-width: 68px;
  padding: 8px 13px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 999px;
  background: rgba(28, 20, 29, 0.75);
  color: #fff;
  font: 700 12px/1 inherit;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.family-plan-fade-enter-active,
.family-plan-fade-leave-active {
  transition: opacity 0.24s ease;
}

.family-plan-fade-enter-from,
.family-plan-fade-leave-to {
  opacity: 0;
}

@media (max-width: 540px) {
  .family-plan-caption {
    left: 10px;
    bottom: 10px;
  }
  .family-plan-stage button {
    right: 10px;
    bottom: 10px;
  }
}
</style>
