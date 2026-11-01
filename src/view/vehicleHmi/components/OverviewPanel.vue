<template>
  <div class="panel-stack">
    <section class="section-block">
      <div class="section-heading">
        <div><h3>订单 HMI 聚合视图</h3><p>读取订单、车辆、费用、待执行指令和安全事件。</p></div>
        <el-button type="primary" :loading="loadingView" @click="loadView"><Refresh />刷新视图</el-button>
      </div>
      <el-form :inline="true" label-position="top">
        <el-form-item label="订单 ID">
          <el-input-number v-model="orderId" :min="1" :controls="false" />
        </el-form-item>
      </el-form>
      <el-descriptions v-if="hmiView" :column="3" border>
        <el-descriptions-item label="订单状态">{{ orderStatusMap[hmiView.orderStatus] || hmiView.orderStatus }}</el-descriptions-item>
        <el-descriptions-item label="车辆 ID">{{ hmiView.vehicleId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="待处理指令">{{ hmiView.pendingCommands?.length || 0 }}</el-descriptions-item>
        <el-descriptions-item label="预估金额">¥ {{ formatAmount(hmiView.estimatedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="应付金额">¥ {{ formatAmount(hmiView.payableAmount) }}</el-descriptions-item>
        <el-descriptions-item label="安全事件">{{ hmiView.safetyIncidents?.length || 0 }}</el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="输入订单 ID 后读取 HMI 视图" :image-size="70" />
    </section>

    <section class="section-block">
      <div class="section-heading">
        <div><h3>车辆指令</h3><p>拉取待执行指令，并按状态完成确认和结果上报。</p></div>
        <el-button :loading="loadingCommands" @click="loadCommands"><Search />查询指令</el-button>
      </div>
      <el-form :inline="true" label-position="top">
        <el-form-item label="车辆 ID">
          <el-input-number v-model="vehicleId" :min="1" :controls="false" />
        </el-form-item>
        <el-form-item label="指令编号（可选）">
          <el-input v-model.trim="commandNo" clearable placeholder="例如 CMD-20261030-001" />
        </el-form-item>
      </el-form>
      <el-table :data="commands" empty-text="暂无待处理指令" border>
        <el-table-column prop="commandNo" label="指令编号" min-width="170" />
        <el-table-column prop="commandType" label="类型" width="70" />
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="scope">{{ commandStatusMap[scope.row.status] || scope.row.status }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button link type="primary" :disabled="scope.row.status !== 1" @click="ack(scope.row)">确认接收</el-button>
            <el-dropdown @command="handleFinishCommand(scope.row, $event)">
              <el-button link type="primary" :disabled="scope.row.status !== 2">上报结果<ArrowDown /></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="true">执行成功</el-dropdown-item>
                  <el-dropdown-item :command="false">执行失败</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Refresh, Search } from '@element-plus/icons-vue'
import { acknowledgeCommand, getHmiView, getPendingCommands, reportCommandResult } from '@/api/vehicleHmi'
import { commandStatusMap, orderStatusMap } from '@/constants/vehicleHmi'
import { errorMessage } from '../helpers'

const emit = defineEmits(['view-loaded'])
const orderId = ref(1)
const vehicleId = ref(1)
const commandNo = ref('')
const hmiView = ref(null)
const commands = ref([])
const loadingView = ref(false)
const loadingCommands = ref(false)

const formatAmount = (value) => Number(value || 0).toFixed(2)

const loadView = async () => {
  loadingView.value = true
  try {
    hmiView.value = await getHmiView(orderId.value)
    vehicleId.value = hmiView.value.vehicleId || vehicleId.value
    emit('view-loaded', hmiView.value)
    ElMessage.success('HMI 视图读取成功')
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    loadingView.value = false
  }
}

const loadCommands = async () => {
  loadingCommands.value = true
  try {
    const result = await getPendingCommands({ vehicleId: vehicleId.value, commandNo: commandNo.value || undefined })
    commands.value = result.commands || []
  } catch (error) {
    ElMessage.error(errorMessage(error))
  } finally {
    loadingCommands.value = false
  }
}

const ack = async (command) => {
  try {
    await acknowledgeCommand(command.commandNo)
    ElMessage.success('指令已确认接收')
    await loadCommands()
  } catch (error) {
    ElMessage.error(errorMessage(error))
  }
}

const finish = async (command, succeeded) => {
  try {
    const { value = '' } = await ElMessageBox.prompt('填写车辆端执行结果', succeeded ? '执行成功' : '执行失败', {
      inputValue: succeeded ? '车辆已完成指令' : '车辆执行指令失败',
      confirmButtonText: '提交',
      cancelButtonText: '取消'
    })
    await reportCommandResult(command.commandNo, { succeeded, resultMessage: value })
    ElMessage.success('指令结果已写入')
    await loadCommands()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(errorMessage(error))
  }
}

// 将下拉菜单结果和当前指令显式传入，避免模板插槽作用域被异步闭包捕获。
const handleFinishCommand = (command, succeeded) => {
  finish(command, succeeded)
}
</script>

<style scoped>
.panel-stack { display: grid; gap: 16px; }
.section-block { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.section-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.section-heading h3 { margin: 0; color: #1f2937; font-size: 16px; }
.section-heading p { margin: 5px 0 0; color: #6b7280; font-size: 12px; }
.section-heading svg { width: 15px; margin-right: 5px; }
:deep(.el-form-item) { margin-bottom: 14px; }
:deep(.el-input-number), :deep(.el-input) { width: 230px; }
@media (max-width: 760px) { .section-heading { flex-direction: column; }.section-heading .el-button { width: 100%; }:deep(.el-input-number), :deep(.el-input) { width: 100%; } }
</style>
