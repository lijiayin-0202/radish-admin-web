<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="派单号/状态" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <city-area-time-filter :key="filterKey" :show-city="true" :show-area="true" :show-time="true" @change="onCatChange" />
          <el-button type="primary" @click="getTableData">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="派单号" prop="dispatchNo" width="180" />
        <el-table-column label="订单ID" prop="orderId" width="90" />
        <el-table-column label="车辆ID" prop="vehicleId" width="90" />
        <el-table-column label="派单策略" prop="dispatchStrategy" min-width="130" />
        <el-table-column label="候选评分" prop="candidateScore" width="100" />
        <el-table-column label="接驾距离(米)" prop="etaDistanceM" width="120" />
        <el-table-column label="接驾时长(秒)" prop="etaDurationS" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="dispatchTag(scope.row.dispatchStatus)">{{ scope.row.dispatchStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" min-width="140" show-overflow-tooltip />
        <el-table-column label="时间" prop="createdAt" width="170" />
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getDispatchList } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }

const dispatchTag = (v) => ({ 车辆确认: 'success', 失败: 'danger', 超时: 'warning' }[v] || 'info')

const getTableData = async () => {
  const res = await getDispatchList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
getTableData()
</script>
