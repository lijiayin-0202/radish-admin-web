<template>
  <section class="section-block">
    <div class="section-heading">
      <div><h3>乘客上车核验</h3><p>输入四位动态码，前端只提交 SHA-256 摘要，不保存明文。</p></div>
      <el-tag type="warning" effect="plain"><Lock />凭证脱敏</el-tag>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
      <div class="form-grid">
        <el-form-item label="订单 ID" prop="orderId">
          <el-input-number v-model="form.orderId" :min="1" :controls="false" />
        </el-form-item>
        <el-form-item label="核验方式" prop="verificationType">
          <el-select v-model="form.verificationType">
            <el-option label="手机尾号动态码" :value="1" />
            <el-option label="NFC" :value="2" />
            <el-option label="二维码" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="四位动态码" prop="credential">
          <el-input v-model="form.credential" maxlength="4" show-word-limit placeholder="请输入 4 位数字" />
        </el-form-item>
        <el-form-item label="核验结果">
          <el-switch v-model="form.succeeded" active-text="通过" inactive-text="拒绝" />
        </el-form-item>
      </div>
      <el-form-item v-if="!form.succeeded" label="失败原因" prop="failureReason">
        <el-input v-model.trim="form.failureReason" placeholder="例如：动态码不匹配" />
      </el-form-item>
      <div class="submit-row">
        <span v-if="lastResult">最近核验：{{ lastResult.attemptResult === 1 ? '通过' : '失败' }} · {{ formatTime(lastResult.verifiedAt) }}</span>
        <el-button type="primary" :loading="submitting" @click="submit"><Key />提交核验</el-button>
      </div>
    </el-form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Lock } from '@element-plus/icons-vue'
import { verifyBoarding } from '@/api/vehicleHmi'
import { errorMessage, hashCredential } from '../helpers'

const emit = defineEmits(['verified'])
const formRef = ref()
const submitting = ref(false)
const lastResult = ref(null)
const form = reactive({ orderId: 1, verificationType: 1, credential: '', succeeded: true, failureReason: '' })

const validateCredential = (_rule, value, callback) => {
  if (!/^\d{4}$/.test(value)) callback(new Error('上车动态码必须是 4 位数字'))
  else callback()
}

const rules = {
  orderId: [{ required: true, message: '请输入订单 ID', trigger: 'blur' }],
  verificationType: [{ required: true, message: '请选择核验方式', trigger: 'change' }],
  credential: [{ required: true, validator: validateCredential, trigger: 'blur' }],
  failureReason: [{ validator: (_rule, value, callback) => {
    if (!form.succeeded && !value) callback(new Error('核验失败时必须填写原因'))
    else callback()
  }, trigger: 'blur' }]
}

const formatTime = (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'

const submit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const credentialHash = await hashCredential(form.credential)
    lastResult.value = await verifyBoarding(form.orderId, {
      verificationType: form.verificationType,
      credentialHash,
      succeeded: form.succeeded,
      failureReason: form.succeeded ? '' : form.failureReason
    })
    form.credential = ''
    emit('verified', form.succeeded)
    ElMessage.success('上车核验记录已写入数据库')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.section-block { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.section-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.section-heading h3 { margin: 0; color: #1f2937; font-size: 16px; }.section-heading p { margin: 5px 0 0; color: #6b7280; font-size: 12px; }
.section-heading svg, .submit-row svg { width: 15px; margin-right: 5px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 18px; }
.form-grid :deep(.el-input-number), .form-grid :deep(.el-select) { width: 100%; }
.submit-row { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding-top: 14px; border-top: 1px solid #eef0f2; color: #667085; font-size: 12px; }
@media (max-width: 760px) { .form-grid { grid-template-columns: 1fr; }.submit-row { align-items: stretch; flex-direction: column; }.submit-row .el-button { width: 100%; } }
</style>
