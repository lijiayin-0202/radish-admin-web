<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="订单号/上下车点" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchInfo.orderStatus" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="(t, i) in statusList" :key="i" :label="t" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="true" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="订单号" prop="orderNo" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.orderStatus)">{{ statusList[scope.row.orderStatus] || scope.row.orderStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上车点" prop="pickupName" min-width="150" show-overflow-tooltip />
        <el-table-column label="下车点" prop="destinationName" min-width="150" show-overflow-tooltip />
        <el-table-column label="预估金额" prop="estimatedAmount" width="100" />
        <el-table-column label="应付金额" prop="payableAmount" width="100" />
        <el-table-column label="创建时间" prop="createdAt" width="170" />
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openLogs(scope.row)">状态日志</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
    <el-drawer v-model="logsVisible" title="订单状态流转日志" :size="appStore.drawerSize">
      <el-timeline>
        <el-timeline-item v-for="l in logs" :key="l.ID" :timestamp="l.createdAt">
          {{ statusList[l.fromStatus] || l.fromStatus }} → {{ statusList[l.toStatus] || l.toStatus }}
          <span v-if="l.remark">（{{ l.remark }}）</span>
          <el-tag size="small" style="margin-left: 6px">{{ l.operatorType }}</el-tag>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!logs.length" description="暂无状态日志" />
    </el-drawer>
  </div>
</template>

<script setup>
  import { useAppStore } from '@/pinia'
  const appStore = useAppStore()
import { ref } from 'vue'
import { getOrderList, getOrderStatusLogs } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const statusList = ['待派车', '派车中', '接驾中', '待上车', '行程中', '已完成', '已取消', '异常关闭']

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '', orderStatus: null })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }
const logsVisible = ref(false)
const logs = ref([])

const statusTag = (v) => ({ 5: 'success', 6: 'info', 7: 'danger' }[v] || 'primary')

const getTableData = async () => {
  const res = await getOrderList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
const resetSearch = () => { searchInfo.value = { page: 1, pageSize: 10, keyword: '', orderStatus: null }; getTableData() }
const openLogs = async (row) => {
  const res = await getOrderStatusLogs({ orderId: row.ID })
  if (res.code === 0) { logs.value = res.data; logsVisible.value = true }
}
getTableData()
</script>
