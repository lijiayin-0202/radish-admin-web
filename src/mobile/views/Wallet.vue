<template>
  <div class="m-page wallet">
    <MHeader title="现金奖励" theme="solid" />

    <div class="m-body">
      <div class="wallet__card">
        <div class="wallet__top">
          <div>
            <div class="wallet__label">可提现金额（有效期 60 天）</div>
            <div class="wallet__amount">
              {{ formatMoney(walletBalance) }}<span class="wallet__unit">元</span>
            </div>
          </div>
          <button class="wallet__withdraw" type="button" @click="onWithdraw">提现</button>
        </div>
        <div class="wallet__rule">
          <div>
            <div class="wallet__rule-label">奖励金额</div>
            <div class="wallet__rule-value">{{ formatMoney(walletBalance) }} 元</div>
          </div>
          <button class="wallet__rule-btn" type="button" @click="tip('奖励规则由运营后台配置，暂未开放')">
            <MIcon name="info" :size="13" /> 规则
          </button>
        </div>
      </div>

      <div class="m-section-title">现金奖励流水</div>

      <div class="wallet__panel">
        <div class="wallet__tabs">
          <button
            v-for="item in flowTabs"
            :key="item"
            class="m-tab"
            :class="{ 'm-tab--active': activeFlow === item }"
            type="button"
            @click="activeFlow = item"
          >
            {{ item }}
          </button>
        </div>
        <MEmpty text="暂无流水信息" hint="奖金的收支明细会在提现模块上线后展示" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MHeader from '@/mobile/components/MHeader.vue'
import MEmpty from '@/mobile/components/MEmpty.vue'
import MIcon from '@/mobile/components/MIcon.vue'
import { getProfile } from '@/mobile/api/passenger'
import { session, setProfile } from '@/mobile/store/session'
import { formatMoney, showToast } from '@/mobile/utils/ui'

const flowTabs = ['全部', '审核中', '可提现']
const activeFlow = ref('全部')
const walletBalance = ref(Number(session.profile?.wallet_balance || 0))

function tip(message) {
  showToast(message)
}

function onWithdraw() {
  if (walletBalance.value <= 0) {
    showToast('暂无可提现金额')
    return
  }
  showToast('提现功能暂未开放')
}

onMounted(async () => {
  try {
    // 钱包余额由个人中心聚合接口一并返回（GET /passenger/profile 的 wallet_balance）
    const data = await getProfile()
    walletBalance.value = Number(data.wallet_balance || 0)
    setProfile(data)
  } catch (e) {
    // 保留缓存值
  }
})
</script>

<style scoped>
.wallet {
  background: #f5f7fa;
}

.wallet__card {
  overflow: hidden;
  background: linear-gradient(120deg, #ffe6b0 0%, #ffd68a 55%, #ffc670 100%);
  border-radius: 18px;
  box-shadow: 0 10px 24px rgba(226, 165, 60, 0.22);
}

.wallet__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 18px 16px;
}

.wallet__label {
  font-size: 12px;
  color: #8a6a2f;
}

.wallet__amount {
  margin-top: 6px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.1;
  color: #3b2f1c;
}

.wallet__unit {
  margin-left: 4px;
  font-size: 14px;
  font-weight: 400;
}

.wallet__withdraw {
  padding: 7px 22px;
  font-size: 14px;
  color: #8a6a2f;
  background: rgba(255, 255, 255, 0.6);
  border: 0;
  border-radius: 18px;
}

.wallet__rule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.32);
}

.wallet__rule-label {
  font-size: 12px;
  color: #8a6a2f;
}

.wallet__rule-value {
  margin-top: 2px;
  font-size: 15px;
  color: #3b2f1c;
}

.wallet__rule-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8a6a2f;
  background: transparent;
  border: 0;
}

.wallet__panel {
  overflow: hidden;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(31, 41, 51, 0.04);
}

.wallet__tabs {
  display: flex;
  gap: 26px;
  padding: 4px 16px 0;
  border-bottom: 1px solid #f0f3f5;
}
</style>
