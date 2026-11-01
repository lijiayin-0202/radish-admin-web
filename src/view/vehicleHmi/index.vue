<template>
  <div class="vehicle-hmi-page">
    <header class="page-header">
      <div class="brand-block">
        <div class="brand-mark">R</div>
        <div>
          <p class="eyebrow">APOLLO GO · MODULE 04</p>
          <h1>车辆端与车内 HMI</h1>
          <p>萝卜快跑乘客端体验与车辆接口联调工作台</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="service-state"><i />ride-hailing :18000</span>
        <el-segmented v-model="previewPhase" :options="phaseOptions" />
      </div>
    </header>

    <div class="workspace">
      <aside class="preview-column">
        <div class="preview-heading">
          <div><span>乘客端实时预览</span><small>界面参考萝卜快跑 App 原型</small></div>
          <el-tag effect="dark" type="danger">{{ phaseLabel }}</el-tag>
        </div>
        <PassengerPreview
          :phase="previewPhase"
          :telemetry="previewTelemetry"
          @action="handlePreviewAction"
        />
        <div class="preview-note">
          <InfoFilled />
          <span>右侧接口提交成功后，行程阶段、速度、电量和剩余里程会同步到乘客端预览。</span>
        </div>
      </aside>

      <main class="console-column">
        <div class="console-title">
          <div>
            <p class="eyebrow">VEHICLE SERVICE CONSOLE</p>
            <h2>模块四接口控制台</h2>
            <p>所有请求通过 API 层调用后端服务，数据库写入由后端 data 层完成。</p>
          </div>
          <div class="endpoint-count"><b>9</b><span>个接口</span></div>
        </div>

        <div class="flow-strip">
          <div v-for="item in flowItems" :key="item.value" :class="{ active: item.value === previewPhase }">
            <span>{{ item.step }}</span><p>{{ item.label }}</p>
          </div>
        </div>

        <el-tabs v-model="activePanel" class="console-tabs" stretch>
          <el-tab-pane name="overview">
            <template #label><DataAnalysis />行程与指令</template>
            <OverviewPanel @view-loaded="handleViewLoaded" />
          </el-tab-pane>
          <el-tab-pane name="boarding">
            <template #label><Key />上车核验</template>
            <BoardingPanel @verified="handleVerified" />
          </el-tab-pane>
          <el-tab-pane name="vehicle-data">
            <template #label><Odometer />车辆状态</template>
            <VehicleDataPanel @telemetry-reported="handleTelemetry" />
          </el-tab-pane>
          <el-tab-pane name="safety-media">
            <template #label><Service />安全与媒体</template>
            <SafetyMediaPanel />
          </el-tab-pane>
        </el-tabs>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DataAnalysis, InfoFilled, Key, Odometer, Service } from '@element-plus/icons-vue'
import PassengerPreview from './components/PassengerPreview.vue'
import OverviewPanel from './components/OverviewPanel.vue'
import BoardingPanel from './components/BoardingPanel.vue'
import VehicleDataPanel from './components/VehicleDataPanel.vue'
import SafetyMediaPanel from './components/SafetyMediaPanel.vue'
import { mergePreviewTelemetry, resolveTripPhase } from './helpers'

defineOptions({ name: 'VehicleHmi' })

const activePanel = ref('overview')
const previewPhase = ref('waiting')
const previewTelemetry = ref({})
const phaseOptions = [
  { label: '等待接驾', value: 'waiting' },
  { label: '车辆到达', value: 'arrived' },
  { label: '行程中', value: 'riding' },
  { label: '已到达', value: 'completed' }
]
const flowItems = phaseOptions.map((item, index) => ({ ...item, step: String(index + 1).padStart(2, '0') }))
const phaseLabel = computed(() => phaseOptions.find((item) => item.value === previewPhase.value)?.label || '等待接驾')

// 聚合接口返回订单状态后，同步乘客端所处阶段。
const handleViewLoaded = (view) => {
  previewPhase.value = resolveTripPhase(view.orderStatus)
}

// 四位上车码核验通过后，乘客端进入行程中状态。
const handleVerified = (succeeded) => {
  previewPhase.value = succeeded ? 'riding' : 'arrived'
}

// 遥测上报成功后，只合并有效数据并同步车辆运行阶段。
const handleTelemetry = (telemetry) => {
  previewTelemetry.value = mergePreviewTelemetry(previewTelemetry.value, telemetry)
  if (telemetry.operationStatus === 3) previewPhase.value = 'riding'
}

// 手机预览中的快捷操作只负责切换业务面板，不直接发请求。
const handlePreviewAction = (action) => {
  const panelByAction = {
    boarding: 'boarding',
    support: 'safety-media',
    safety: 'safety-media',
    vehicle: 'vehicle-data'
  }
  activePanel.value = panelByAction[action] || 'overview'
  document.querySelector('.console-column')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style scoped>
.vehicle-hmi-page { min-height: calc(100vh - 112px); padding: 18px; border-radius: 6px; background: #e9ecef; color: #1d232b; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 18px; padding: 17px 20px; border-top: 3px solid #ac0c14; border-radius: 5px; background: #fff; box-shadow: 0 5px 18px rgb(24 32 43 / 7%); }
.brand-block, .header-actions, .service-state { display: flex; align-items: center; }.brand-block { gap: 13px; }.brand-mark { display: grid; place-items: center; width: 48px; height: 48px; border: 2px solid #ac0c14; color: #ac0c14; font-size: 25px; font-weight: 900; font-style: italic; transform: skew(-8deg); }.brand-block h1 { margin: 1px 0 3px; font-size: 21px; }.brand-block p, .console-title p { margin: 0; color: #727985; font-size: 12px; }.eyebrow { color: #ac0c14 !important; font-family: ui-monospace, monospace; font-size: 9px !important; letter-spacing: 0; }
.header-actions { gap: 18px; }.service-state { gap: 7px; color: #5f6873; font-size: 11px; }.service-state i { width: 8px; height: 8px; border-radius: 50%; background: #2ba24c; box-shadow: 0 0 0 4px rgb(43 162 76 / 12%); }
.workspace { display: grid; grid-template-columns: 430px minmax(0, 1fr); gap: 18px; align-items: start; }.preview-column { position: sticky; top: 12px; display: grid; gap: 11px; }.preview-heading { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-left: 3px solid #ac0c14; border-radius: 4px; background: #fff; }.preview-heading div { display: flex; flex-direction: column; gap: 2px; }.preview-heading span { font-size: 14px; font-weight: 700; }.preview-heading small { color: #808792; font-size: 10px; }.preview-note { display: flex; gap: 8px; padding: 10px 12px; border-radius: 4px; background: #fff; color: #667085; font-size: 11px; line-height: 1.6; }.preview-note svg { width: 16px; flex: 0 0 auto; color: #ac0c14; }
.console-column { min-width: 0; padding: 20px; border-radius: 6px; background: #fff; box-shadow: 0 5px 18px rgb(24 32 43 / 7%); }.console-title { display: flex; align-items: center; justify-content: space-between; gap: 16px; }.console-title h2 { margin: 3px 0 4px; font-size: 19px; }.endpoint-count { display: flex; align-items: baseline; gap: 4px; padding: 8px 12px; border: 1px solid #edd4d6; color: #ac0c14; }.endpoint-count b { font-size: 23px; }.endpoint-count span { font-size: 10px; }
.flow-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 18px 0; padding: 10px; background: #f5f6f7; }.flow-strip div { padding: 9px 10px; border-left: 2px solid #d7dbe0; color: #89909a; }.flow-strip div.active { border-color: #ac0c14; background: #fff; color: #ac0c14; box-shadow: 0 2px 8px rgb(24 32 43 / 6%); }.flow-strip span { font-family: ui-monospace, monospace; font-size: 9px; }.flow-strip p { margin: 3px 0 0; color: inherit; font-size: 11px; font-weight: 700; }
.console-tabs :deep(.el-tabs__item) { gap: 5px; }.console-tabs :deep(.el-tabs__item svg) { width: 16px; }.console-tabs :deep(.el-tabs__active-bar) { background: #ac0c14; }.console-tabs :deep(.el-tabs__item.is-active), .console-tabs :deep(.el-tabs__item:hover) { color: #ac0c14; }
@media (max-width: 1280px) { .workspace { grid-template-columns: 405px minmax(0, 1fr); }.header-actions { align-items: flex-end; flex-direction: column; gap: 8px; } }
@media (max-width: 980px) { .page-header { align-items: stretch; flex-direction: column; }.header-actions { align-items: stretch; }.service-state { justify-content: center; }.workspace { grid-template-columns: 1fr; }.preview-column { position: static; }.console-column { padding: 14px; } }
@media (max-width: 600px) { .vehicle-hmi-page { padding: 8px; }.page-header { padding: 14px; }.brand-block h1 { font-size: 18px; }.header-actions :deep(.el-segmented) { width: 100%; }.console-title { align-items: flex-start; flex-direction: column; }.flow-strip { grid-template-columns: repeat(2, 1fr); } }
</style>
