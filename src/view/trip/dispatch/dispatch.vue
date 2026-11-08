<template>
  <div class="ride-dispatch-page">
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-title">
          <h2>派单记录</h2>
          <span>派单流水、车辆匹配结果与失败原因追溯</span>
        </div>
        <div class="filter-actions">
          <el-select v-model="query.status" placeholder="全部状态" clearable class="status-select" @change="search">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="派单号 / 订单号 / 车牌" clearable class="keyword-input" @keyup.enter="search" />
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="records" stripe style="width: 100%">
        <el-table-column prop="dispatchNo" label="派单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="orderNo" label="订单号" min-width="200" show-overflow-tooltip />
        <el-table-column label="车辆" width="130">
          <template #default="{ row }">
            <span v-if="row.plateNo">{{ row.plateNo }}</span>
            <span v-else class="muted">未匹配</span>
          </template>
        </el-table-column>
        <el-table-column label="调度策略" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.dispatchStrategy || '-' }}</template>
        </el-table-column>
        <el-table-column label="评分" width="90" align="right">
          <template #default="{ row }">
            {{ row.candidateScore === null || row.candidateScore === undefined ? '-' : Number(row.candidateScore).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="接驾距离" width="110" align="right">
          <template #default="{ row }">
            {{ row.estimatedPickupDistanceKm === null || row.estimatedPickupDistanceKm === undefined ? '-' : `${Number(row.estimatedPickupDistanceKm).toFixed(1)} km` }}
          </template>
        </el-table-column>
        <el-table-column label="预计到达" width="100" align="right">
          <template #default="{ row }">
            {{ row.estimatedArrivalMin === null || row.estimatedArrivalMin === undefined ? '-' : `${row.estimatedArrivalMin} 分` }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" round>{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.failureReason" class="failure">{{ row.failureReason }}</span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="派单时间" width="180">
          <template #default="{ row }">
            <span v-if="row.dispatchedAt">{{ formatDateTime(row.dispatchedAt) }}</span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="响应时间" width="180">
          <template #default="{ row }">
            <span v-if="row.respondedAt">{{ formatDateTime(row.respondedAt) }}</span>
            <span v-else class="muted">待响应</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无派单记录，可在订单管理中对待派车订单执行派车" />
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
          @current-change="loadRecords"
          @size-change="loadRecords"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { getRideDispatchList } from '@/api/ride'

  defineOptions({ name: 'tripDispatch' })

  const statusOptions = [
    { value: 0, label: '已创建' },
    { value: 1, label: '已下发' },
    { value: 2, label: '车辆确认' },
    { value: 3, label: '失败' },
    { value: 4, label: '超时' }
  ]

  const query = reactive({ page: 1, pageSize: 10, keyword: '', status: '' })
  const records = ref([])
  const total = ref(0)
  const loading = ref(false)

  const statusText = (value) => statusOptions.find((item) => item.value === Number(value))?.label || `未知(${value})`
  const statusTagType = (value) => {
    if (Number(value) === 2) return 'success'
    if (Number(value) === 1) return 'primary'
    if ([3, 4].includes(Number(value))) return 'danger'
    return 'info'
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const pad = (num) => String(num).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const loadRecords = async () => {
    loading.value = true
    try {
      const res = await getRideDispatchList({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword || undefined,
        status: query.status === '' ? undefined : query.status
      })
      records.value = res.data.items || []
      total.value = res.data.total || 0
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    query.page = 1
    loadRecords()
  }

  const resetQuery = () => {
    query.page = 1
    query.keyword = ''
    query.status = ''
    loadRecords()
  }

  onMounted(loadRecords)
</script>

<style scoped>
  .ride-dispatch-page {
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
    width: 140px;
  }
  .keyword-input {
    width: 240px;
  }
  .failure {
    color: var(--el-color-danger);
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
