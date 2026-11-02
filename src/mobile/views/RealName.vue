<template>
  <div class="m-page realname">
    <MHeader title="实名认证" theme="solid" />

    <div class="m-body">
      <div class="realname__status" :class="`is-${status}`">
        <div class="realname__status-title">{{ statusTitle }}</div>
        <div class="realname__status-desc">{{ statusDesc }}</div>
      </div>

      <div v-if="info.real_name_masked" class="m-cell-group realname__info">
        <div class="m-cell">
          <span class="m-cell__label">姓名</span>
          <span class="m-cell__value">{{ info.real_name_masked }}</span>
        </div>
        <div class="m-cell">
          <span class="m-cell__label">身份证号</span>
          <span class="m-cell__value">{{ info.id_card_masked }}</span>
        </div>
        <div class="m-cell">
          <span class="m-cell__label">提交时间</span>
          <span class="m-cell__value">{{ shortTime(info.submitted_at) }}</span>
        </div>
        <div v-if="info.verified_at" class="m-cell">
          <span class="m-cell__label">认证时间</span>
          <span class="m-cell__value">{{ shortTime(info.verified_at) }}</span>
        </div>
      </div>

      <div v-if="status === 3 && info.reject_reason" class="realname__reject">
        驳回原因：{{ info.reject_reason }}
      </div>

      <template v-if="canSubmit">
        <div class="m-cell-group realname__form">
          <div class="m-field">
            <span class="m-field__label">真实姓名</span>
            <input
              v-model="form.realName"
              class="m-field__input"
              type="text"
              maxlength="30"
              placeholder="请输入身份证上的姓名"
            />
          </div>
          <div class="m-field">
            <span class="m-field__label">身份证号</span>
            <input
              v-model="form.idCardNo"
              class="m-field__input"
              type="text"
              maxlength="18"
              placeholder="请输入 18 位身份证号"
            />
          </div>
        </div>

        <p class="realname__tip">
          姓名与证件号仅用于实名核验，服务端只保存掩码与哈希，不落明文；认证通过后可用于下单与安全风控。
        </p>

        <button class="m-btn realname__submit" type="button" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中…' : '提交认证' }}
        </button>
      </template>

      <div v-else class="realname__done">
        <div class="realname__done-icon">
          <MIcon :name="status === 2 ? 'shield' : 'clock'" :size="26" />
        </div>
        <p>{{ status === 2 ? '实名信息已核验通过，无需重复提交' : '认证审核中，通常 1 个工作日内完成' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import { getRealName, submitRealName } from '@/mobile/api/passenger'
import { showToast } from '@/mobile/utils/ui'

const statusText = {
  0: { title: '未实名认证', desc: '完成实名后可提升账号安全等级' },
  1: { title: '认证审核中', desc: '资料已提交，请耐心等待审核结果' },
  2: { title: '已通过实名认证', desc: '账号已具备完整出行与支付能力' },
  3: { title: '认证被驳回', desc: '请核对信息后重新提交' }
}

const status = ref(0)
const submitting = ref(false)
const info = reactive({
  real_name_status: 0,
  record_status: 0,
  real_name_masked: '',
  id_card_masked: '',
  submitted_at: '',
  verified_at: '',
  reject_reason: ''
})

const form = reactive({ realName: '', idCardNo: '' })

const canSubmit = computed(() => status.value === 0 || status.value === 3)
const statusTitle = computed(() => statusText[status.value]?.title || '未实名认证')
const statusDesc = computed(() => statusText[status.value]?.desc || '')

function shortTime(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

async function load() {
  try {
    const data = await getRealName()
    Object.assign(info, data || {})
    status.value = Number(data.real_name_status || 0)
  } catch (e) {
    // 未登录或网络异常，保持未认证态
  }
}

async function submit() {
  if (submitting.value) return
  const realName = form.realName.trim()
  const idCardNo = form.idCardNo.trim().toUpperCase()

  if (realName.length < 2 || realName.length > 30) {
    showToast('真实姓名需为 2-30 个字符')
    return
  }
  if (!/^\d{17}[\dX]$/.test(idCardNo)) {
    showToast('请输入 18 位有效身份证号')
    return
  }

  submitting.value = true
  try {
    const data = await submitRealName({ realName, idCardNo })
    status.value = Number(data.real_name_status || 1)
    info.real_name_masked = data.real_name_masked || ''
    info.id_card_masked = data.id_card_masked || ''
    info.submitted_at = data.submitted_at || ''
    form.realName = ''
    form.idCardNo = ''
    showToast('提交成功，等待审核')
  } catch (e) {
    // 错误提示已由拦截器下发
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.realname {
  background: #f5f7fa;
}

.realname__status {
  padding: 18px;
  background: linear-gradient(135deg, #eefaf6, #e2f5ee);
  border-radius: 18px;
}

.realname__status.is-1 {
  background: linear-gradient(135deg, #fff6e9, #ffefd6);
}

.realname__status.is-3 {
  background: linear-gradient(135deg, #fdeeee, #fbe2e2);
}

.realname__status-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f2933;
}

.realname__status-desc {
  margin-top: 6px;
  font-size: 12px;
  color: #6f7d87;
}

.realname__info,
.realname__form {
  margin-top: 14px;
}

.realname__reject {
  margin-top: 12px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #c2453f;
  background: #fdeeee;
  border-radius: 12px;
}

.realname__tip {
  margin: 12px 4px 0;
  font-size: 12px;
  line-height: 1.7;
  color: #93a1ab;
}

.realname__submit {
  margin-top: 20px;
}

.realname__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  font-size: 13px;
  color: #93a1ab;
  text-align: center;
}

.realname__done-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: #16c79a;
  background: #e7f9f3;
  border-radius: 50%;
}
</style>
