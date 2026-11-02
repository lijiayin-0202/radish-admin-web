<template>
  <main class="hmi-app-page">
    <div class="preview-toolbar" aria-label="车辆状态预览">
      <span>测试状态</span>
      <button
        v-for="option in hmiPhaseOptions"
        :key="option.value"
        type="button"
        :class="{ active: previewPhase === option.value }"
        @click="previewPhase = option.value"
      >{{ option.label }}</button>
    </div>
    <section class="hmi-app-device" aria-label="萝卜快跑车辆 HMI">
      <PassengerPreview
        :phase="previewPhase"
        :telemetry="previewTelemetry"
        @action="handlePreviewAction"
      />
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PassengerPreview from './components/PassengerPreview.vue'
import { getHmiView } from '@/api/vehicleHmi'
import { hmiPhaseOptions, resolveTripPhase } from './helpers'

defineOptions({ name: 'VehicleHmi' })

const router = useRouter()
const previewPhase = ref('waiting')
const previewTelemetry = ref({})

const loadHmiView = async () => {
  try {
    const view = await getHmiView(1)
    previewPhase.value = resolveTripPhase(view.orderStatus)
  } catch {
    // 服务暂不可用时仍保留 HMI 本地预览，避免遮挡乘客界面。
  }
}

const handlePreviewAction = (action) => {
  const routeByAction = {
    trip: 'VehicleHmiTrip',
    boarding: 'VehicleHmiBoarding',
    safety: 'VehicleHmiSafety',
    vehicle: 'VehicleHmiVehicle',
    fault: 'VehicleHmiFaultReport'
  }
  const routeName = routeByAction[action]
  if (routeName) router.push({ name: routeName })
}

onMounted(loadHmiView)
</script>

<style scoped>
.hmi-app-page { display: flex; box-sizing: border-box; height: 100dvh; min-height: 0; align-items: center; flex-direction: column; gap: 12px; padding: 18px; overflow-y: auto; overscroll-behavior: contain; background: #e9ecef; }
.preview-toolbar { display: flex; width: min(100%, 390px); align-items: center; gap: 5px; padding: 6px; border: 1px solid #e2e6ea; border-radius: 12px; background: rgb(255 255 255 / 92%); box-shadow: 0 8px 20px rgb(15 23 42 / 9%); }
.preview-toolbar span { margin-right: auto; color: #7b838b; font-size: 10px; white-space: nowrap; }.preview-toolbar button { min-height: 30px; padding: 0 7px; border: 0; border-radius: 7px; background: #f1f3f5; color: #59616a; font-size: 10px; cursor: pointer; }.preview-toolbar button.active { background: #ac0c14; color: #fff; }
.hmi-app-device { width: min(100%, 390px); overflow: visible; border-radius: 44px; background: #111318; box-shadow: 0 24px 60px rgb(15 23 42 / 24%); }
.hmi-app-device :deep(.preview-shell) { width: 100%; height: auto; min-width: 0; }
.hmi-app-device :deep(.phone-frame) { width: 100%; height: min(844px, calc(100dvh - 36px)); min-height: 640px; border: 0; border-radius: 0; transform: none; box-shadow: none; }
@media (max-width: 480px) { .hmi-app-page { align-items: stretch; gap: 8px; padding: 8px; background: #111318; }.preview-toolbar { width: auto; }.hmi-app-device { width: 100%; min-height: 100dvh; border-radius: 24px; }.hmi-app-device :deep(.phone-frame) { height: 100dvh; min-height: 844px; } }
</style>
