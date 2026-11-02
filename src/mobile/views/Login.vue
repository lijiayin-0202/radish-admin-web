<template>
  <div class="m-page login">
    <div class="login__card">
      <h1 class="login__title">登录萝卜快跑，精彩永相伴</h1>
      <p class="login__subtitle">未注册的手机号验证后将自动创建账号</p>

      <div class="login__form">
        <div class="login__field">
          <span class="login__prefix">+86</span>
          <input
            v-model="form.mobile"
            class="login__input"
            type="tel"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入手机号"
            autocomplete="tel"
          />
          <button
            v-if="form.mobile"
            class="login__clear"
            type="button"
            aria-label="清空"
            @click="form.mobile = ''"
          >
            <MIcon name="close" :size="14" :stroke-width="2" />
          </button>
        </div>

        <div class="login__field">
          <input
            v-model="form.smsCode"
            class="login__input"
            type="tel"
            inputmode="numeric"
            maxlength="6"
            placeholder="请输入 6 位验证码"
            autocomplete="one-time-code"
          />
          <button
            class="login__code-btn"
            type="button"
            :disabled="!canSendCode || sending"
            @click="handleSendCode"
          >
            {{ countdown > 0 ? `${countdown}s 后重新发送` : sending ? '发送中…' : '获取验证码' }}
          </button>
        </div>
      </div>

      <button class="m-btn login__submit" type="button" :disabled="!canSubmit || submitting" @click="handleLogin">
        {{ submitting ? '登录中…' : '登录' }}
      </button>

      <label class="login__agree">
        <span class="login__checkbox" :class="{ 'is-checked': agreed }" @click="agreed = !agreed">
          <MIcon v-if="agreed" name="check" :size="12" :stroke-width="3" />
        </span>
        <span class="login__agree-text">
          已阅读并同意<span class="login__link" @click.stop>《用户协议》</span>与<span
            class="login__link"
            @click.stop
            >《隐私政策》</span
          >
        </span>
      </label>

      <p v-if="maskedMobile" class="login__sent">验证码已发送至 {{ maskedMobile }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MIcon from '@/mobile/components/MIcon.vue'
import { getProfile, mobileLogin, sendLoginSmsCode } from '@/mobile/api/passenger'
import { getDeviceId, setSession, setProfile } from '@/mobile/store/session'
import { showToast } from '@/mobile/utils/ui'

const MOBILE_PATTERN = /^1[3-9]\d{9}$/

const router = useRouter()
const route = useRoute()

const form = reactive({ mobile: '', smsCode: '' })
const agreed = ref(true)
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
const verificationId = ref('')
const maskedMobile = ref('')

let timer = null

const canSendCode = computed(() => MOBILE_PATTERN.test(form.mobile.trim()))
const canSubmit = computed(() => canSendCode.value && /^\d{6}$/.test(form.smsCode.trim()) && agreed.value)

function startCountdown(seconds) {
  countdown.value = Math.max(1, Number(seconds) || 60)
  window.clearInterval(timer)
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

onBeforeUnmount(() => window.clearInterval(timer))

async function handleSendCode() {
  if (!canSendCode.value || sending.value) return
  sending.value = true
  try {
    // 后端返回 verification_id、有效期与重发冷却秒数，倒计时以后端为准
    const data = await sendLoginSmsCode(form.mobile.trim())
    verificationId.value = data.verification_id || ''
    maskedMobile.value = data.masked_mobile || ''
    startCountdown(data.resend_after_seconds || 60)
    showToast(`验证码已发送至 ${data.masked_mobile || form.mobile}`)
  } catch (e) {
    // 错误提示已由请求拦截器统一下发
  } finally {
    sending.value = false
  }
}

async function handleLogin() {
  if (!canSubmit.value || submitting.value) return
  if (!agreed.value) {
    showToast('请先阅读并同意用户协议')
    return
  }
  submitting.value = true
  try {
    const data = await mobileLogin({
      mobile: form.mobile.trim(),
      smsCode: form.smsCode.trim(),
      verificationId: verificationId.value,
      deviceId: getDeviceId()
    })
    setSession(data.access_token, null)
    showToast(data.is_new_user ? '注册成功，欢迎加入萝卜快跑' : '登录成功')

    // 登录后立刻拉取个人中心聚合数据，首屏不出现空态
    try {
      const profile = await getProfile()
      setProfile(profile)
    } catch (e) {
      // 聚合查询失败不影响进入个人中心，页面会自行重试
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/m/profile'
    router.replace(redirect)
  } catch (e) {
    // 错误提示已由请求拦截器统一下发
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login {
  background: linear-gradient(165deg, #a9e7d8 0%, #cbe8f7 42%, #eef7f4 72%, #f6faf8 100%);
}

.login__card {
  margin: 32px 16px 0;
  padding: 28px 20px 22px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(20, 60, 60, 0.08);
}

.login__title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #1b2a33;
}

.login__subtitle {
  margin: 8px 0 22px;
  font-size: 12px;
  color: #97a3ad;
}

.login__form {
  border-radius: 14px;
  background: #f6f8fa;
  overflow: hidden;
}

.login__field {
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 14px;
}

.login__field + .login__field {
  border-top: 1px solid #eef1f4;
}

.login__prefix {
  margin-right: 10px;
  font-size: 15px;
  color: #37424c;
}

.login__input {
  flex: 1;
  min-width: 0;
  font-size: 15px;
  color: #1f2933;
  background: transparent;
  border: 0;
  outline: none;
}

.login__input::placeholder {
  color: #b6c0ca;
}

.login__clear {
  display: flex;
  padding: 4px;
  color: #b6c0ca;
  background: transparent;
  border: 0;
}

.login__code-btn {
  flex: 0 0 auto;
  padding: 0;
  font-size: 13px;
  color: #0ea882;
  background: transparent;
  border: 0;
}

.login__code-btn[disabled] {
  color: #b6c0ca;
}

.login__submit {
  margin-top: 22px;
}

.login__agree {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
  font-size: 12px;
  line-height: 1.6;
  color: #97a3ad;
}

.login__checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  margin-top: 2px;
  flex: 0 0 auto;
  color: #fff;
  border: 1px solid #cdd6de;
  border-radius: 50%;
}

.login__checkbox.is-checked {
  background: #16c79a;
  border-color: #16c79a;
}

.login__agree-text {
  flex: 1;
}

.login__link {
  color: #3d7bd9;
}

.login__sent {
  margin: 12px 0 0;
  font-size: 12px;
  color: #0ea882;
  text-align: center;
}

</style>
