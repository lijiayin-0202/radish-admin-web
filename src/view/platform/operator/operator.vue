<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="关键词">
          <el-input v-model="searchInfo.keyword" placeholder="账号/姓名" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增账号</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="登录账号" prop="username" min-width="140" />
        <el-table-column label="真实姓名" prop="realName" width="140" />
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="openDialog(scope.row)">编辑</el-button>
            <el-button link type="success" @click="openRoles(scope.row)">分配角色</el-button>
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

    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑账号' : '新增账号'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="90px">
        <el-form-item label="登录账号" required>
          <el-input v-model="form.username" :disabled="!!form.ID" />
        </el-form-item>
        <el-form-item :label="form.ID ? '重置密码' : '密码'" :required="!form.ID">
          <el-input v-model="form.password" type="password" show-password :placeholder="form.ID ? '留空则不修改' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-drawer>

    <el-drawer v-model="rolesVisible" :title="`分配角色 - ${currentOp.username || ''}`" :size="appStore.drawerSize">
      <el-select v-model="selectedRoles" multiple placeholder="请选择角色" style="width: 100%">
        <el-option v-for="r in roleOptions" :key="r.ID" :label="r.roleName" :value="r.ID" />
      </el-select>
      <template #footer>
        <el-button @click="rolesVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRoles">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
  import { useAppStore } from '@/pinia'
const appStore = useAppStore()
import { getOperatorList, getOperatorRoles, getRoleList, createOperator, updateOperator, deleteOperator, assignOperatorRoles } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '' })
const dialogVisible = ref(false)
const form = ref({})
const rolesVisible = ref(false)
const currentOp = ref({})
const roleOptions = ref([])
const selectedRoles = ref([])

const getTableData = async () => {
  const res = await getOperatorList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row, password: '' } : { status: 1 }
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updateOperator(form.value) : await createOperator(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const openRoles = async (row) => {
  currentOp.value = row
  rolesVisible.value = true
  const [roleRes, opRes] = await Promise.all([
    getRoleList({ page: 1, pageSize: 1000 }),
    getOperatorRoles(row.ID)
  ])
  if (roleRes.code === 0) {
    roleOptions.value = roleRes.data.list
  }
  if (opRes.code === 0) {
    selectedRoles.value = opRes.data.roleIds || []
  }
}

const submitRoles = async () => {
  const res = await assignOperatorRoles({ operatorUserId: currentOp.value.ID, roleIds: selectedRoles.value })
  if (res.code === 0) {
    ElMessage.success('分配成功')
    rolesVisible.value = false
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除账号「${row.username}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deleteOperator(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
