<template>
  <div class="m-page account">
    <MHeader title="账号管理" theme="solid" />

    <div class="m-body">
      <div class="account__card">
        <div class="account__name">{{ passenger.mobile || '未登录' }}</div>
        <div class="account__sub">
          <MIcon name="shield" :size="14" />
          账号状态：{{ accountStatusText }}
        </div>
        <div class="account__score">
          <span class="account__score-num">{{ securityScore }}</span>
          <div class="account__score-info">
            <div class="account__score-title">账号安全状况</div>
            <div class="account__score-desc">{{ securityDesc }}</div>
          </div>
        </div>
      </div>

      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="openNickname">
          <span class="m-cell__label">用户名</span>
          <span class="m-cell__value">{{ passenger.nickname || '未设置' }}</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/mobile-change')">
          <span class="m-cell__label">绑定手机</span>
          <span class="m-cell__value">{{ passenger.mobile || '—' }}</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/real-name')">
          <span class="m-cell__label">实名认证</span>
          <span class="m-cell__value">{{ realNameText }}</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="go('/m/preferences')">
          <span class="m-cell__label">账号保护</span>
          <span class="m-cell__value">通知与隐私偏好</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/addresses')">
          <span class="m-cell__label">常用地址</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/notifications')">
          <span class="m-cell__label">消息中心</span>
          <span v-if="unreadCount" class="m-cell__value">{{ unreadCount }} 条未读</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <div class="m-cell-group">
        <button class="m-cell" type="button" @click="go('/m/login-devices')">
          <span class="m-cell__label">登录设备</span>
          <span class="m-cell__value">设备型号与登录地址</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
        <button class="m-cell" type="button" @click="go('/m/login-records')">
          <span class="m-cell__label">登录记录</span>
          <span class="m-cell__value">登录时间与地点</span>
          <MIcon name="chevron-right" :size="16" class="m-cell__arrow" />
        </button>
      </div>

      <button class="m-btn m-btn--ghost account__logout" type="button" @click="logout">
        退出登录
      </button>
    </div>

    <MPopup v-model="nicknamePopup" title="修改用户名">
      <div class="account__form">
        <input
          v-model="nicknameInput"
          class="account__input"
          type="text"
          maxlength="20"
          placeholder="请输入用户名（2-20 个字符）"
        />
        <p class="account__hint">支持中英文、数字、下划线、短横线与空格；用户名仅用于展示，不影响登录手机号。</p>
        <button class="m-btn" type="button" :disabled="savingNickname" @click="saveNickname">
          {{ savingNickname ? '保存中…' : '保存' }}
        </button>
      </div>
    </MPopup>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MHeader from '@/mobile/components/MHeader.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import MPopup from '@/mobile/components/MPopup.vue'
import { getProfile, updateNickname } from '@/mobile/api/passenger'
import { clearSession, session, setProfile } from '@/mobile/store/session'
import { mConfirm, showToast } from '@/mobile/utils/ui'

const ACCOUNT_STATUS_TEXT = { 0: '已冻结', 1: '正常', 2: '已注销' }
const REAL_NAME_TEXT = { 0: '未认证', 1: '认证中', 2: '已认证', 3: '认证驳回' }

const router = useRouter()
const profile = ref(session.profile || null)

// 用户名修改弹窗状态
const nicknamePopup = ref(false)
const nicknameInput = ref('')
const savingNickname = ref(false)

const passenger = computed(() => profile.value?.passenger || {})
const unreadCount = computed(() => Number(profile.value?.unread_notification_count || 0))

const accountStatusText = computed(() => ACCOUNT_STATUS_TEXT[Number(passenger.value.account_status ?? 1)] || '正常')
const realNameText = computed(() => REAL_NAME_TEXT[Number(passenger.value.real_name_status || 0)] || '未认证')

// 安全分：当前模块只暴露实名状态，按实名情况给出提示性分值（非风控真实评分）
const securityScore = computed(() => (Number(passenger.value.real_name_status) === 2 ? 90 : 60))
const securityDesc = computed(() =>
  Number(passenger.value.real_name_status) === 2
    ? '已完成实名认证，账号安全状况较好'
    : '完成实名认证可进一步提升账号安全等级'
)

function tip(message) {
  showToast(message)
}

function go(path) {
  router.push(path)
}

async function logout() {
  const ok = await mConfirm({ title: '退出登录', message: '退出后需要重新验证手机号才能登录', okText: '退出' })
  if (!ok) return
  clearSession()
  router.replace('/m/login')
}

// 打开用户名弹窗，默认带入当前昵称
function openNickname() {
  nicknameInput.value = passenger.value.nickname || ''
  nicknamePopup.value = true
}

// 保存用户名：前端先做长度校验，后端还会做字符与长度校验
async function saveNickname() {
  const value = nicknameInput.value.trim()
  if (value.length < 2 || value.length > 20) {
    showToast('用户名需为 2-20 个字符')
    return
  }
  if (savingNickname.value) return
  savingNickname.value = true
  try {
    const data = await updateNickname(value)
    // 先用接口返回的摘要更新界面，再拉一次聚合数据保证其他指标同步
    const nextProfile = { ...(profile.value || {}), passenger: data.passenger }
    profile.value = nextProfile
    setProfile(nextProfile)
    nicknamePopup.value = false
    showToast('用户名已更新')
    const latest = await getProfile().catch(() => null)
    if (latest) {
      profile.value = latest
      setProfile(latest)
    }
  } finally {
    savingNickname.value = false
  }
}

onMounted(async () => {
  try {
    const data = await getProfile()
    profile.value = data
    setProfile(data)
  } catch (e) {
    // 保留缓存
  }
})
</script>

<style scoped>
.account {
  background: #f5f7fa;
}

.account__card {
  padding: 18px;
  color: #fff;
  background: linear-gradient(140deg, #4c8ef7 0%, #3f7bf0 55%, #5aa5ff 100%);
  border-radius: 18px;
  box-shadow: 0 10px 22px rgba(63, 123, 240, 0.28);
}

.account__name {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
}

.account__sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.86;
}

.account__score {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.24);
}

.account__score-num {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.account__score-title {
  font-size: 13px;
  font-weight: 500;
}

.account__score-desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.5;
  opacity: 0.82;
}

.account__logout {
  margin-top: 24px;
}

.account__form {
  padding: 4px 16px 0;
}

.account__input {
  width: 100%;
  height: 46px;
  padding: 0 14px;
  font-size: 15px;
  color: #1f2933;
  background: #f5f7fa;
  border: 1px solid #e6eaf0;
  border-radius: 12px;
  outline: none;
}

.account__input:focus {
  border-color: #4c8ef7;
  background: #fff;
}

.account__hint {
  margin: 10px 2px 18px;
  font-size: 12px;
  line-height: 1.6;
  color: #8a94a6;
}
</style>
