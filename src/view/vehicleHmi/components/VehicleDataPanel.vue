<template>
  <section class="section-block">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="实时遥测" name="telemetry">
        <el-form :model="telemetry" label-position="top" @submit.prevent>
          <div class="form-grid cols-three">
            <el-form-item label="车辆 ID"><el-input-number v-model="telemetry.vehicleId" :min="1" :controls="false" /></el-form-item>
            <el-form-item label="关联订单 ID"><el-input-number v-model="telemetry.relatedOrderId" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="运行状态"><el-select v-model="telemetry.operationStatus"><el-option v-for="item in operationStatusOptions" :key="item.value" v-bind="item" /></el-select></el-form-item>
            <el-form-item label="经度"><el-input-number v-model="telemetry.longitude" :min="-180" :max="180" :precision="6" :controls="false" /></el-form-item>
            <el-form-item label="纬度"><el-input-number v-model="telemetry.latitude" :min="-90" :max="90" :precision="6" :controls="false" /></el-form-item>
            <el-form-item label="速度 km/h"><el-input-number v-model="telemetry.speedKmh" :min="0" :precision="1" /></el-form-item>
          <el-form-item label="电量 %"><el-input-number v-model="telemetry.batteryPercent" :min="0" :max="100" :precision="0" /></el-form-item>
          <el-form-item label="路线进度 %"><el-input-number v-model="telemetry.routeProgressPercent" :min="0" :max="100" :precision="0" /></el-form-item>
            <el-form-item label="剩余里程 km"><el-input-number v-model="telemetry.remainingDistanceKm" :min="0" :precision="1" /></el-form-item>
            <el-form-item label="续航里程 km"><el-input-number v-model="telemetry.remainingRangeKm" :min="0" :precision="1" /></el-form-item>
            <el-form-item label="车内温度 ℃"><el-input-number v-model="telemetry.cabinTemperature" :precision="1" /></el-form-item>
          <el-form-item label="网络信号 %"><el-input-number v-model="telemetry.networkSignal" :min="0" :max="100" :precision="0" /></el-form-item>
            <el-form-item label="航向角"><el-input-number v-model="telemetry.headingDegree" :min="0" :max="359.9" :precision="1" /></el-form-item>
            <el-form-item label="定位精度 m"><el-input-number v-model="telemetry.positionAccuracyM" :min="0" :precision="1" /></el-form-item>
            <el-form-item label="软件版本"><el-input v-model.trim="telemetry.softwareVersion" /></el-form-item>
          </div>
          <div class="form-grid">
            <el-form-item label="车门状态 JSON"><el-input v-model="telemetry.doorStatusText" type="textarea" :rows="3" /></el-form-item>
            <el-form-item label="座椅状态 JSON"><el-input v-model="telemetry.seatStatusText" type="textarea" :rows="3" /></el-form-item>
          </div>
          <el-form-item label="扩展遥测 JSON"><el-input v-model="telemetry.telemetryDataText" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="告警码（逗号分隔）"><el-input v-model.trim="telemetry.warningCodesText" placeholder="WARN_001,WARN_002" /></el-form-item>
          <div class="submit-row">
            <span>{{ telemetryResult }}</span>
            <el-button type="primary" :loading="telemetryLoading" @click="submitTelemetry"><Position />上报遥测</el-button>
          </div>
        </el-form>
      </el-tab-pane>

      <el-tab-pane v-if="showFault" label="故障上报" name="fault">
        <el-form :model="fault" label-position="top" @submit.prevent>
          <div class="form-grid cols-three">
            <el-form-item label="故障编号"><el-input v-model.trim="fault.faultNo" /></el-form-item>
            <el-form-item label="车辆 ID"><el-input-number v-model="fault.vehicleId" :min="1" :controls="false" /></el-form-item>
            <el-form-item label="关联订单 ID"><el-input-number v-model="fault.relatedOrderId" :min="0" :controls="false" /></el-form-item>
            <el-form-item label="故障代码"><el-input v-model.trim="fault.faultCode" /></el-form-item>
            <el-form-item label="故障等级"><el-select v-model="fault.faultLevel"><el-option v-for="item in faultLevelOptions" :key="item.value" v-bind="item" /></el-select></el-form-item>
            <el-form-item label="处理状态"><el-select v-model="fault.status"><el-option label="未处理" :value="0" /><el-option label="处理中" :value="1" /><el-option label="已恢复" :value="2" /><el-option label="已关闭" :value="3" /></el-select></el-form-item>
          </div>
          <el-form-item label="故障描述"><el-input v-model.trim="fault.faultDescription" type="textarea" :rows="3" /></el-form-item>
          <el-form-item label="故障快照 JSON"><el-input v-model="fault.faultDataText" type="textarea" :rows="4" /></el-form-item>
          <div class="submit-row">
            <span>{{ faultResult }}</span>
            <el-button type="danger" :loading="faultLoading" @click="submitFault"><WarningFilled />上报故障</el-button>
          </div>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Position, WarningFilled } from '@element-plus/icons-vue'
import { reportFault, reportTelemetry } from '@/api/vehicleHmi'
import { faultLevelOptions, operationStatusOptions } from '@/constants/vehicleHmi'
import { errorMessage, parseJsonObject } from '../helpers'

const emit = defineEmits(['telemetry-reported'])
defineProps({
  showFault: { type: Boolean, default: true }
})
const activeTab = ref('telemetry')
const telemetryLoading = ref(false)
const faultLoading = ref(false)
const telemetryResult = ref('')
const faultResult = ref('')

const telemetry = reactive({
  vehicleId: 1, relatedOrderId: 1, longitude: 118.275, latitude: 33.963, speedKmh: 28,
  operationStatus: 3, onlineStatus: 1, batteryPercent: 86, softwareVersion: '1.0.0',
  headingDegree: 90, positionAccuracyM: 1.5, routeProgressPercent: 42, remainingDistanceKm: 2.8,
  remainingRangeKm: 210, cabinTemperature: 24, networkSignal: 92,
  telemetryDataText: '{"driveMode":"AUTO"}', doorStatusText: '{"rearLeft":"CLOSED","rearRight":"CLOSED"}',
  seatStatusText: '{"rearLeft":"OCCUPIED","seatbelt":"FASTENED"}', warningCodesText: ''
})
const fault = reactive({
  faultNo: `FAULT-${Date.now()}`, vehicleId: 1, relatedOrderId: 1, faultCode: 'SENSOR_WARN',
  faultLevel: 1, faultDescription: '传感器短时信号波动', status: 0, faultDataText: '{"sensor":"camera_front"}'
})

const submitTelemetry = async () => {
  telemetryLoading.value = true
  try {
    const payload = {
      ...telemetry,
      telemetryData: parseJsonObject(telemetry.telemetryDataText, '扩展遥测'),
      doorStatus: parseJsonObject(telemetry.doorStatusText, '车门状态'),
      seatStatus: parseJsonObject(telemetry.seatStatusText, '座椅状态'),
      warningCodes: telemetry.warningCodesText.split(',').map((item) => item.trim()).filter(Boolean)
    }
    delete payload.telemetryDataText
    delete payload.doorStatusText
    delete payload.seatStatusText
    delete payload.warningCodesText
    const result = await reportTelemetry(payload)
    telemetryResult.value = `服务端接收时间：${new Date(result.reportedAt).toLocaleString('zh-CN')}`
    emit('telemetry-reported', payload)
    ElMessage.success('遥测数据已写入数据库')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    telemetryLoading.value = false
  }
}

const submitFault = async () => {
  if (!fault.faultNo || !fault.faultCode || !fault.faultDescription) {
    ElMessage.warning('请完整填写故障编号、代码和描述')
    return
  }
  faultLoading.value = true
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
    faultLoading.value = false
  }
}
</script>

<style scoped>
.section-block { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }.cols-three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
:deep(.el-input-number), :deep(.el-select) { width: 100%; }
.submit-row { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding-top: 14px; border-top: 1px solid #eef0f2; color: #667085; font-size: 12px; }.submit-row svg { width: 15px; margin-right: 5px; }
@media (max-width: 1100px) { .cols-three { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .form-grid, .cols-three { grid-template-columns: 1fr; }.submit-row { align-items: stretch; flex-direction: column; }.submit-row .el-button { width: 100%; } }
</style>
