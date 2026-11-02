<template>
  <main class="module-page">
    <section class="module-device">
      <header class="module-header">
        <button type="button" aria-label="返回车辆 HMI" @click="router.push({ name: 'VehicleHmiPreview' })"><ArrowLeft /></button>
        <div><span>VEHICLE HMI</span><h1>{{ moduleMeta.title }}</h1></div>
        <i />
      </header>

      <section class="module-intro">
        <component :is="moduleMeta.icon" />
        <div><strong>{{ moduleMeta.title }}</strong><span>{{ moduleMeta.description }}</span></div>
      </section>

      <section class="module-content">
        <OverviewPanel v-if="module === 'trip'" />
        <BoardingPanel v-else-if="module === 'boarding'" />
        <VehicleDataPanel v-else-if="module === 'vehicle'" :show-fault="false" />
        <template v-else>
          <div class="module-switcher" role="tablist" aria-label="安全与媒体功能切换">
            <button type="button" :class="{ active: safetyPanel === 'assistance' }" @click="safetyPanel = 'assistance'">安全协助</button>
            <button type="button" :class="{ active: safetyPanel === 'media' }" @click="safetyPanel = 'media'">媒体记录</button>
          </div>
          <SafetyMediaPanel :active-panel="safetyPanel" />
        </template>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, DataAnalysis, Key, Odometer, Service } from '@element-plus/icons-vue'
import OverviewPanel from './components/OverviewPanel.vue'
import BoardingPanel from './components/BoardingPanel.vue'
import VehicleDataPanel from './components/VehicleDataPanel.vue'
import SafetyMediaPanel from './components/SafetyMediaPanel.vue'

defineOptions({ name: 'VehicleHmiModulePage' })

const props = defineProps({
  module: { type: String, required: true }
})
const router = useRouter()
const safetyPanel = ref('assistance')
const moduleMeta = computed(() => ({
  trip: { title: '行程与指令', description: '订单、车辆与待执行指令', icon: DataAnalysis },
  boarding: { title: '上车核验', description: '乘客身份核验与上车码验证', icon: Key },
  vehicle: { title: '车辆状态', description: '实时遥测、运行状态与车辆数据', icon: Odometer },
  safety: { title: '安全与媒体', description: '安全协助与行程媒体记录', icon: Service }
}[props.module] || { title: '车辆 HMI', description: '', icon: DataAnalysis }))
</script>

<style scoped>
.module-page { display: grid; box-sizing: border-box; height: 100dvh; min-height: 0; place-items: center; padding: 18px; overflow: hidden; background: #e9ecef; color: #1f2937; }
.module-device { width: min(100%, 430px); height: min(844px, calc(100dvh - 36px)); min-height: 0; overflow-y: auto; overscroll-behavior: contain; background: #f6f7f9; box-shadow: 0 24px 60px rgb(15 23 42 / 24%); }
.module-header { position: sticky; z-index: 2; top: 0; display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; min-height: 66px; padding: env(safe-area-inset-top) 16px 8px; background: rgb(255 255 255 / 94%); box-shadow: 0 1px 0 rgb(15 23 42 / 8%); backdrop-filter: blur(14px); }.module-header button { display: grid; width: 36px; height: 36px; place-items: center; border: 0; border-radius: 18px; background: #f0f2f5; color: #202938; cursor: pointer; }.module-header button svg { width: 20px; }.module-header div { text-align: center; }.module-header span { color: #ac0c14; font-family: ui-monospace, monospace; font-size: 9px; }.module-header h1 { margin: 2px 0 0; font-size: 17px; }.module-header i { width: 36px; height: 36px; }
.module-intro { display: flex; gap: 11px; margin: 16px; padding: 13px; border-radius: 10px; background: #fff1f1; color: #9c1118; }.module-intro > svg { width: 21px; flex: 0 0 auto; }.module-intro div { display: flex; flex-direction: column; gap: 3px; }.module-intro strong { font-size: 13px; }.module-intro span { color: #a7666a; font-size: 11px; }
.module-content { padding: 0 16px calc(22px + env(safe-area-inset-bottom)); }.module-content :deep(.section-block) { padding: 16px; border-radius: 12px; }.module-content :deep(.panel-stack), .module-content :deep(.panel-grid) { gap: 12px; }.module-content :deep(.panel-grid) { grid-template-columns: 1fr; }.module-content :deep(.section-heading) { align-items: stretch; flex-direction: column; gap: 10px; }.module-content :deep(.section-heading .el-button), .module-content :deep(.submit-row .el-button) { width: 100%; }.module-content :deep(.form-grid), .module-content :deep(.form-grid.cols-three) { grid-template-columns: 1fr; gap: 0; }.module-content :deep(.el-form-item) { margin-bottom: 18px; }.module-content :deep(.el-input-number), .module-content :deep(.el-input), .module-content :deep(.el-select), .module-content :deep(.el-date-editor) { width: 100%; }.module-content :deep(.el-descriptions) { font-size: 12px; }.module-content :deep(.el-descriptions__table) { table-layout: fixed; }.module-content :deep(.el-table) { font-size: 11px; }.module-content :deep(.el-table__body-wrapper) { overflow-x: auto; }.module-content :deep(.submit-row) { align-items: stretch; flex-direction: column; gap: 10px; }.module-content :deep(.el-segmented) { width: 100%; }.module-content :deep(.el-segmented__group) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.module-switcher { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }.module-switcher button { min-height: 44px; border: 1px solid #e1e5e9; border-radius: 10px; background: #fff; color: #667085; font-size: 14px; cursor: pointer; }.module-switcher button.active { border-color: #ac0c14; background: #fff1f1; color: #ac0c14; font-weight: 700; }
@media (max-width: 480px) { .module-page { padding: 0; background: #f6f7f9; }.module-device { width: 100%; height: 100dvh; min-height: 0; box-shadow: none; }.module-header { padding-top: calc(env(safe-area-inset-top) + 8px); }.module-content { padding-right: 12px; padding-left: 12px; } }
</style>
