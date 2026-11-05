<template>
  <main class="fault-page">
    <section class="fault-device">
      <header class="fault-header">
        <button type="button" aria-label="返回车辆 HMI" @click="backToHmi"><ArrowLeft /></button>
        <div><span>VEHICLE HMI</span><h1>故障上报</h1></div>
        <i />
      </header>

      <section class="fault-notice">
        <WarningFilled />
        <div><strong>车辆异常记录</strong><span>提交后将同步至车辆服务中心</span></div>
      </section>

      <el-form class="fault-form" :model="fault" label-position="top" @submit.prevent>
        <el-form-item label="故障编号"><el-input v-model.trim="fault.faultNo" /></el-form-item>
        <div class="form-pair">
          <el-form-item label="车辆 ID"><el-input-number v-model="fault.vehicleId" :min="1" :controls="false" /></el-form-item>
          <el-form-item label="关联订单 ID"><el-input-number v-model="fault.relatedOrderId" :min="0" :controls="false" /></el-form-item>
        </div>
        <el-form-item label="故障代码"><el-input v-model.trim="fault.faultCode" /></el-form-item>
        <div class="form-pair">
          <el-form-item label="故障等级"><el-select v-model="fault.faultLevel"><el-option v-for="item in faultLevelOptions" :key="item.value" v-bind="item" /></el-select></el-form-item>
          <el-form-item label="处理状态"><el-select v-model="fault.status"><el-option label="未处理" :value="0" /><el-option label="处理中" :value="1" /><el-option label="已恢复" :value="2" /><el-option label="已关闭" :value="3" /></el-select></el-form-item>
        </div>
        <el-form-item label="故障描述"><el-input v-model.trim="fault.faultDescription" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="故障快照 JSON"><el-input v-model="fault.faultDataText" type="textarea" :rows="5" /></el-form-item>
        <p v-if="faultResult" class="submit-result">{{ faultResult }}</p>
        <el-button class="submit-button" type="danger" :loading="submitting" @click="submitFault"><WarningFilled />上报故障</el-button>
      </el-form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, WarningFilled } from '@element-plus/icons-vue'
import { reportFault } from '@/api/vehicleHmi'
import { faultLevelOptions } from '@/constants/vehicleHmi'
import { errorMessage, parseJsonObject } from './helpers'

defineOptions({ name: 'VehicleHmiFaultReport' })

const router = useRouter()
const submitting = ref(false)
const faultResult = ref('')
const fault = reactive({
  faultNo: `FAULT-${Date.now()}`,
  vehicleId: 1,
  relatedOrderId: 1,
  faultCode: 'SENSOR_WARN',
  faultLevel: 1,
  faultDescription: '传感器短时信号波动',
  status: 0,
  faultDataText: '{"sensor":"camera_front"}'
})

const backToHmi = () => router.push({ name: 'VehicleHmiPreview' })

const submitFault = async () => {
  if (!fault.faultNo || !fault.faultCode || !fault.faultDescription) {
    ElMessage.warning('请完整填写故障编号、代码和描述')
    return
  }

  submitting.value = true
  try {
    const payload = {
      ...fault,
      faultData: parseJsonObject(fault.faultDataText, '故障快照'),
      occurredAt: new Date().toISOString()
    }
    delete payload.faultDataText
    const result = await reportFault(payload)
    faultResult.value = `记录时间：${new Date(result.reportedAt).toLocaleString('zh-CN')}`
    ElMessage.success('故障记录已写入数据库')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.fault-page { display: grid; box-sizing: border-box; height: 100dvh; min-height: 0; place-items: center; padding: 18px; overflow: hidden; background: #e9ecef; color: #1f2937; }
.fault-device { width: min(100%, 430px); height: min(844px, calc(100dvh - 36px)); min-height: 0; overflow-y: auto; overscroll-behavior: contain; background: #f6f7f9; box-shadow: 0 24px 60px rgb(15 23 42 / 24%); }
.fault-header { position: sticky; z-index: 2; top: 0; display: grid; grid-template-columns: 40px 1fr 40px; align-items: center; min-height: 66px; padding: env(safe-area-inset-top) 16px 8px; background: rgb(255 255 255 / 94%); box-shadow: 0 1px 0 rgb(15 23 42 / 8%); backdrop-filter: blur(14px); }.fault-header button { display: grid; width: 36px; height: 36px; place-items: center; border: 0; border-radius: 18px; background: #f0f2f5; color: #202938; cursor: pointer; }.fault-header button svg { width: 20px; }.fault-header div { text-align: center; }.fault-header span { color: #ac0c14; font-family: ui-monospace, monospace; font-size: 9px; }.fault-header h1 { margin: 2px 0 0; font-size: 17px; }.fault-header i { width: 36px; height: 36px; }
.fault-notice { display: flex; gap: 11px; margin: 16px; padding: 13px; border-radius: 10px; background: #fff1f1; color: #9c1118; }.fault-notice svg { width: 21px; flex: 0 0 auto; }.fault-notice div { display: flex; flex-direction: column; gap: 3px; }.fault-notice strong { font-size: 13px; }.fault-notice span { color: #a7666a; font-size: 11px; }
.fault-form { padding: 0 16px calc(22px + env(safe-area-inset-bottom)); }.fault-form :deep(.el-form-item) { margin-bottom: 14px; }.fault-form :deep(.el-input-number), .fault-form :deep(.el-select) { width: 100%; }.form-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }.submit-result { margin: 4px 0 12px; color: #667085; font-size: 11px; line-height: 1.5; }.submit-button { width: 100%; min-height: 46px; font-size: 14px; }.submit-button svg { width: 17px; margin-right: 6px; }
@media (max-width: 480px) { .fault-page { padding: 0; background: #f6f7f9; }.fault-device { width: 100%; height: 100dvh; min-height: 0; box-shadow: none; }.fault-header { padding-top: calc(env(safe-area-inset-top) + 8px); }.form-pair { grid-template-columns: 1fr; gap: 0; } }
</style>
