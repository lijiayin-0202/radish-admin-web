<template>
  <div class="m-empty">
    <svg class="m-empty__art" viewBox="0 0 160 150" fill="none" aria-hidden="true">
      <ellipse cx="80" cy="130" rx="46" ry="7" fill="#EDF2F8" />
      <path d="M30 44c8-6 16-2 20 6-9 4-17 2-20-6z" fill="#E3EBF5" />
      <path d="M128 58c-7-5-14-2-17 5 8 3 14 1 17-5z" fill="#EAF0F7" />
      <path d="M124 40c-4-6-11-6-15-1 4 5 10 6 15 1z" fill="#EDF2F8" />

      <rect x="46" y="34" width="68" height="80" rx="9" fill="#E9EFF7" stroke="#D6E0EE" />
      <path d="M100 34h-8a6 6 0 0 0 6 6h8a6 6 0 0 0-6-6z" fill="#CFDCEC" />
      <rect x="56" y="50" width="48" height="5" rx="2.5" fill="#CFDCEC" />
      <rect x="56" y="64" width="48" height="5" rx="2.5" fill="#D8E2EF" />
      <rect x="56" y="78" width="34" height="5" rx="2.5" fill="#D8E2EF" />
      <rect x="56" y="92" width="42" height="5" rx="2.5" fill="#E2EAF4" />

      <circle cx="64" cy="84" r="17" fill="#F3F7FC" stroke="#AFC1D9" stroke-width="2.4" />
      <circle cx="64" cy="84" r="11" fill="#FFFFFF" opacity="0.7" />
      <path d="M52 97l-8 10" stroke="#AFC1D9" stroke-width="3.4" stroke-linecap="round" />

      <path d="M118 108c6-2 10 2 10 8-6 1-10-2-10-8z" fill="#E3EBF5" />
    </svg>
    <div class="m-empty__text">{{ text }}</div>
    <div v-if="hint" class="m-empty__hint">{{ hint }}</div>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
  hint: { type: String, default: '' }
})
</script>

<style scoped>
.m-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px 40px;
}

.m-empty__art {
  width: 160px;
  height: 150px;
}

.m-empty__text {
  margin-top: 18px;
  font-size: 14px;
  color: #9aa6b2;
  letter-spacing: 2px;
}

.m-empty__hint {
  margin-top: 8px;
  font-size: 12px;
  color: #b6c0ca;
}
</style>
