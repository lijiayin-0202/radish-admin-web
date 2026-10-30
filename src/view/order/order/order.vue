<template>
  <div>
    <!-- 搜索区 -->
    <div class="gva-search-box">
      <el-form ref="searchForm" :inline="true" :model="searchInfo" class="demo-form-inline">
        <el-form-item label="订单号">
          <el-input v-model="searchInfo.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="运单号">
          <el-input v-model="searchInfo.waybillNo" placeholder="请输入运单号" clearable />
        </el-form-item>
        <el-form-item label="收件人">
          <el-input v-model="searchInfo.receiverName" placeholder="请输入收件人" clearable />
        </el-form-item>
        <el-form-item label="收件电话">
          <el-input v-model="searchInfo.receiverMobile" placeholder="请输入收件电话" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchInfo.orderStatus" placeholder="请选择状态" clearable style="width: 160px">
            <el-option v-for="item in orderStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单渠道">
          <el-select v-model="searchInfo.channel" placeholder="请选择渠道" clearable style="width: 160px">
            <el-option v-for="item in channelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="onSubmit">查询</el-button>
          <el-button icon="Refresh" @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表区 -->
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="Plus" @click="openCreate">新建订单</el-button>
        <el-button type="danger" icon="Delete" :disabled="multipleSelection.length === 0" @click="onDeleteSelected">
          批量删除
        </el-button>
      </div>

      <el-table
        :data="tableData"
        row-key="ID"
        :header-cell-style="{ textAlign: 'center' }"
        @selection-change="onSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="订单号" prop="orderNo" min-width="185" show-overflow-tooltip />
        <el-table-column label="运单号" prop="waybillNo" min-width="165" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.waybillNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="客户" prop="customerName" min-width="110" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.customerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="寄件人" prop="senderName" min-width="100" show-overflow-tooltip />
        <el-table-column label="收件人" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <div>{{ scope.row.receiverName || '-' }}</div>
            <div class="sub-text">{{ scope.row.receiverMobile || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="收件地址" prop="receiverAddress" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            {{ `${scope.row.receiverProvince || ''}${scope.row.receiverCity || ''}${scope.row.receiverDistrict || ''}${scope.row.receiverAddress || ''}` || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="货物" min-width="140" show-overflow-tooltip>
          <template #default="scope">
            <div>{{ scope.row.goodsName || '-' }}</div>
            <div class="sub-text">{{ scope.row.packageNum || 0 }} 件 / {{ scope.row.weight || 0 }} kg</div>
          </template>
        </el-table-column>
        <el-table-column label="应付金额" min-width="110" align="right">
          <template #default="scope">
            <span class="amount-text">¥{{ Number(scope.row.payableAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" min-width="110" align="center">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.orderStatus)" effect="light">
              {{ statusText(scope.row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="拦截状态" min-width="110" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.interceptStatus > 0" type="danger" effect="plain">
              {{ interceptStatusText(scope.row.interceptStatus) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="渠道" min-width="100" align="center">
          <template #default="scope">{{ optionLabel(channelOptions, scope.row.channel) }}</template>
        </el-table-column>
        <el-table-column label="下单时间" min-width="170">
          <template #default="scope">{{ formatTime(scope.row.CreatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" min-width="180" align="center">
          <template #default="scope">
            <el-button type="primary" link icon="View" @click.stop="openDetail(scope.row)">详情</el-button>
            <el-button type="primary" link icon="Refresh" @click.stop="openStatusDialog(scope.row)">状态流转</el-button>
            <el-button type="danger" link icon="Delete" @click.stop="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="gva-pagination">
        <el-pagination
          :current-page="page"
          :page-size="pageSize"
          :page-sizes="[10, 30, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" :with-header="false" size="72%" destroy-on-close>
      <div v-if="detail.order.ID" class="order-detail">
        <div class="detail-header">
          <div class="detail-header-left">
            <span class="detail-order-no">{{ detail.order.orderNo }}</span>
            <el-tag :type="statusTagType(detail.order.orderStatus)" effect="dark">
              {{ statusText(detail.order.orderStatus) }}
            </el-tag>
            <el-tag v-if="detail.order.interceptStatus > 0" type="danger" effect="plain">
              {{ interceptStatusText(detail.order.interceptStatus) }}
            </el-tag>
          </div>
          <el-button icon="Close" circle @click="drawerVisible = false" />
        </div>

        <!-- 状态流转 -->
        <div class="detail-block">
          <div class="block-title">状态流转</div>
          <el-steps v-if="detail.order.orderStatus <= 5" :active="stepActive" align-center finish-status="success">
            <el-step title="待揽收" />
            <el-step title="已揽收" />
            <el-step title="运输中" />
            <el-step title="派送中" />
            <el-step title="已签收" />
          </el-steps>
          <el-alert
            v-else
            :title="`订单当前为「${statusText(detail.order.orderStatus)}」状态`"
            :type="detail.order.orderStatus === 8 ? 'warning' : 'error'"
            :description="detail.order.cancelReason || '订单已进入终态或异常状态，可查看下方记录了解处理过程'"
            :closable="false"
            show-icon
          />
        </div>

        <!-- 操作按钮 -->
        <div class="detail-actions">
          <el-button type="primary" icon="Refresh" @click="openStatusDialog(detail.order)">状态流转</el-button>
          <el-button type="warning" icon="Edit" @click="openChangeDialog">发起改单</el-button>
          <el-button type="danger" icon="Back" @click="openInterceptDialog">拦截退回</el-button>
          <el-button type="info" icon="Warning" @click="openTicketDialog">创建异常工单</el-button>
        </div>

        <!-- 基本信息 -->
        <div class="detail-block">
          <div class="block-title">基本信息</div>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="订单号">{{ detail.order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ detail.order.waybillNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="外部单号">{{ detail.order.externalOrderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ detail.order.customerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="下单渠道">{{ optionLabel(channelOptions, detail.order.channel) }}</el-descriptions-item>
            <el-descriptions-item label="业务类型">{{ optionLabel(orderTypeOptions, detail.order.orderType) }}</el-descriptions-item>
            <el-descriptions-item label="付款方式">{{ optionLabel(payMethodOptions, detail.order.payMethod) }}</el-descriptions-item>
            <el-descriptions-item label="揽收网点">{{ detail.order.pickupNetworkName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="派送网点">{{ detail.order.deliveryNetworkName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="揽收员">{{ detail.order.courierName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="揽收员电话">{{ detail.order.courierMobile || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预约揽收">{{ formatTime(detail.order.expectPickupAt) }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatTime(detail.order.CreatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="揽收时间">{{ formatTime(detail.order.pickupAt) }}</el-descriptions-item>
            <el-descriptions-item label="签收时间">{{ formatTime(detail.order.signAt) }}</el-descriptions-item>
            <el-descriptions-item label="订单备注" :span="3">{{ detail.order.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-block">
          <div class="block-title">寄收信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="寄件人">
              {{ `${detail.order.senderName || '-'} ${detail.order.senderMobile || ''}` }}
            </el-descriptions-item>
            <el-descriptions-item label="收件人">
              {{ `${detail.order.receiverName || '-'} ${detail.order.receiverMobile || ''}` }}
            </el-descriptions-item>
            <el-descriptions-item label="寄件地址">
              {{ `${detail.order.senderProvince || ''}${detail.order.senderCity || ''}${detail.order.senderDistrict || ''}${detail.order.senderAddress || ''}` || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="收件地址">
              {{ `${detail.order.receiverProvince || ''}${detail.order.receiverCity || ''}${detail.order.receiverDistrict || ''}${detail.order.receiverAddress || ''}` || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="货物信息">
              {{ `${detail.order.goodsName || '-'} / ${optionLabel(goodsTypeOptions, detail.order.goodsType)}` }}
            </el-descriptions-item>
            <el-descriptions-item label="件数/重量/体积">
              {{ `${detail.order.packageNum || 0} 件 / ${detail.order.weight || 0} kg / ${detail.order.volume || 0} m³` }}
            </el-descriptions-item>
            <el-descriptions-item label="费用合计">¥{{ Number(detail.order.totalAmount || 0).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="应付金额">
              <span class="amount-text">¥{{ Number(detail.order.payableAmount || 0).toFixed(2) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 详情多 Tab -->
        <div class="detail-block">
          <el-tabs v-model="activeTab">
            <!-- 费用明细 -->
            <el-tab-pane label="费用明细" name="fee">
              <div class="tab-toolbar">
                <span class="tab-summary">
                  费用合计 ¥{{ Number(detail.order.totalAmount || 0).toFixed(2) }}，优惠 ¥{{ Number(detail.order.discountAmount || 0).toFixed(2) }}，应付 ¥{{ Number(detail.order.payableAmount || 0).toFixed(2) }}
                </span>
              </div>
              <el-table :data="detail.feeList" border size="small" :header-cell-style="{ textAlign: 'center' }">
                <el-table-column label="费用类型" min-width="120" align="center">
                  <template #default="scope">{{ optionLabel(feeTypeOptions, scope.row.feeType) }}</template>
                </el-table-column>
                <el-table-column label="费用名称" prop="feeName" min-width="130" />
                <el-table-column label="金额(元)" min-width="110" align="right">
                  <template #default="scope">{{ Number(scope.row.amount || 0).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="支付方式" min-width="110" align="center">
                  <template #default="scope">{{ optionLabel(payMethodOptions, scope.row.payMethod) }}</template>
                </el-table-column>
                <el-table-column label="结算状态" min-width="100" align="center">
                  <template #default="scope">{{ optionLabel(settleStatusOptions, scope.row.settleStatus) }}</template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip>
                  <template #default="scope">{{ scope.row.remark || '-' }}</template>
                </el-table-column>
                <template #empty>
                  <div class="empty-tip">暂无费用明细</div>
                </template>
              </el-table>
            </el-tab-pane>

            <!-- 改单记录 -->
            <el-tab-pane label="改单记录" name="change">
              <el-table :data="detail.changeList" border size="small" :header-cell-style="{ textAlign: 'center' }">
                <el-table-column label="改单号" prop="changeNo" min-width="170" show-overflow-tooltip />
                <el-table-column label="改单类型" min-width="110" align="center">
                  <template #default="scope">{{ optionLabel(changeTypeOptions, scope.row.changeType) }}</template>
                </el-table-column>
                <el-table-column label="改单原因" prop="reason" min-width="160" show-overflow-tooltip />
                <el-table-column label="变更内容" min-width="260">
                  <template #default="scope">
                    <div class="snapshot-text">变更前：{{ snapshotText(scope.row.beforeData) }}</div>
                    <div class="snapshot-text">变更后：{{ snapshotText(scope.row.afterData) }}</div>
                  </template>
                </el-table-column>
                <el-table-column label="状态" min-width="100" align="center">
                  <template #default="scope">
                    <el-tag :type="changeStatusTagType(scope.row.status)" effect="light">
                      {{ optionLabel(changeStatusOptions, scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="申请人" prop="applyName" min-width="100" align="center">
                  <template #default="scope">{{ scope.row.applyName || '-' }}</template>
                </el-table-column>
                <el-table-column label="申请时间" min-width="170">
                  <template #default="scope">{{ formatTime(scope.row.CreatedAt) }}</template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" min-width="150" align="center">
                  <template #default="scope">
                    <template v-if="scope.row.status === 0">
                      <el-button type="primary" link @click="onAuditChange(scope.row, true)">通过</el-button>
                      <el-button type="danger" link @click="onAuditChange(scope.row, false)">驳回</el-button>
                    </template>
                    <span v-else class="sub-text">{{ scope.row.auditName || '-' }}</span>
                  </template>
                </el-table-column>
                <template #empty>
                  <div class="empty-tip">暂无改单记录</div>
                </template>
              </el-table>
            </el-tab-pane>

            <!-- 拦截记录 -->
            <el-tab-pane label="拦截记录" name="intercept">
              <el-table :data="detail.interceptList" border size="small" :header-cell-style="{ textAlign: 'center' }">
                <el-table-column label="拦截单号" prop="interceptNo" min-width="170" show-overflow-tooltip />
                <el-table-column label="拦截类型" min-width="120" align="center">
                  <template #default="scope">{{ optionLabel(interceptTypeOptions, scope.row.interceptType) }}</template>
                </el-table-column>
                <el-table-column label="拦截原因" prop="reason" min-width="180" show-overflow-tooltip />
                <el-table-column label="状态" min-width="100" align="center">
                  <template #default="scope">
                    <el-tag :type="interceptHandleStatusTagType(scope.row.status)" effect="light">
                      {{ optionLabel(interceptHandleStatusOptions, scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="申请人" prop="applyName" min-width="100" align="center" />
                <el-table-column label="申请时间" min-width="170">
                  <template #default="scope">{{ formatTime(scope.row.applyAt) }}</template>
                </el-table-column>
                <el-table-column label="处理人" prop="handleName" min-width="100" align="center">
                  <template #default="scope">{{ scope.row.handleName || '-' }}</template>
                </el-table-column>
                <el-table-column label="处理说明" prop="handleRemark" min-width="160" show-overflow-tooltip>
                  <template #default="scope">{{ scope.row.handleRemark || '-' }}</template>
                </el-table-column>
                <template #empty>
                  <div class="empty-tip">暂无拦截记录</div>
                </template>
              </el-table>
            </el-tab-pane>

            <!-- 异常工单（仅展示入口，工单流转由异常工单模块负责） -->
            <el-tab-pane label="异常工单" name="ticket">
              <div class="tab-toolbar">
                <span class="tab-summary">本页仅展示由「订单管理」发起的异常工单登记，工单的受理与流转请前往「异常工单」模块处理。</span>
              </div>
              <el-table :data="detail.ticketList" border size="small" :header-cell-style="{ textAlign: 'center' }">
                <el-table-column label="工单编号" prop="ticketNo" min-width="170" show-overflow-tooltip />
                <el-table-column label="工单类型" min-width="110" align="center">
                  <template #default="scope">{{ optionLabel(ticketTypeOptions, scope.row.ticketType) }}</template>
                </el-table-column>
                <el-table-column label="优先级" min-width="100" align="center">
                  <template #default="scope">
                    <el-tag :type="priorityTagType(scope.row.priority)" effect="plain">
                      {{ optionLabel(priorityOptions, scope.row.priority) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
                <el-table-column label="问题描述" prop="description" min-width="220" show-overflow-tooltip />
                <el-table-column label="状态" min-width="100" align="center">
                  <template #default="scope">{{ optionLabel(ticketStatusOptions, scope.row.status) }}</template>
                </el-table-column>
                <el-table-column label="来源" prop="source" min-width="100" align="center" />
                <el-table-column label="创建人" prop="creatorName" min-width="100" align="center" />
                <el-table-column label="创建时间" min-width="170">
                  <template #default="scope">{{ formatTime(scope.row.CreatedAt) }}</template>
                </el-table-column>
                <template #empty>
                  <div class="empty-tip">暂无异常工单，可点击上方「创建异常工单」发起</div>
                </template>
              </el-table>
            </el-tab-pane>

            <!-- 以下为其他模块的展示入口，本模块不生成其页面与后端代码 -->
            <el-tab-pane label="面单与号段" name="waybill">
              <el-empty description="面单与号段由对应模块负责，此处仅保留入口" />
            </el-tab-pane>
            <el-tab-pane label="计费结算" name="settlement">
              <el-empty description="计费结算由对应模块负责，此处仅保留入口" />
            </el-tab-pane>
            <el-tab-pane label="网点运力" name="network">
              <el-empty description="网点运力由对应模块负责，仅在下单时保存网点快照" />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>

    <!-- 状态流转 -->
    <el-dialog v-model="statusDialogVisible" title="状态流转" width="480px" destroy-on-close>
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="statusTagType(detail.order.orderStatus)" effect="light">
            {{ statusText(detail.order.orderStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="statusForm.targetStatus" placeholder="请选择目标状态" style="width: 100%">
            <el-option
              v-for="item in allowedStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="流转来源">
          <el-select v-model="statusForm.changeSource" style="width: 100%">
            <el-option v-for="item in changeSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="流转说明">
          <el-input v-model="statusForm.remark" type="textarea" :rows="3" placeholder="请输入流转说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStatus">确定</el-button>
      </template>
    </el-dialog>

    <!-- 发起改单 -->
    <el-dialog v-model="changeDialogVisible" title="发起改单" width="560px" destroy-on-close>
      <el-form :model="changeForm" label-width="100px">
        <el-form-item label="改单类型">
          <el-select v-model="changeForm.changeType" style="width: 100%">
            <el-option v-for="item in changeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <template v-if="changeForm.changeType === 1">
          <el-form-item label="收件人">
            <el-input v-model="changeForm.receiverName" placeholder="请输入收件人" />
          </el-form-item>
          <el-form-item label="收件电话">
            <el-input v-model="changeForm.receiverMobile" placeholder="请输入收件电话" />
          </el-form-item>
        </template>
        <template v-if="changeForm.changeType === 2">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="省">
                <el-input v-model="changeForm.receiverProvince" placeholder="省" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市">
                <el-input v-model="changeForm.receiverCity" placeholder="市" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="区县">
            <el-input v-model="changeForm.receiverDistrict" placeholder="区县" />
          </el-form-item>
          <el-form-item label="详细地址">
            <el-input v-model="changeForm.receiverAddress" type="textarea" :rows="2" placeholder="请输入详细地址" />
          </el-form-item>
        </template>
        <template v-if="changeForm.changeType === 3">
          <el-form-item label="物品名称">
            <el-input v-model="changeForm.goodsName" placeholder="请输入物品名称" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="件数">
                <el-input-number v-model="changeForm.packageNum" :min="1" :max="999" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="重量(kg)">
                <el-input-number v-model="changeForm.weight" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        <el-form-item v-if="changeForm.changeType === 4" label="付款方式">
          <el-select v-model="changeForm.payMethod" style="width: 100%">
            <el-option v-for="item in payMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="changeForm.changeType === 5" label="预约时间">
          <el-date-picker
            v-model="changeForm.expectPickupAt"
            type="datetime"
            placeholder="请选择预约揽收时间"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="改单原因">
          <el-input v-model="changeForm.reason" type="textarea" :rows="2" placeholder="请输入改单原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="changeForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitChange">提交</el-button>
      </template>
    </el-dialog>

    <!-- 拦截退回 -->
    <el-dialog v-model="interceptDialogVisible" title="拦截退回" width="520px" destroy-on-close>
      <el-form :model="interceptForm" label-width="100px">
        <el-form-item label="拦截类型">
          <el-select v-model="interceptForm.interceptType" style="width: 100%">
            <el-option v-for="item in interceptTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="拦截原因">
          <el-input v-model="interceptForm.reason" type="textarea" :rows="3" placeholder="请输入拦截原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="interceptForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="interceptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitIntercept">确定拦截</el-button>
      </template>
    </el-dialog>

    <!-- 创建异常工单 -->
    <el-dialog v-model="ticketDialogVisible" title="创建异常工单" width="560px" destroy-on-close>
      <el-form :model="ticketForm" label-width="100px">
        <el-form-item label="工单类型">
          <el-select v-model="ticketForm.ticketType" style="width: 100%">
            <el-option v-for="item in ticketTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="ticketForm.priority" style="width: 100%">
            <el-option v-for="item in priorityOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单标题">
          <el-input v-model="ticketForm.title" placeholder="请输入工单标题" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="ticketForm.description" type="textarea" :rows="4" placeholder="请输入问题描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ticketDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTicket">提交</el-button>
      </template>
    </el-dialog>

    <!-- 新建订单 -->
    <el-dialog v-model="createDialogVisible" title="新建订单" width="820px" destroy-on-close>
      <el-form :model="createForm" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="客户名称">
              <el-input v-model="createForm.customerName" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="下单渠道">
              <el-select v-model="createForm.channel" style="width: 100%">
                <el-option v-for="item in channelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="业务类型">
              <el-select v-model="createForm.orderType" style="width: 100%">
                <el-option v-for="item in orderTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款方式">
              <el-select v-model="createForm.payMethod" style="width: 100%">
                <el-option v-for="item in payMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="揽收网点">
              <el-input v-model="createForm.pickupNetworkName" placeholder="请输入揽收网点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="派送网点">
              <el-input v-model="createForm.deliveryNetworkName" placeholder="请输入派送网点名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">寄件信息</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="寄件人">
              <el-input v-model="createForm.senderName" placeholder="请输入寄件人" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="寄件电话">
              <el-input v-model="createForm.senderMobile" placeholder="请输入寄件电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="寄件省市区">
              <el-input v-model="createForm.senderRegion" placeholder="如：广东省深圳市南山区" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="寄件地址">
              <el-input v-model="createForm.senderAddress" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">收件信息</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="收件人">
              <el-input v-model="createForm.receiverName" placeholder="请输入收件人" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收件电话">
              <el-input v-model="createForm.receiverMobile" placeholder="请输入收件电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收件省市区">
              <el-input v-model="createForm.receiverRegion" placeholder="如：北京市朝阳区" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="收件地址">
              <el-input v-model="createForm.receiverAddress" placeholder="请输入详细地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">货物与费用</el-divider>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="物品名称">
              <el-input v-model="createForm.goodsName" placeholder="请输入物品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="物品类型">
              <el-select v-model="createForm.goodsType" style="width: 100%">
                <el-option v-for="item in goodsTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="件数">
              <el-input-number v-model="createForm.packageNum" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="重量(kg)">
              <el-input-number v-model="createForm.weight" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="体积(m³)">
              <el-input-number v-model="createForm.volume" :min="0" :precision="4" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="运费(元)">
              <el-input-number v-model="createForm.freightAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="保价费(元)">
              <el-input-number v-model="createForm.insuranceAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="包装费(元)">
              <el-input-number v-model="createForm.packingAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优惠(元)">
              <el-input-number v-model="createForm.discountAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="订单备注">
              <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="请输入订单备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
  import { ref, reactive, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    getOrderList,
    getOrderDetail,
    createOrder,
    deleteOrder,
    deleteOrderByIds,
    changeOrderStatus,
    createOrderChange,
    auditOrderChange,
    createOrderIntercept,
    createOrderExceptionTicket
  } from '@/api/order/order'

  defineOptions({
    name: 'Order'
  })

  // ==================== 字典 ====================
  const orderStatusOptions = [
    { label: '待审核', value: 0 },
    { label: '待揽收', value: 1 },
    { label: '已揽收', value: 2 },
    { label: '运输中', value: 3 },
    { label: '派送中', value: 4 },
    { label: '已签收', value: 5 },
    { label: '已取消', value: 6 },
    { label: '已退回', value: 7 },
    { label: '异常', value: 8 }
  ]
  const channelOptions = [
    { label: '小程序', value: 1 },
    { label: 'APP', value: 2 },
    { label: '官网', value: 3 },
    { label: '接口对接', value: 4 },
    { label: '人工录入', value: 5 }
  ]
  const orderTypeOptions = [
    { label: '标准快递', value: 1 },
    { label: '加急件', value: 2 },
    { label: '经济件', value: 3 },
    { label: '同城配送', value: 4 }
  ]
  const payMethodOptions = [
    { label: '寄付现结', value: 1 },
    { label: '到付', value: 2 },
    { label: '月结', value: 3 }
  ]
  const goodsTypeOptions = [
    { label: '文件', value: 1 },
    { label: '日用品', value: 2 },
    { label: '数码产品', value: 3 },
    { label: '食品', value: 4 },
    { label: '其他', value: 5 }
  ]
  const feeTypeOptions = [
    { label: '运费', value: 1 },
    { label: '保价费', value: 2 },
    { label: '包装费', value: 3 },
    { label: '上楼费', value: 4 },
    { label: '超区费', value: 5 },
    { label: '优惠', value: 6 },
    { label: '其他', value: 7 }
  ]
  const settleStatusOptions = [
    { label: '未结算', value: 0 },
    { label: '已结算', value: 1 },
    { label: '已退款', value: 2 }
  ]
  const changeTypeOptions = [
    { label: '收件人信息', value: 1 },
    { label: '收件地址', value: 2 },
    { label: '货物信息', value: 3 },
    { label: '付款方式', value: 4 },
    { label: '预约时间', value: 5 }
  ]
  const changeStatusOptions = [
    { label: '待审核', value: 0 },
    { label: '已通过', value: 1 },
    { label: '已驳回', value: 2 }
  ]
  const interceptTypeOptions = [
    { label: '退回寄件人', value: 1 },
    { label: '拦截改址', value: 2 },
    { label: '暂扣网点', value: 3 },
    { label: '就地销毁', value: 4 }
  ]
  const interceptStatusOptions = [
    { label: '未拦截', value: 0 },
    { label: '拦截申请中', value: 1 },
    { label: '已拦截', value: 2 },
    { label: '拦截失败', value: 3 }
  ]
  const interceptHandleStatusOptions = [
    { label: '待处理', value: 0 },
    { label: '处理中', value: 1 },
    { label: '已拦截', value: 2 },
    { label: '拦截失败', value: 3 },
    { label: '已取消', value: 4 }
  ]
  const ticketTypeOptions = [
    { label: '咨询', value: 1 },
    { label: '投诉', value: 2 },
    { label: '退款', value: 3 },
    { label: '破损', value: 4 },
    { label: '丢失', value: 5 },
    { label: '延误', value: 6 },
    { label: '其他', value: 7 }
  ]
  const priorityOptions = [
    { label: '低', value: 1 },
    { label: '普通', value: 2 },
    { label: '高', value: 3 },
    { label: '紧急', value: 4 }
  ]
  const ticketStatusOptions = [
    { label: '待处理', value: 0 },
    { label: '处理中', value: 1 },
    { label: '已解决', value: 2 },
    { label: '已关闭', value: 3 }
  ]
  const changeSourceOptions = [
    { label: '客户', value: 1 },
    { label: '网点', value: 2 },
    { label: '客服', value: 3 },
    { label: '系统', value: 4 },
    { label: '后台', value: 5 }
  ]

  // ==================== 列表 ====================
  const searchForm = ref(null)
  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const tableData = ref([])
  const multipleSelection = ref([])
  const dateRange = ref([])
  const searchInfo = reactive({
    orderNo: '',
    waybillNo: '',
    receiverName: '',
    receiverMobile: '',
    orderStatus: null,
    channel: null,
    startTime: '',
    endTime: ''
  })

  const onSubmit = () => {
    page.value = 1
    searchInfo.startTime = dateRange.value && dateRange.value.length === 2 ? dateRange.value[0] : ''
    searchInfo.endTime = dateRange.value && dateRange.value.length === 2 ? dateRange.value[1] : ''
    getTableData()
  }

  const onReset = () => {
    searchInfo.orderNo = ''
    searchInfo.waybillNo = ''
    searchInfo.receiverName = ''
    searchInfo.receiverMobile = ''
    searchInfo.orderStatus = null
    searchInfo.channel = null
    searchInfo.startTime = ''
    searchInfo.endTime = ''
    dateRange.value = []
    page.value = 1
    getTableData()
  }

  const getTableData = async () => {
    const params = {
      page: page.value,
      pageSize: pageSize.value
    }
    Object.keys(searchInfo).forEach((key) => {
      const value = searchInfo[key]
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })
    const res = await getOrderList(params)
    if (res.code === 0) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  }

  const handleCurrentChange = (val) => {
    page.value = val
    getTableData()
  }

  const handleSizeChange = (val) => {
    pageSize.value = val
    getTableData()
  }

  const onSelectionChange = (val) => {
    multipleSelection.value = val
  }

  const onDelete = async (row) => {
    try {
      await ElMessageBox.confirm(`确定要删除订单「${row.orderNo}」吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch (e) {
      return
    }
    const res = await deleteOrder({ ID: row.ID })
    if (res.code === 0) {
      ElMessage.success('删除成功')
      getTableData()
    }
  }

  const onDeleteSelected = async () => {
    try {
      await ElMessageBox.confirm(`确定要删除选中的 ${multipleSelection.value.length} 条订单吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch (e) {
      return
    }
    const res = await deleteOrderByIds({ IDs: multipleSelection.value.map((item) => item.ID) })
    if (res.code === 0) {
      ElMessage.success('批量删除成功')
      getTableData()
    }
  }

  // ==================== 详情抽屉 ====================
  const drawerVisible = ref(false)
  const activeTab = ref('fee')
  const detail = reactive({
    order: {},
    feeList: [],
    changeList: [],
    interceptList: [],
    ticketList: [],
    statusLogs: [],
    allowedStatus: []
  })

  const resetDetail = () => {
    detail.order = {}
    detail.feeList = []
    detail.changeList = []
    detail.interceptList = []
    detail.ticketList = []
    detail.statusLogs = []
    detail.allowedStatus = []
  }

  const openDetail = async (row) => {
    resetDetail()
    activeTab.value = 'fee'
    drawerVisible.value = true
    const res = await getOrderDetail({ id: row.ID })
    if (res.code === 0) {
      Object.assign(detail, res.data)
    }
  }

  const refreshDetail = async () => {
    if (!detail.order.ID) return
    const res = await getOrderDetail({ id: detail.order.ID })
    if (res.code === 0) {
      Object.assign(detail, res.data)
    }
  }

  const handleRowClick = (row, column) => {
    if (column && column.type === 'selection') return
    openDetail(row)
  }

  const stepActive = computed(() => {
    const status = detail.order.orderStatus
    if (status >= 1 && status <= 5) return status - 1
    return 0
  })

  const allowedStatusOptions = computed(() => {
    const allowed = detail.allowedStatus || []
    return orderStatusOptions.filter((item) => allowed.includes(item.value))
  })

  // ==================== 状态流转 ====================
  const statusDialogVisible = ref(false)
  const submitting = ref(false)
  const statusForm = reactive({
    orderId: 0,
    targetStatus: null,
    changeSource: 5,
    remark: ''
  })

  const openStatusDialog = async (row) => {
    if (!row || !row.ID) return
    if (!detail.order.ID || detail.order.ID !== row.ID) {
      const res = await getOrderDetail({ id: row.ID })
      if (res.code !== 0) return
      Object.assign(detail, res.data)
    }
    statusForm.orderId = row.ID
    statusForm.targetStatus = null
    statusForm.changeSource = 5
    statusForm.remark = ''
    statusDialogVisible.value = true
  }

  const submitStatus = async () => {
    if (statusForm.targetStatus === null) {
      ElMessage.warning('请选择目标状态')
      return
    }
    submitting.value = true
    const res = await changeOrderStatus({ ...statusForm })
    submitting.value = false
    if (res.code === 0) {
      ElMessage.success('状态流转成功')
      statusDialogVisible.value = false
      getTableData()
      refreshDetail()
    }
  }

  // ==================== 发起改单 ====================
  const changeDialogVisible = ref(false)
  const changeForm = reactive({
    orderId: 0,
    changeType: 1,
    receiverName: '',
    receiverMobile: '',
    receiverProvince: '',
    receiverCity: '',
    receiverDistrict: '',
    receiverAddress: '',
    goodsName: '',
    packageNum: 1,
    weight: 0,
    payMethod: 1,
    expectPickupAt: null,
    reason: '',
    remark: ''
  })

  const openChangeDialog = () => {
    const order = detail.order
    changeForm.orderId = order.ID
    changeForm.changeType = 1
    changeForm.receiverName = order.receiverName || ''
    changeForm.receiverMobile = order.receiverMobile || ''
    changeForm.receiverProvince = order.receiverProvince || ''
    changeForm.receiverCity = order.receiverCity || ''
    changeForm.receiverDistrict = order.receiverDistrict || ''
    changeForm.receiverAddress = order.receiverAddress || ''
    changeForm.goodsName = order.goodsName || ''
    changeForm.packageNum = order.packageNum || 1
    changeForm.weight = order.weight || 0
    changeForm.payMethod = order.payMethod || 1
    changeForm.expectPickupAt = null
    changeForm.reason = ''
    changeForm.remark = ''
    changeDialogVisible.value = true
  }

  const submitChange = async () => {
    if (!changeForm.reason) {
      ElMessage.warning('请填写改单原因')
      return
    }
    submitting.value = true
    const res = await createOrderChange({ ...changeForm })
    submitting.value = false
    if (res.code === 0) {
      ElMessage.success('改单已提交，等待审核')
      changeDialogVisible.value = false
      activeTab.value = 'change'
      getTableData()
      refreshDetail()
    }
  }

  const onAuditChange = async (row, pass) => {
    let value = ''
    try {
      const result = await ElMessageBox.prompt(pass ? '请输入审核意见（可留空）' : '请输入驳回原因', '改单审核', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: pass ? '审核意见' : '驳回原因'
      })
      value = result.value || ''
    } catch (e) {
      return
    }
    const res = await auditOrderChange({ ID: row.ID, pass, auditRemark: value })
    if (res.code === 0) {
      ElMessage.success('审核成功')
      getTableData()
      refreshDetail()
    }
  }

  // ==================== 拦截退回 ====================
  const interceptDialogVisible = ref(false)
  const interceptForm = reactive({
    orderId: 0,
    interceptType: 1,
    reason: '',
    remark: ''
  })

  const openInterceptDialog = () => {
    interceptForm.orderId = detail.order.ID
    interceptForm.interceptType = 1
    interceptForm.reason = ''
    interceptForm.remark = ''
    interceptDialogVisible.value = true
  }

  const submitIntercept = async () => {
    if (!interceptForm.reason) {
      ElMessage.warning('请填写拦截原因')
      return
    }
    submitting.value = true
    const res = await createOrderIntercept({ ...interceptForm })
    submitting.value = false
    if (res.code === 0) {
      ElMessage.success('拦截申请已提交')
      interceptDialogVisible.value = false
      activeTab.value = 'intercept'
      getTableData()
      refreshDetail()
    }
  }

  // ==================== 异常工单 ====================
  const ticketDialogVisible = ref(false)
  const ticketForm = reactive({
    orderId: 0,
    ticketType: 1,
    priority: 2,
    title: '',
    description: ''
  })

  const openTicketDialog = () => {
    ticketForm.orderId = detail.order.ID
    ticketForm.ticketType = 1
    ticketForm.priority = 2
    ticketForm.title = ''
    ticketForm.description = ''
    ticketDialogVisible.value = true
  }

  const submitTicket = async () => {
    if (!ticketForm.title) {
      ElMessage.warning('请填写工单标题')
      return
    }
    submitting.value = true
    const res = await createOrderExceptionTicket({ ...ticketForm })
    submitting.value = false
    if (res.code === 0) {
      ElMessage.success('异常工单创建成功')
      ticketDialogVisible.value = false
      activeTab.value = 'ticket'
      refreshDetail()
    }
  }

  // ==================== 新建订单 ====================
  const createDialogVisible = ref(false)
  const createForm = reactive({
    customerName: '',
    channel: 1,
    orderType: 1,
    payMethod: 1,
    pickupNetworkName: '',
    deliveryNetworkName: '',
    senderName: '',
    senderMobile: '',
    senderRegion: '',
    senderAddress: '',
    receiverName: '',
    receiverMobile: '',
    receiverRegion: '',
    receiverAddress: '',
    goodsName: '',
    goodsType: 1,
    packageNum: 1,
    weight: 0,
    volume: 0,
    freightAmount: 0,
    insuranceAmount: 0,
    packingAmount: 0,
    discountAmount: 0,
    remark: ''
  })

  const openCreate = () => {
    Object.assign(createForm, {
      customerName: '',
      channel: 1,
      orderType: 1,
      payMethod: 1,
      pickupNetworkName: '',
      deliveryNetworkName: '',
      senderName: '',
      senderMobile: '',
      senderRegion: '',
      senderAddress: '',
      receiverName: '',
      receiverMobile: '',
      receiverRegion: '',
      receiverAddress: '',
      goodsName: '',
      goodsType: 1,
      packageNum: 1,
      weight: 0,
      volume: 0,
      freightAmount: 0,
      insuranceAmount: 0,
      packingAmount: 0,
      discountAmount: 0,
      remark: ''
    })
    createDialogVisible.value = true
  }

  const splitRegion = (region) => {
    if (!region) return { province: '', city: '', district: '' }
    const text = String(region).trim()
    const provinceMatch = text.match(/^(.+?(?:省|自治区|特别行政区))/)
    let rest = text
    let province = ''
    if (provinceMatch) {
      province = provinceMatch[1]
      rest = text.slice(province.length)
    }
    const cityMatch = rest.match(/^(.+?(?:市|自治州|地区|盟))/)
    let city = ''
    if (cityMatch) {
      city = cityMatch[1]
      rest = rest.slice(city.length)
    }
    return { province, city, district: rest }
  }

  const submitCreate = async () => {
    if (!createForm.receiverName || !createForm.receiverMobile || !createForm.receiverAddress) {
      ElMessage.warning('请完整填写收件人信息')
      return
    }
    const sender = splitRegion(createForm.senderRegion)
    const receiver = splitRegion(createForm.receiverRegion)
    const data = {
      customerName: createForm.customerName,
      channel: createForm.channel,
      orderType: createForm.orderType,
      payMethod: createForm.payMethod,
      pickupNetworkName: createForm.pickupNetworkName,
      deliveryNetworkName: createForm.deliveryNetworkName,
      senderName: createForm.senderName,
      senderMobile: createForm.senderMobile,
      senderProvince: sender.province,
      senderCity: sender.city,
      senderDistrict: sender.district,
      senderAddress: createForm.senderAddress,
      receiverName: createForm.receiverName,
      receiverMobile: createForm.receiverMobile,
      receiverProvince: receiver.province,
      receiverCity: receiver.city,
      receiverDistrict: receiver.district,
      receiverAddress: createForm.receiverAddress,
      goodsName: createForm.goodsName,
      goodsType: createForm.goodsType,
      packageNum: createForm.packageNum,
      weight: createForm.weight,
      volume: createForm.volume,
      freightAmount: createForm.freightAmount,
      insuranceAmount: createForm.insuranceAmount,
      packingAmount: createForm.packingAmount,
      discountAmount: createForm.discountAmount,
      remark: createForm.remark
    }
    submitting.value = true
    const res = await createOrder(data)
    submitting.value = false
    if (res.code === 0) {
      ElMessage.success('创建成功')
      createDialogVisible.value = false
      page.value = 1
      getTableData()
    }
  }

  // ==================== 通用方法 ====================
  const formatTime = (val) => {
    if (!val) return '-'
    const date = new Date(val)
    if (Number.isNaN(date.getTime())) return val
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const optionLabel = (options, value) => {
    const hit = options.find((item) => item.value === value)
    return hit ? hit.label : '-'
  }

  const statusText = (value) => optionLabel(orderStatusOptions, value)

  const statusTagType = (value) => {
    switch (value) {
      case 0:
        return 'info'
      case 1:
        return 'warning'
      case 2:
      case 3:
        return 'primary'
      case 4:
        return 'success'
      case 5:
        return 'success'
      case 6:
        return 'info'
      case 7:
        return 'danger'
      case 8:
        return 'danger'
      default:
        return 'info'
    }
  }

  const interceptStatusText = (value) => optionLabel(interceptStatusOptions, value)

  const changeStatusTagType = (value) => {
    if (value === 1) return 'success'
    if (value === 2) return 'danger'
    return 'warning'
  }

  const interceptHandleStatusTagType = (value) => {
    if (value === 2) return 'success'
    if (value === 3) return 'danger'
    if (value === 4) return 'info'
    return 'warning'
  }

  const priorityTagType = (value) => {
    if (value === 4) return 'danger'
    if (value === 3) return 'warning'
    return 'info'
  }

  const snapshotText = (val) => {
    if (!val) return '-'
    try {
      const data = JSON.parse(val)
      const parts = []
      if (data.receiverName) parts.push(data.receiverName)
      if (data.receiverMobile) parts.push(data.receiverMobile)
      if (data.receiverAddress) {
        parts.push(`${data.receiverProvince || ''}${data.receiverCity || ''}${data.receiverDistrict || ''}${data.receiverAddress}`)
      }
      if (data.goodsName) parts.push(`${data.goodsName} / ${data.packageNum || 0}件 / ${data.weight || 0}kg`)
      if (data.payMethod) parts.push(`付款方式:${optionLabel(payMethodOptions, data.payMethod)}`)
      if (data.expectPickupAt) parts.push(`预约:${formatTime(data.expectPickupAt)}`)
      return parts.length > 0 ? parts.join('；') : '-'
    } catch (e) {
      return val
    }
  }

  getTableData()
</script>

<style scoped>
  .sub-text {
    color: #909399;
    font-size: 12px;
  }

  .amount-text {
    color: #e6a23c;
    font-weight: 600;
  }

  .order-detail {
    padding: 0 8px 24px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }

  .detail-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .detail-order-no {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .detail-block {
    margin-top: 18px;
  }

  .block-title {
    position: relative;
    padding-left: 10px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .block-title::before {
    position: absolute;
    top: 2px;
    left: 0;
    width: 3px;
    height: 14px;
    content: '';
    background: #409eff;
    border-radius: 2px;
  }

  .detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 16px;
    margin-top: 16px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .tab-toolbar {
    margin-bottom: 10px;
  }

  .tab-summary {
    color: #606266;
    font-size: 13px;
  }

  .snapshot-text {
    color: #606266;
    font-size: 12px;
    line-height: 20px;
  }

  .empty-tip {
    padding: 24px 0;
    color: #909399;
  }
</style>
