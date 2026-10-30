<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="版本号/发布人" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增版本</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="版本号" prop="version" width="140" />
        <el-table-column label="发布人" prop="publisher" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="生效版本" width="110">
          <template #default="scope">
            <el-tag v-if="scope.row.isActive" type="success">当前生效</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button v-if="!scope.row.isActive" link type="success" @click="onActivate(scope.row)">设为生效</el-button>
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑地图版本' : '新增地图版本'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="版本号" required>
          <el-input v-model="form.version" />
        </el-form-item>
        <el-form-item label="发布人">
          <el-input v-model="form.publisher" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="已下线" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
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
import { getMapVersionList, createMapVersion, updateMapVersion, deleteMapVersion, activateMapVersion } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const dialogVisible = ref(false)
const form = ref({})

const statusText = (v) => ({ 0: '草稿', 1: '已发布', 2: '已下线' }[v] || v)
const statusTag = (v) => ({ 0: 'info', 1: 'success', 2: 'danger' }[v] || 'info')

const getTableData = async () => {
  const res = await getMapVersionList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : { status: 0 }
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updateMapVersion(form.value) : await createMapVersion(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const onActivate = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将版本「${row.version}」设为当前生效版本吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await activateMapVersion(row.ID)
  if (res.code === 0) {
    ElMessage.success('切换成功')
    getTableData()
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除地图版本「${row.version}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deleteMapVersion(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
