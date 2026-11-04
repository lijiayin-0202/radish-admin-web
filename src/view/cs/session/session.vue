<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="会话号/分类/客服" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="会话编号" prop="sessionNo" width="180" />
        <el-table-column label="乘客ID" prop="passengerId" width="90" />
        <el-table-column label="订单ID" prop="orderId" width="90" />
        <el-table-column label="渠道" prop="channel" width="90" />
        <el-table-column label="问题分类" prop="issueCategory" min-width="120" />
        <el-table-column label="状态" prop="sessionStatus" width="100">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.sessionStatus)">{{ scope.row.sessionStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="接入客服" prop="assignedTo" width="110" />
        <el-table-column label="接入时间" prop="connectedAt" width="170" />
        <el-table-column label="结束时间" prop="closedAt" width="170" />
      </el-table>
      <el-pagination v-model:current-page="searchInfo.page" v-model:page-size="searchInfo.pageSize" :total="total"
        :page-sizes="[10, 30, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="getTableData"
        @current-change="getTableData" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getSessionList } from '@/api/cs/cs'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })

const statusTag = (v) => ({ 服务中: 'success', 排队中: 'warning', 已结束: 'info' }[v] || 'info')

const getTableData = async () => {
  const res = await getSessionList(searchInfo.value)
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
getTableData()
</script>
