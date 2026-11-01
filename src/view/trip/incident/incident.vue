<template>
  <div class="menu-redirect">正在打开车辆 HMI 工作台...</div>
</template>

<script setup>
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 安全事件菜单复用模块四完整工作台，避免维护重复页面。
onBeforeMount(() => router.replace({ name: 'VehicleHmiPreview' }))
</script>

<style scoped>
.menu-redirect { padding: 24px; color: #667085; text-align: center; }
</style>
