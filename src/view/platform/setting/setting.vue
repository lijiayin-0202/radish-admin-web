<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="配置键/说明" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增配置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="配置键" prop="configKey" width="220" />
        <el-table-column label="配置值" prop="configValue" min-width="200" show-overflow-tooltip />
        <el-table-column label="说明" prop="description" min-width="160" show-overflow-tooltip />
        <el-table-column label="更新人" prop="updatedBy" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="onDelete(scope.row)">删除</el-button>
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑配置' : '新增配置'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="配置键" required>
          <el-input v-model="form.configKey" placeholder="如 max_online_vehicles" />
        </el-form-item>
        <el-form-item label="配置值" required>
          <el-input v-model="form.configValue" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
  import { useAppStore } from '@/pinia'
const appStore = useAppStore()
import { getSettingList, createSetting, updateSetting, deleteSetting } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const dialogVisible = ref(false)
const form = ref({})

const getTableData = async () => {
  const res = await getSettingList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : {}
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updateSetting(form.value) : await createSetting(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除配置「${row.configKey}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deleteSetting(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
