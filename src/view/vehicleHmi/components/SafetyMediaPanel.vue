<template>
  <div class="panel-grid">
    <section v-if="activePanel === 'assistance'" class="section-block">
      <div class="section-heading"><Lock /><div><h3>安全协助</h3><p>提交靠边停车或远程协助请求，并触发后端业务事件。</p></div></div>
      <el-form :model="assistance" label-position="top" @submit.prevent>
        <div class="form-grid">
          <el-form-item label="订单 ID"><el-input-number v-model="assistance.orderId" :min="1" :controls="false" /></el-form-item>
          <el-form-item label="车辆 ID"><el-input-number v-model="assistance.vehicleId" :min="1" :controls="false" /></el-form-item>
        </div>
        <el-form-item label="协助类型"><el-segmented v-model="assistance.assistanceType" :options="assistanceTypeOptions" /></el-form-item>
        <el-form-item label="请求原因"><el-input v-model.trim="assistance.reason" type="textarea" :rows="4" placeholder="说明乘客或车辆当前情况" /></el-form-item>
        <div class="submit-row">
          <span>{{ assistanceResult }}</span>
          <el-button type="danger" :loading="assistanceLoading" @click="submitAssistance"><Service />请求协助</el-button>
        </div>
      </el-form>
    </section>

    <section v-else class="section-block">
      <div class="section-heading"><VideoCamera /><div><h3>媒体记录</h3><p>登记视频、音频或系统日志的存储元数据。</p></div></div>
      <el-form :model="media" label-position="top" @submit.prevent>
        <div class="form-grid">
          <el-form-item label="车辆 ID"><el-input-number v-model="media.vehicleId" :min="1" :controls="false" /></el-form-item>
          <el-form-item label="关联订单 ID"><el-input-number v-model="media.relatedOrderId" :min="0" :controls="false" /></el-form-item>
          <el-form-item label="媒体类型"><el-select v-model="media.mediaType"><el-option v-for="item in mediaTypeOptions" :key="item.value" v-bind="item" /></el-select></el-form-item>
          <el-form-item label="访问级别"><el-select v-model="media.accessLevel"><el-option label="普通" :value="1" /><el-option label="受限" :value="2" /><el-option label="敏感" :value="3" /></el-select></el-form-item>
        </div>
        <el-form-item label="存储键"><el-input v-model.trim="media.storageKey" placeholder="vehicle/1/2026/10/record.mp4" /></el-form-item>
        <div class="form-grid">
          <el-form-item label="开始时间"><el-date-picker v-model="media.startedAt" type="datetime" /></el-form-item>
          <el-form-item label="结束时间"><el-date-picker v-model="media.endedAt" type="datetime" /></el-form-item>
          <el-form-item label="保留至"><el-date-picker v-model="media.retentionUntil" type="datetime" /></el-form-item>
          <el-form-item label="文件大小（字节）"><el-input-number v-model="media.fileSizeBytes" :min="0" :controls="false" /></el-form-item>
        </div>
        <div class="submit-row">
          <span>{{ mediaResult }}</span>
          <el-button type="primary" :loading="mediaLoading" @click="submitMedia"><Upload />登记媒体</el-button>
        </div>
      </el-form>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Service, Upload, VideoCamera } from '@element-plus/icons-vue'
import { reportMediaRecord, requestAssistance } from '@/api/vehicleHmi'
import { assistanceTypeOptions, mediaTypeOptions } from '@/constants/vehicleHmi'
import { errorMessage, toIsoString } from '../helpers'

const assistanceLoading = ref(false)
defineProps({ activePanel: { type: String, default: 'assistance' } })
const mediaLoading = ref(false)
const assistanceResult = ref('')
const mediaResult = ref('')
const now = new Date()
const later = new Date(now.getTime() + 10 * 60 * 1000)
const retention = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

const assistance = reactive({ orderId: 1, vehicleId: 1, assistanceType: 5, reason: '乘客需要远程客服协助' })
const media = reactive({
  vehicleId: 1, relatedOrderId: 1, mediaType: 1, storageKey: 'vehicle/1/trip/record.mp4',
  startedAt: now, endedAt: later, retentionUntil: retention, fileSizeBytes: 1048576, accessLevel: 2
})

const submitAssistance = async () => {
  if (!assistance.reason) {
    ElMessage.warning('请填写协助原因')
    return
  }
  assistanceLoading.value = true
  try {
    const result = await requestAssistance(assistance.orderId, assistance)
    assistanceResult.value = `受理时间：${new Date(result.requestedAt).toLocaleString('zh-CN')}`
    ElMessage.success('协助请求已写入数据库')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    assistanceLoading.value = false
  }
}

const submitMedia = async () => {
  if (!media.storageKey) {
    ElMessage.warning('请填写媒体存储键')
    return
  }
  mediaLoading.value = true
  try {
    const result = await reportMediaRecord({
      ...media,
      startedAt: toIsoString(media.startedAt),
      endedAt: toIsoString(media.endedAt),
      retentionUntil: toIsoString(media.retentionUntil)
    })
    mediaResult.value = `登记时间：${new Date(result.recordedAt).toLocaleString('zh-CN')}`
    ElMessage.success('媒体元数据已写入数据库')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    mediaLoading.value = false
  }
}
</script>

<style scoped>
.panel-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.section-block { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.section-heading { display: flex; align-items: start; gap: 10px; margin-bottom: 16px; }.section-heading > svg { width: 22px; color: #ac0c14; }.section-heading h3 { margin: 0; color: #1f2937; font-size: 16px; }.section-heading p { margin: 5px 0 0; color: #6b7280; font-size: 12px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }
:deep(.el-input-number), :deep(.el-select), :deep(.el-date-editor) { width: 100%; }
.submit-row { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-top: 14px; border-top: 1px solid #eef0f2; color: #667085; font-size: 12px; }.submit-row svg { width: 15px; margin-right: 5px; }
@media (max-width: 1200px) { .panel-grid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; }.submit-row { align-items: stretch; flex-direction: column; }.submit-row .el-button { width: 100%; } }
</style>
