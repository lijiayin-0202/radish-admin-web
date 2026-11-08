<template>
  <div class="ride-vehicle-page">
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-title">
          <h2>车辆管理</h2>
          <span>车队档案、运营状态与实时电量</span>
        </div>
        <div class="filter-actions">
          <el-select v-model="query.operationStatus" placeholder="运营状态" clearable class="status-select" @change="search">
            <el-option v-for="item in operationOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
          </el-select>
          <el-select v-model="query.onlineStatus" placeholder="在线状态" clearable class="status-select" @change="search">
            <el-option v-for="item in onlineOptions" :key="item.value" :label="item.label" :value="String(item.value)" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="车牌 / 编号 / VIN / 车型" clearable class="keyword-input" @keyup.enter="search" />
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="vehicles" stripe style="width: 100%">
        <el-table-column prop="vehicleId" label="车辆ID" width="80" align="center" />
        <el-table-column label="车牌号" width="130">
          <template #default="{ row }">
            <span class="plate">{{ row.plateNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="vehicleNo" label="车辆编号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="model" label="车型" min-width="150" show-overflow-tooltip />
        <el-table-column prop="serviceAreaName" label="运营区域" min-width="140" show-overflow-tooltip />
        <el-table-column label="电量" width="140">
          <template #default="{ row }">
            <div v-if="row.batteryPercent !== null && row.batteryPercent !== undefined" class="battery-cell">
              <el-progress :percentage="Number(row.batteryPercent)" :stroke-width="6" :color="batteryColor(row.batteryPercent)" :show-text="false" />
              <span class="battery-text">{{ Number(row.batteryPercent).toFixed(0) }}%</span>
            </div>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="运营状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="operationTagType(row.operationStatus)" effect="light" round>{{ operationText(row.operationStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.onlineStatus) === 1 ? 'success' : 'info'" effect="plain" round>
              {{ Number(row.onlineStatus) === 1 ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后上报" width="180">
          <template #default="{ row }">
            <span v-if="row.lastReportedAt">{{ formatDateTime(row.lastReportedAt) }}</span>
            <span v-else class="muted">无上报</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="info" link :loading="acting === row.vehicleId" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无车辆数据" />
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
          @current-change="loadVehicles"
          @size-change="loadVehicles"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="车辆详情" size="480px">
      <div v-if="detail" class="detail-body">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="车辆ID">{{ detail.vehicleId }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ detail.plateNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车辆编号">{{ detail.vehicleNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="VIN">{{ detail.vin || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车型">{{ detail.model || '-' }}</el-descriptions-item>
          <el-descriptions-item label="乘客座位数">{{ detail.seatCount ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="运营区域">{{ detail.serviceAreaName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运营状态">
            <el-tag :type="operationTagType(detail.operationStatus)" effect="light">{{ operationText(detail.operationStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="在线状态">
            {{ Number(detail.onlineStatus) === 1 ? '在线' : '离线' }}
          </el-descriptions-item>
          <el-descriptions-item label="剩余电量">
            {{ detail.batteryPercent === null || detail.batteryPercent === undefined ? '-' : `${Number(detail.batteryPercent).toFixed(0)}%` }}
          </el-descriptions-item>
          <el-descriptions-item label="车端版本">{{ detail.softwareVersion || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后上报">
            {{ detail.lastReportedAt ? formatDateTime(detail.lastReportedAt) : '无上报记录' }}
          </el-descriptions-item>
          <el-descriptions-item label="建档时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
  import { onMounted, reactive, ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { getRideVehicleDetail, getRideVehicleList } from '@/api/ride'

  defineOptions({ name: 'tripVehicle' })

  const operationOptions = [
    { value: 0, label: '停运' },
    { value: 1, label: '空闲' },
    { value: 2, label: '接驾中' },
    { value: 3, label: '待上车' },
    { value: 4, label: '行程中' },
    { value: 5, label: '维护' }
  ]
  const onlineOptions = [
    { value: 0, label: '离线' },
    { value: 1, label: '在线' }
  ]

  const query = reactive({ page: 1, pageSize: 10, keyword: '', operationStatus: '', onlineStatus: '' })
  const vehicles = ref([])
  const total = ref(0)
  const loading = ref(false)
  const acting = ref(0)
  const detailVisible = ref(false)
  const detail = ref(null)

  const operationText = (value) => operationOptions.find((item) => item.value === Number(value))?.label || `未知(${value})`
  const operationTagType = (value) => {
    if (Number(value) === 1) return 'success'
    if ([2, 3, 4].includes(Number(value))) return 'primary'
    if (Number(value) === 5) return 'warning'
    return 'info'
  }
  const batteryColor = (value) => {
    const percent = Number(value)
    if (percent <= 20) return '#f56c6c'
    if (percent <= 50) return '#e6a23c'
    return '#67c23a'
  }

  const formatDateTime = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const pad = (num) => String(num).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const loadVehicles = async () => {
    loading.value = true
    try {
      const res = await getRideVehicleList({
        page: query.page,
        pageSize: query.pageSize,
        keyword: query.keyword || undefined,
        operationStatus: query.operationStatus === '' ? undefined : query.operationStatus,
        onlineStatus: query.onlineStatus === '' ? undefined : query.onlineStatus
      })
      vehicles.value = res.data.items || []
      total.value = res.data.total || 0
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }

  const search = () => {
    query.page = 1
    loadVehicles()
  }

  const resetQuery = () => {
    query.page = 1
    query.keyword = ''
    query.operationStatus = ''
    query.onlineStatus = ''
    loadVehicles()
  }

  const openDetail = async (row) => {
    acting.value = row.vehicleId
    try {
      const res = await getRideVehicleDetail({ vehicleId: row.vehicleId })
      detail.value = res.data.vehicle
      detailVisible.value = true
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      acting.value = 0
    }
  }

  onMounted(loadVehicles)
</script>

<style scoped>
  .ride-vehicle-page {
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
  .plate {
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .battery-cell {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .battery-cell :deep(.el-progress) {
    flex: 1;
  }
  .battery-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 34px;
    text-align: right;
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
