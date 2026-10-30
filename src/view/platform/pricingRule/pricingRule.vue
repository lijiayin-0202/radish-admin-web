<template>
  <div>
    <div class="gva-search-box">
      <el-form :inline="true" :model="searchInfo">
        <el-form-item label="规则名称">
          <el-input v-model="searchInfo.keyword" placeholder="规则名称" clearable @keyup.enter="getTableData" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchInfo.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button @click="openDialog()">新增规则</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="gva-table-box">
      <el-table :data="tableData" border stripe>
        <el-table-column label="ID" prop="ID" width="70" />
        <el-table-column label="规则名称" prop="ruleName" min-width="140" />
        <el-table-column label="基础费用" prop="baseFee" width="110" />
        <el-table-column label="里程单价" prop="mileagePrice" width="110" />
        <el-table-column label="时长单价" prop="timePrice" width="110" />
        <el-table-column label="附加费用" prop="additionalFee" width="110" />
        <el-table-column label="状态" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
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
    <el-drawer v-model="dialogVisible" :title="form.ID ? '编辑计价规则' : '新增计价规则'" :size="appStore.drawerSize">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.ruleName" />
        </el-form-item>
        <el-form-item label="基础费用">
          <el-input-number v-model="form.baseFee" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="里程单价">
          <el-input-number v-model="form.mileagePrice" :precision="4" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长单价">
          <el-input-number v-model="form.timePrice" :precision="4" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="附加费用">
          <el-input-number v-model="form.additionalFee" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
import { getPricingRuleList, createPricingRule, updatePricingRule, deletePricingRule } from '@/api/platform/platform'

const tableData = ref([])
const total = ref(0)
const searchInfo = ref({ page: 1, pageSize: 10, keyword: '', status: null })
const dialogVisible = ref(false)
const form = ref({})

const getTableData = async () => {
  const res = await getPricingRuleList(searchInfo.value)
  if (res.code === 0) {
    tableData.value = res.data.list
    total.value = res.data.total
  }
}

const openDialog = (row) => {
  form.value = row ? { ...row } : { status: 1 }
  dialogVisible.value = true
}

const submit = async () => {
  const res = form.value.ID ? await updatePricingRule(form.value) : await createPricingRule(form.value)
  if (res.code === 0) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    getTableData()
  }
}

const onDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除计价规则「${row.ruleName}」吗？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  const res = await deletePricingRule(row.ID)
  if (res.code === 0) {
    ElMessage.success('删除成功')
    getTableData()
  }
}

getTableData()
</script>
