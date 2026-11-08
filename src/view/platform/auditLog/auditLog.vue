<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="操作内容/操作人" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-input v-model="searchInfo.module" placeholder="如 角色管理" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="操作人" prop="operatorName" width="110" />
        <el-table-column label="操作模块" prop="module" width="120" />
        <el-table-column label="操作类型" prop="actionType" width="110" />
        <el-table-column label="操作内容" prop="content" min-width="200" show-overflow-tooltip />
        <el-table-column label="结果" prop="result" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.result === '成功' ? 'success' : 'danger'">{{ scope.row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源IP" prop="sourceIp" width="130" />
        <el-table-column label="操作时间" prop="createdAt" width="180" />
        <el-table-column label="详情" width="80" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDetail(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="searchInfo.page"
        v-model:page-size="searchInfo.pageSize"
        :total="total"
        :page-sizes="[10, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getTableData"
        @current-change="getTableData"
      />
    </div>
    <el-drawer v-model="detailVisible" title="操作详情" :size="appStore.drawerSize">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作人">{{ detail.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ detail.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ detail.actionType }}</el-descriptions-item>
        <el-descriptions-item label="操作内容">{{ detail.content }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">{{ detail.requestParams }}</el-descriptions-item>
        <el-descriptions-item label="结果">{{ detail.result }}</el-descriptions-item>
        <el-descriptions-item label="来源IP">{{ detail.sourceIp }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ detail.createdAt }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup>
  import { useAppStore } from '@/pinia'
  const appStore = useAppStore()
import { ref } from 'vue'
import { getAuditLogList } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '', module: '' })
const dateRange = ref([])
const detailVisible = ref(false)
const detail = ref({})

const getTableData = async () => {
  const params = { ...searchInfo.value }
  if (dateRange.value && dateRange.value.length === 2) {
    params.startTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }
  const res = await getAuditLogList(params)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const resetSearch = () => {
  searchInfo.value = { page: 1, pageSize: 10, keyword: '', module: '' }
  dateRange.value = []
  getTableData()
}

const openDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

getTableData()
</script>
