<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="名称/路径" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchInfo.permissionType" placeholder="全部" clearable style="width: 120px">
            <el-option label="菜单" :value="1" />
            <el-option label="按钮" :value="2" />
            <el-option label="接口" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增权限</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe row-key="ID">
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="父级ID" prop="parentId" width="90" />
        <el-table-column label="权限名称" prop="permissionName" min-width="150" />
        <el-table-column label="类型" width="90">
          <template #default="scope">
            <el-tag>{{ typeText(scope.row.permissionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="路由/接口路径" prop="routePath" min-width="180" show-overflow-tooltip />
        <el-table-column label="HTTP方法" prop="httpMethod" width="100" />
        <el-table-column label="排序" prop="sort" width="70" />
        <el-table-column label="操作" width="150" fixed="right">
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑权限' : '新增权限'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="110px">
        <el-form-item label="父级ID">
          <el-input-number v-model="form.parentId" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="权限名称" required>
          <el-input v-model="form.permissionName" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.permissionType" style="width: 100%">
            <el-option label="菜单" :value="1" />
            <el-option label="按钮" :value="2" />
            <el-option label="接口" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由/接口路径">
          <el-input v-model="form.routePath" placeholder="/platform/role/list" />
        </el-form-item>
        <el-form-item label="HTTP方法">
          <el-input v-model="form.httpMethod" placeholder="GET/POST/PUT/DELETE" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
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
import { getPermissionList, createPermission, updatePermission, deletePermission } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '', permissionType: null })
const dialogVisible = ref(false)
const form = ref({})

const typeText = (v) => ({ 1: '菜单', 2: '按钮', 3: '接口' }[v] || v)

const getTableData = async () => {
  const res = await getPermissionList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : { parentId: 0, permissionType: 1, sort: 0 }
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updatePermission(form.value) : await createPermission(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除权限「${row.permissionName}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deletePermission(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
