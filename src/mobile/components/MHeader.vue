<template>
  <div class="m-nav" :class="themeClass">
    <button v-if="showBack" class="m-nav__back" type="button" aria-label="返回" @click="handleBack">
      <MIcon name="arrow-left" :size="18" :stroke-width="2" />
    </button>
    <div v-else class="m-nav__spacer" />

    <div class="m-nav__title">{{ title }}</div>

    <div class="m-nav__action">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import MIcon from './MIcon.vue'

const props = defineProps({
  title: { type: String, default: '' },
  // transparent：透出页面渐变背景；solid：白底带分割线
  theme: { type: String, default: 'transparent' },
  showBack: { type: Boolean, default: true },
  // 无历史记录时的兜底返回地址
  fallback: { type: String, default: '/m/profile' }
})

const router = useRouter()

const themeClass = computed(() => (props.theme === 'solid' ? 'm-nav--solid' : 'm-nav--fixed'))

function handleBack() {
  // 直接从外部链接进入时没有上一页，退回个人中心，避免白屏
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace(props.fallback)
  }
}
</script>
