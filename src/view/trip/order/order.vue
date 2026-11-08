<template>
  <div class="ride-order-page">
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <div class="filter-title">
          <h2>网约车订单</h2>
          <span>派单、接驾、行程推进与异常关闭</span>
        </div>
        <div class="filter-actions">
          <el-select v-model="query.status" placeholder="全部状态" clearable class="status-select" @change="loadOrders">
            <el-option v-for="item in statusOptions" :key="item.value" :label="`${item.value} ${item.label}`" :value="String(item.value)" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="订单号 / 乘客ID" clearable class="keyword-input" @keyup.enter="loadOrders" />
          <el-button type="primary" :loading="loading" @click="loadOrders">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="orders" stripe style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" min-width="200" show-overflow-tooltip />
        <el-table-column prop="passengerId" label="乘客ID" width="90" align="center" />
        <el-table-column label="行程" min-width="240">
          <template #default="{ row }">
            <div class="route-cell">
              <span class="route-dot start" />
              <span class="route-text">{{ row.originName || '-' }}</span>
            </div>
            <div class="route-cell">
              <span class="route-dot end" />
              <span class="route-text">{{ row.destinationName || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">¥{{ Number(row.payableAmount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="车辆" width="120">
          <template #default="{ row }">
            <span v-if="row.vehiclePlate">{{ row.vehiclePlate }}</span>
            <span v-else class="muted">未派车</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="140" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.statusValue)" effect="light" round>{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="[0, 1].includes(row.statusValue)" type="primary" link :loading="acting === row.orderId" @click="dispatch(row)">
              派车
            </el-button>
            <el-button v-if="row.statusValue === 2" type="primary" link :loading="acting === row.orderId" @click="advance(row, 'MARK_ARRIVED')">
              车辆到达
            </el-button>
            <el-button v-if="row.statusValue === 3" type="primary" link :loading="acting === row.orderId" @click="advance(row, 'START_TRIP')">
              开始行程
            </el-button>
            <el-button v-if="row.statusValue === 4" type="success" link :loading="acting === row.orderId" @click="advance(row, 'COMPLETE_TRIP')">
              完成行程
            </el-button>
            <el-button v-if="row.statusValue < 5" type="danger" link :loading="acting === row.orderId" @click="advance(row, 'CLOSE_EXCEPTION')">
              异常关闭
            </el-button>
            <el-button type="info" link @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadOrders"
          @size-change="loadOrders"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="订单详情" size="520px">
      <div v-if="detail" class="detail-body">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单号">{{ detail.order?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(detail.order?.statusValue)" effect="light">{{ detail.order?.statusText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="乘客ID">{{ detail.order?.passengerId }}</el-descriptions-item>
          <el-descriptions-item label="行程">
            {{ detail.order?.originName || '-' }} → {{ detail.order?.destinationName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="车型">{{ detail.order?.serviceType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="车辆">
            {{ detail.order?.vehiclePlate || '未派车' }} {{ detail.order?.vehicleModel || '' }}
          </el-descriptions-item>
          <el-descriptions-item label="应付金额">¥{{ Number(detail.order?.payableAmount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="派单摘要">{{ dispatchText }}</el-descriptions-item>
          <el-descriptions-item label="上车核验">{{ boardingText }}</el-descriptions-item>
          <el-descriptions-item label="行程进度">{{ progressText }}</el-descriptions-item>
          <el-descriptions-item label="安全事件">{{ detail.safetyEvents ?? 0 }} 条</el-descriptions-item>
        </el-descriptions>
        <el-alert type="info" :closable="false" show-icon class="detail-tip" title="派车由后台调用订单服务完成，会写入派单记录并把车辆绑定到订单。" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
  import { computed, onMounted, reactive, ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { advanceRideOrder, dispatchRideOrder, getRideOrderDetail, getRideOrderList } from '@/api/ride'

  defineOptions({ name: 'tripOrder' })

  const statusOptions = [
    { value: 0, label: '待派车' },
    { value: 1, label: '派车中' },
    { value: 2, label: '接驾中' },
    { value: 3, label: '待上车' },
    { value: 4, label: '行程中' },
    { value: 5, label: '已完成' },
    { value: 6, label: '已取消' },
    { value: 7, label: '异常关闭' }
  ]

  const query = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })
  const orders = ref([])
  const total = ref(0)
  const loading = ref(false)
  const acting = ref('')
  const detailVisible = ref(false)
  const detail = ref(null)

  const statusTagType = (value) => {
    if ([5].includes(value)) return 'success'
    if ([1, 3].includes(value)) return 'warning'
    if ([2, 4].includes(value)) return 'primary'
    if ([7].includes(value)) return 'danger'
    return 'info'
  }

  const dispatchText = computed(() => {
    const item = detail.value?.order?.dispatch
    if (!item) return '暂无派单记录'
    return `${item.strategy || '-'} · ${item.status || '-'} · 第 ${item.attemptCount || 1} 次 · ETA ${Math.round((item.pickupEtaSeconds || 0) / 60)} 分钟`
  })

  const boardingText = computed(() => {
    const item = detail.value?.order?.boarding
    if (!item) return '暂无核验记录'
    return `${item.method || '-'} · ${item.status || '-'} · ${item.verifiedAt || '-'}`
  })

  const progressText = computed(() => {
    const item = detail.value?.order?.tripProgress
    if (!item) return '-'
    return `进度 ${item.progressPercent || 0}% · 剩余 ${Math.round((item.remainingDistanceMeters || 0) / 100) / 10} km · ${item.speedKmh || 0} km/h`
  })

  const loadOrders = async () => {
    loading.value = true
    try {
      const res = await getRideOrderList({
        page: query.page,
        pageSize: query.pageSize,
        status: query.status === '' ? undefined : query.status,
        keyword: query.keyword || undefined
      })
      orders.value = res.data.items || []
      total.value = res.data.total || 0
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      loading.value = false
    }
  }

  const resetQuery = () => {
    query.page = 1
    query.status = ''
    query.keyword = ''
    loadOrders()
  }

  const dispatch = async (row) => {
    await ElMessageBox.confirm(
      `确认为订单 ${row.orderNo} 派车？系统会自动挑选区域内可用车辆并完成车辆确认。`,
      '后台派车',
      { type: 'warning', confirmButtonText: '立即派车', cancelButtonText: '取消' }
    )
    acting.value = row.orderId
    try {
      const res = await dispatchRideOrder({ orderId: row.orderId })
      ElMessage.success(`已派车：${res.data?.vehicle?.plateNo || '已分配车辆'}`)
      loadOrders()
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      acting.value = ''
    }
  }

  const advance = async (row, commandType) => {
    const actionText = { MARK_ARRIVED: '车辆到达', START_TRIP: '开始行程', COMPLETE_TRIP: '完成行程', CLOSE_EXCEPTION: '异常关闭' }[commandType]
    await ElMessageBox.confirm(`确认对订单 ${row.orderNo} 执行「${actionText}」？`, '状态推进', { type: 'warning' })
    acting.value = row.orderId
    try {
      await advanceRideOrder({ orderId: row.orderId, commandType })
      ElMessage.success(`${actionText}成功`)
      loadOrders()
    } catch (error) {
      ElMessage.error(error.message)
    } finally {
      acting.value = ''
    }
  }

  const openDetail = async (row) => {
    try {
      const res = await getRideOrderDetail({ orderId: row.orderId })
      detail.value = res.data
      detailVisible.value = true
    } catch (error) {
      ElMessage.error(error.message)
    }
  }

  onMounted(loadOrders)
</script>

<style scoped>
  .ride-order-page {
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
    width: 150px;
  }
  .keyword-input {
    width: 200px;
  }
  .route-cell {
    display: flex;
    gap: 6px;
    align-items: center;
    line-height: 20px;
  }
  .route-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .route-dot.start {
    background: #3b82f6;
  }
  .route-dot.end {
    background: #ef4444;
  }
  .route-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .muted {
    color: var(--el-text-color-placeholder);
  }
  .pagination-bar {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }
  .detail-tip {
    margin-top: 16px;
  }
</style>
