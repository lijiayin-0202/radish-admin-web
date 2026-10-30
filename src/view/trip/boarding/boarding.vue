<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="核验方式/结果" clearable @keyup.enter="getTableData" />
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
        <el-table-column label="订单ID" prop="orderId" width="100" />
        <el-table-column label="乘客ID" prop="passengerId" width="100" />
        <el-table-column label="车辆ID" prop="vehicleId" width="100" />
        <el-table-column label="核验方式" prop="verifyType" width="120" />
        <el-table-column label="核验结果" prop="verifyStatus" width="110">
          <template #default="scope">
            <el-tag :type="scope.row.verifyStatus === '成功' ? 'success' : 'danger'">{{ scope.row.verifyStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核验时间" prop="verifiedAt" width="180" />
        <el-table-column label="创建时间" prop="createdAt" width="180" />
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getBoardingList } from '@/api/trip/trip'
import CityAreaTimeFilter from '@/components/filters/CityAreaTimeFilter.vue'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const catFilters = ref({ city: '', area: '', startTime: '', endTime: '' })
const filterKey = ref(0)
const onCatChange = (f) => { catFilters.value = f; getTableData() }

const getTableData = async () => {
  const res = await getBoardingList({ ...searchInfo.value, ...catFilters.value })
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
getTableData()
</script>
