<template>
  <div class="m-page change">
    <MHeader title="更换绑定手机号" theme="solid" />

    <div class="m-body">
      <div class="change__tip">
        <MIcon name="shield" :size="14" />
        <span>为保障账号安全，需要同时验证「原手机号」和「新手机号」；换绑后需用新手机号登录。</span>
      </div>

      <div class="change__card">
        <div class="change__section-title">第一步 · 验证原手机号</div>
        <div class="change__current">当前绑定：{{ passenger.mobile || '—' }}</div>
        <div class="change__field">
          <input
            v-model="form.oldCode"
            class="change__input"
            type="tel"
            inputmode="numeric"
            maxlength="6"
            placeholder="原手机号收到的 6 位验证码"
          />
          <button
            class="change__code-btn"
            type="button"
            :disabled="!canSendOld || old.sending"
            @click="sendCode('old')"
          >
            {{ old.countdown > 0 ? `${old.countdown}s` : old.sending ? '发送中…' : '获取验证码' }}
          </button>
        </div>
      </div>

      <div class="change__card">
        <div class="change__section-title">第二步 · 验证新手机号</div>
        <div class="change__field">
          <span class="change__prefix">+86</span>
          <input
            v-model="form.newMobile"
            class="change__input"
            type="tel"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入新手机号"
          />
        </div>
        <div class="change__field">
          <input
            v-model="form.newCode"
            class="change__input"
            type="tel"
            inputmode="numeric"
            maxlength="6"
            placeholder="新手机号收到的 6 位验证码"
          />
          <button
            class="change__code-btn"
            type="button"
            :disabled="!canSendNew || fresh.sending"
            @click="sendCode('new')"
          >
            {{ fresh.countdown > 0 ? `${fresh.countdown}s` : fresh.sending ? '发送中…' : '获取验证码' }}
          </button>
        </div>
      </div>

      <button class="m-btn change__submit" type="button" :disabled="!canSubmit || submitting" @click="submit">
        {{ submitting ? '提交中…' : '确认更换' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import MHeader from '@/mobile/components/MHeader.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import { changeMobile, getProfile, sendSmsCode } from '@/mobile/api/passenger'
import { session, setProfile } from '@/mobile/store/session'
import { showToast } from '@/mobile/utils/ui'

const MOBILE_PATTERN = /^1[3-9]\d{9}$/

const router = useRouter()
const profile = ref(session.profile || null)
const passenger = computed(() => profile.value?.passenger || {})

const form = reactive({ oldCode: '', newMobile: '', newCode: '' })
// 两个验证码各自倒计时，避免共用一个计时器互相干扰
const old = reactive({ verificationId: '', countdown: 0, sending: false })
const fresh = reactive({ verificationId: '', countdown: 0, sending: false })
const submitting = ref(false)

let oldTimer = null
let newTimer = null

const canSendOld = computed(() => Boolean(passenger.value.mobile))
const canSendNew = computed(() => MOBILE_PATTERN.test(form.newMobile.trim()))
const canSubmit = computed(
  () =>
    /^\d{6}$/.test(form.oldCode.trim()) &&
    /^\d{6}$/.test(form.newCode.trim()) &&
    canSendNew.value
)

function startCountdown(target, timerKey) {
  target.countdown = 60
  window.clearInterval(timerKey === 'old' ? oldTimer : newTimer)
  const timer = window.setInterval(() => {
    target.countdown -= 1
    if (target.countdown <= 0) window.clearInterval(timer)
  }, 1000)
  if (timerKey === 'old') oldTimer = timer
  else newTimer = timer
}

onBeforeUnmount(() => {
  window.clearInterval(oldTimer)
  window.clearInterval(newTimer)
})

// 发送验证码：原号传当前绑定手机号，新号传输入的号码；场景不同，后端会校验归属
async function sendCode(kind) {
  const isOld = kind === 'old'
  const target = isOld ? old : fresh
  if (target.sending || target.countdown > 0) return

  const mobile = isOld ? passenger.value.mobile : form.newMobile.trim()
  if (!mobile) {
    showToast(isOld ? '当前账号未绑定手机号' : '请先输入新手机号')
    return
  }
  if (!isOld && !MOBILE_PATTERN.test(mobile)) {
    showToast('手机号格式不正确')
    return
  }

  target.sending = true
  try {
    const data = await sendSmsCode({
      mobile,
      scene: isOld ? 'CHANGE_MOBILE_OLD' : 'CHANGE_MOBILE_NEW'
    })
    target.verificationId = data.verification_id || ''
    startCountdown(target, kind)
    showToast(`验证码已发送至 ${data.masked_mobile || mobile}`)
  } catch (e) {
    // 具体失败原因（号码被占用、原号不匹配等）已由 http 拦截器统一 toast
  } finally {
    target.sending = false
  }
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const data = await changeMobile({
      newMobile: form.newMobile.trim(),
      oldSmsCode: form.oldCode.trim(),
      oldVerificationId: old.verificationId,
      newSmsCode: form.newCode.trim(),
      newVerificationId: fresh.verificationId
    })
    const nextProfile = { ...(profile.value || {}), passenger: data.passenger }
    profile.value = nextProfile
    setProfile(nextProfile)
    showToast('手机号已更换，请使用新手机号登录')
    router.replace('/m/account')
    const latest = await getProfile().catch(() => null)
    if (latest) setProfile(latest)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const data = await getProfile()
    profile.value = data
    setProfile(data)
  } catch (e) {
    // 保留本地缓存，页面仍可展示脱敏手机号
  }
})
</script>

<style scoped>
.change {
  background: #f5f7fa;
}

.change__tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #7a8699;
  background: #eef4ff;
  border-radius: 10px;
}

.change__card {
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgba(23, 43, 77, 0.06);
}

.change__section-title {
  font-size: 14px;
  font-weight: 600;
  color: #2f3b52;
}

.change__current {
  margin: 6px 0 12px;
  font-size: 13px;
  color: #8a94a6;
}

.change__field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 12px;
  margin-top: 10px;
  background: #f5f7fa;
  border: 1px solid #e6eaf0;
  border-radius: 12px;
}

.change__prefix {
  flex: 0 0 auto;
  font-size: 14px;
  color: #5b6675;
}

.change__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  font-size: 15px;
  color: #1f2933;
  background: transparent;
  border: 0;
  outline: none;
}

.change__code-btn {
  flex: 0 0 auto;
  padding: 0 2px;
  font-size: 13px;
  color: #3f7bf0;
  background: transparent;
  border: 0;
}

.change__code-btn:disabled {
  color: #a8b3c1;
}

.change__submit {
  margin-top: 8px;
  margin-bottom: 16px;
}
</style>
