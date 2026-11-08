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
      <div v-if="hmiView" class="overview-metrics">
        <div><span>订单状态</span><b>{{ orderStatusMap[hmiView.orderStatus] || hmiView.orderStatus }}</b></div>
        <div><span>车辆 ID</span><b>{{ hmiView.vehicleId || '-' }}</b></div>
        <div><span>待处理指令</span><b>{{ hmiView.pendingCommands?.length || 0 }}</b></div>
        <div><span>预估金额</span><b>¥ {{ formatAmount(hmiView.estimatedAmount) }}</b></div>
        <div><span>应付金额</span><b>¥ {{ formatAmount(hmiView.payableAmount) }}</b></div>
        <div><span>安全事件</span><b>{{ hmiView.safetyIncidents?.length || 0 }}</b></div>
      </div>
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
      <div v-if="commands.length" class="command-list">
        <article v-for="command in commands" :key="command.commandNo" class="command-card">
          <div class="command-card__head"><strong>{{ command.commandNo }}</strong><span>{{ commandStatusMap[command.status] || command.status }}</span></div>
          <div class="command-card__meta"><span>类型 {{ command.commandType }}</span><span>优先级 {{ command.priority }}</span></div>
          <div class="command-card__actions">
            <el-button type="primary" plain :disabled="command.status !== 1" @click="ack(command)">确认接收</el-button>
            <el-button :disabled="command.status !== 2" @click="finish(command, true)">执行成功</el-button>
            <el-button type="danger" plain :disabled="command.status !== 2" @click="finish(command, false)">执行失败</el-button>
          </div>
        </article>
      </div>
      <el-empty v-else description="暂无待处理指令" :image-size="64" />
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
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

</script>

<style scoped>
.panel-stack { display: grid; gap: 16px; }
.section-block { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.section-heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.section-heading h3 { margin: 0; color: #1f2937; font-size: 16px; }
.section-heading p { margin: 5px 0 0; color: #6b7280; font-size: 12px; }
.section-heading svg { width: 15px; margin-right: 5px; }
.overview-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }.overview-metrics div { display: flex; min-height: 68px; flex-direction: column; justify-content: center; gap: 5px; padding: 10px; border-radius: 10px; background: #f6f7f9; }.overview-metrics span { color: #7a828d; font-size: 11px; }.overview-metrics b { color: #1f2937; font-size: 14px; }
.command-list { display: grid; gap: 10px; }.command-card { padding: 13px; border: 1px solid #e6e9ed; border-radius: 12px; background: #fafbfc; }.command-card__head, .command-card__meta, .command-card__actions { display: flex; align-items: center; justify-content: space-between; gap: 8px; }.command-card__head strong { min-width: 0; overflow: hidden; color: #253040; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }.command-card__head span { flex: 0 0 auto; padding: 3px 7px; border-radius: 99px; background: #fff1f1; color: #ac0c14; font-size: 10px; }.command-card__meta { margin-top: 9px; color: #707987; font-size: 11px; }.command-card__actions { display: grid; grid-template-columns: 1fr; margin-top: 12px; }.command-card__actions .el-button { width: 100%; margin-left: 0; }
:deep(.el-form-item) { margin-bottom: 14px; }
:deep(.el-input-number), :deep(.el-input) { width: 230px; }
@media (max-width: 760px) { .section-heading { flex-direction: column; }.section-heading .el-button { width: 100%; }:deep(.el-input-number), :deep(.el-input) { width: 100%; } }
</style>
