<template>
  <div class="ride-passenger-page">
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-title">
          <h2>乘客管理</h2>
          <span>乘客档案、实名状态与账户状态查询</span>
        </div>
        <div class="filter-actions">
          <el-select v-model="query.realNameStatus" placeholder="实名状态" clearable class="status-select" @change="search">
            <el-option v-for="item in realNameOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
          </el-select>
          <el-select v-model="query.accountStatus" placeholder="账户状态" clearable class="status-select" @change="search">
            <el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="乘客号 / 手机号 / 昵称 / ID" clearable class="keyword-input" @keyup.enter="search" />
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="passengers" stripe style="width: 100%">
        <el-table-column prop="passengerId" label="乘客ID" width="90" align="center" />
        <el-table-column prop="passengerNo" label="乘客号" min-width="150" show-overflow-tooltip />
        <el-table-column label="乘客" min-width="180">
          <template #default="{ row }">
            <div class="passenger-cell">
              <el-avatar :size="28" :src="row.avatarUrl || undefined">{{ (row.nickname || '乘').slice(0, 1) }}</el-avatar>
              <div class="passenger-meta">
                <span class="nickname">{{ row.nickname || '未设置昵称' }}</span>
                <span class="mobile">{{ row.mobile || '-' }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="实名状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="realNameTagType(row.realNameStatus)" effect="light" round>{{ realNameText(row.realNameStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="accountTagType(row.accountStatus)" effect="light" round>{{ accountText(row.accountStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="90" align="right">
          <template #default="{ row }">{{ row.pointBalance ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="最近登录" width="180">
          <template #default="{ row }">
            <span v-if="row.lastLoginAt">{{ formatDateTime(row.lastLoginAt) }}</span>
            <span v-else class="muted">从未登录</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="info" link :loading="acting === row.passengerId" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无乘客数据" />
        </template>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadPassengers"
          @size-change="loadPassengers"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="乘客详情" size="460px">
      <div v-if="detail" class="detail-body">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="乘客ID">{{ detail.passengerId }}</el-descriptions-item>
          <el-descriptions-item label="乘客号">{{ detail.passengerNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detail.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.mobile || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实名状态">
            <el-tag :type="realNameTagType(detail.realNameStatus)" effect="light">{{ realNameText(detail.realNameStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="账户状态">
            <el-tag :type="accountTagType(detail.accountStatus)" effect="light">{{ accountText(detail.accountStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="积分余额">{{ detail.pointBalance ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="第三方来源">{{ detail.externalProvider || '自有账号' }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">
            {{ detail.lastLoginAt ? formatDateTime(detail.lastLoginAt) : '从未登录' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { getRidePassengerDetail, getRidePassengerList } from '@/api/ride'

  defineOptions({ name: 'tripPassenger' })

  const realNameOptions = [
    { value: 0, label: '未提交' },
    { value: 1, label: '审核中' },
    { value: 2, label: '已通过' },
    { value: 3, label: '已驳回' }
  ]
  const accountOptions = [
    { value: 0, label: '已冻结' },
    { value: 1, label: '正常' },
    { value: 2, label: '已注销' }
  ]

  const query = reactive({ page: 1, pageSize: 10, keyword: '', realNameStatus: '', accountStatus: '' })
  const passengers = ref([])
  const total = ref(0)
  const loading = ref(false)
  const acting = ref(0)
  const detailVisible = ref(false)
  const detail = ref(null)

  const realNameText = (value) => realNameOptions.find((item) => item.value === Number(value))?.label || `未知(${value})`
  const accountText = (value) => accountOptions.find((item) => item.value === Number(value))?.label || `未知(${value})`
  const realNameTagType = (value) => {
    if (Number(value) === 2) return 'success'
    if (Number(value) === 1) return 'warning'
    if (Number(value) === 3) return 'danger'
    return 'info'
  }
  const accountTagType = (value) => {
    if (Number(value) === 1) return 'success'
    if (Number(value) === 0) return 'danger'
    return 'info'
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const pad = (num) => String(num).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const loadPassengers = async () => {
    loading.value = true
    try {
      const res = await getRidePassengerList({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword || undefined,
        realNameStatus: query.realNameStatus === '' ? undefined : query.realNameStatus,
        accountStatus: query.accountStatus === '' ? undefined : query.accountStatus
      })
      passengers.value = res.data.items || []
      total.value = res.data.total || 0
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    query.page = 1
    loadPassengers()
  }

  const resetQuery = () => {
    query.page = 1
    query.keyword = ''
    query.realNameStatus = ''
    query.accountStatus = ''
    loadPassengers()
  }

  const openDetail = async (row) => {
    acting.value = row.passengerId
    try {
      const res = await getRidePassengerDetail({ passengerId: row.passengerId })
      detail.value = res.data.passenger
      detailVisible.value = true
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      acting.value = 0
    }
  }

  onMounted(loadPassengers)
</script>

<style scoped>
  .ride-passenger-page {
    padding: 16px;
  }
  .filter-card {
    margin-bottom: 12px;
  }
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }
  .filter-title h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  .filter-title span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .filter-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .status-select {
    width: 130px;
  }
  .keyword-input {
    width: 220px;
  }
  .passenger-cell {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .passenger-meta {
    display: flex;
    flex-direction: column;
    line-height: 18px;
  }
  .nickname {
    font-weight: 500;
  }
  .mobile {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .muted {
    color: var(--el-text-color-placeholder);
  }
  .pagination-bar {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
