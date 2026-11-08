<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="标题">
          <el-input v-model="searchInfo.keyword" placeholder="通知标题" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="乘客ID" prop="passengerId" width="100" />
        <el-table-column label="类型" prop="notifyType" width="100">
          <template #default="scope">
            <el-tag>{{ scope.row.notifyType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="200" show-overflow-tooltip />
        <el-table-column label="内容" prop="content" min-width="260" show-overflow-tooltip />
        <el-table-column label="已读" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.isRead ? 'success' : 'info'">{{ scope.row.isRead ? '已读' : '未读' }}</el-tag>
          </template>
        </el-table-column>
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
import { getNotificationList } from '@/api/cs/cs'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })

const getTableData = async () => {
  const res = await getNotificationList(searchInfo.value)
  if (res.code === 0) { tableData.value = res.data.list; total.value = res.data.total }
}
getTableData()
</script>
