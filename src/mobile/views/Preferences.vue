<template>
  <div class="m-page preferences">
    <MHeader title="账号保护" theme="solid" />

    <div class="m-body">
      <p class="preferences__intro">
        通知与行程隐私偏好保存在乘客账号中（passengers.preferences），修改后立即生效。
      </p>

      <div class="m-cell-group">
        <div v-for="item in items" :key="item.key" class="preferences__row">
          <div class="preferences__text">
            <div class="preferences__title">{{ item.label }}</div>
            <div class="preferences__desc">{{ item.desc }}</div>
          </div>
          <button
            class="m-switch"
            :class="{ 'm-switch--on': prefs[item.key] }"
            type="button"
            :disabled="item.locked || saving === item.key"
            :aria-pressed="prefs[item.key]"
            @click="toggle(item)"
          />
        </div>
      </div>

      <p class="preferences__note">安全类通知涉及账号与资金风险，不支持关闭。</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import { getProfile, updateSettings } from '@/mobile/api/passenger'
import { session, setProfile } from '@/mobile/store/session'
import { showToast } from '@/mobile/utils/ui'

const items = [
  {
    key: 'order_notification_enabled',
    label: '订单状态通知',
    desc: '行程接单、到达、完成等关键节点提醒'
  },
  {
    key: 'promotion_notification_enabled',
    label: '活动与优惠通知',
    desc: '优惠券到账、限时活动等营销信息'
  },
  {
    key: 'security_notification_enabled',
    label: '安全通知',
    desc: '异地登录、账号风险等安全提醒',
    locked: true
  },
  {
    key: 'trip_share_default_enabled',
    label: '行程默认分享',
    desc: '下单后默认开启行程分享给紧急联系人'
  }
]

// 后端 proto3 optional 字段未设置时不出现在 JSON 中，这里统一兜底为 false
const prefs = reactive({
  order_notification_enabled: false,
  promotion_notification_enabled: false,
  security_notification_enabled: true,
  trip_share_default_enabled: false
})

const saving = ref('')

function applyPreferences(source) {
  if (!source) return
  Object.keys(prefs).forEach((key) => {
    if (source[key] !== undefined && source[key] !== null) prefs[key] = Boolean(source[key])
  })
}

async function toggle(item) {
  if (item.locked || saving.value) {
    if (item.locked) showToast('安全通知不支持关闭')
    return
  }
  const key = item.key
  const next = !prefs[key]
  const previous = prefs[key]
  // 先乐观更新，失败再回滚，避免开关出现迟滞
  prefs[key] = next
  saving.value = key
  try {
    const data = await updateSettings({ [key]: next })
    applyPreferences(data.preferences)
    if (session.profile) {
      const merged = { ...session.profile }
      merged.passenger = { ...(session.profile.passenger || {}), preferences: data.preferences }
      setProfile(merged)
    }
    showToast(next ? '已开启' : '已关闭')
  } catch (e) {
    prefs[key] = previous
  } finally {
    saving.value = ''
  }
}

onMounted(async () => {
  // 先用缓存渲染，再以接口结果校正
  applyPreferences(session.profile?.passenger?.preferences)
  try {
    const data = await getProfile()
    applyPreferences(data.passenger?.preferences)
    setProfile(data)
  } catch (e) {
    // 保持缓存值
  }
})
</script>

<style scoped>
.preferences {
  background: #f5f7fa;
}

.preferences__intro {
  margin: 4px 4px 14px;
  font-size: 12px;
  line-height: 1.7;
  color: #93a1ab;
}

.preferences__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
}

.preferences__row + .preferences__row {
  border-top: 1px solid #f0f3f5;
}

.preferences__text {
  flex: 1;
  min-width: 0;
}

.preferences__title {
  font-size: 15px;
}

.preferences__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: #93a1ab;
}

.preferences__note {
  margin: 14px 4px 0;
  font-size: 12px;
  color: #b6c0ca;
}
</style>
