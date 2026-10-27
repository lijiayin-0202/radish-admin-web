# 02｜目录分层与编码规范（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 核心：`view(页面) → api(接口) → utils/request`，骨架优先生成，人工只补业务

---

## 1. 分层职责

| 层 | 职责 | 允许 | 禁止 |
|----|------|------|------|
| `src/api/*.js` | 定义接口函数（url、method、参数） | `import service from '@/utils/request'`，url 不带 `/api` | 写业务逻辑、拼域名、加 `/api` 前缀 |
| `src/view/**.vue` | 页面：查询、表格、分页、表单弹窗、提示 | 调 api、格式化展示、权限控制 | 在页面里 new axios、硬编码接口地址 |
| `src/components/**` | 公共复用组件 | props/emit 解耦 | 依赖具体业务接口 |
| `src/pinia/modules/*` | 全局状态（user/router/dictionary/app/params） | 按既有模块扩展 | 存业务临时表单数据 |
| `src/utils/*` | 通用工具（request、format、date、dictionary、image） | 复用既有方法 | 新增与需求无关的工具函数 |
| `src/router/` | 静态路由装配 | 按既有规则新增 | 改动态路由生成逻辑 |

---

## 2. 命名规范

| 对象 | 规范 | 示例 |
|------|------|------|
| 接口文件 | 小写业务域名 | `cs.js`、`order.js` |
| 接口函数 | 与后端方法语义一致 | `getCsTicketList`、`createCsTicket` |
| 页面目录 | `src/view/<模块>/` | `src/view/cs/` |
| 页面文件 | `<资源>.vue`（生成器风格）或 `index.vue` + `form.vue` | `src/view/cs/ticket.vue` |
| 组件名 | 大驼峰，必须 `defineOptions({ name })` | `CsTicket` |
| 变量/方法 | 小驼峰，语义化 | `getTableData`、`pageSize` |
| 样式类 | 复用 `gva-*`，业务类语义化 + `scoped` | `.cs-ticket-search` |

---

## 3. api 层写法（对齐仓库现状）

```js
// src/api/cs.js
import service from '@/utils/request'

// 获取工单列表
export const getCsTicketList = (params) => {
  return service({
    url: '/cs/ticketList',
    method: 'get',
    params
  })
}

// 创建工单
export const createCsTicket = (data) => {
  return service({
    url: '/cs/ticket',
    method: 'post',
    data
  })
}
```

**规则**
1. `service` 是 `src/utils/request.js` 的**默认导出**，baseURL 已取 `VITE_BASE_API`（`/api`），**url 一律不带 `/api` 前缀**；baseURL **只指向 GVA 后台**，**禁止配置 Kratos 微服务 / DB / Kafka / pgvector 地址**，禁止第二个 axios 实例。
2. 一个接口一个函数，函数名与后端方法语义一致；保留后端 swagger 注释（`@Router`/`@Summary`，见 `src/api/customer.js` 风格）。
3. 静默请求（轮询、导出）可传 `donNotShowLoading: true` 关闭全局 loading。
4. 禁止在 api 层做字段转换、默认值填充、错误处理（拦截器已统一处理）。
5. 新增接口前必须确认后端已提供（swagger/契约），**禁止编造 url**。

---

## 4. 页面写法（Vue3 + `<script setup>`，沿用仓库骨架）

```vue
<template>
  <div>
    <div class="gva-table-box">
      <div class="gva-btn-list">
        <el-button type="primary" icon="plus" @click="openDialog">新增</el-button>
      </div>
      <el-table :data="tableData" row-key="ID" style="width: 100%">
        <el-table-column align="left" label="创建时间" width="180">
          <template #default="scope">
            <span>{{ formatDate(scope.row.CreatedAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="left" label="工单号" prop="ticketNo" width="160" />
        <el-table-column align="left" label="操作" min-width="160">
          <template #default="scope">
            <el-button type="primary" link icon="edit" @click="updateRow(scope.row)">编辑</el-button>
            <el-button type="primary" link icon="delete" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="gva-pagination">
        <el-pagination
          :current-page="page" :page-size="pageSize" :total="total"
          :page-sizes="[10, 30, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange" @size-change="handleSizeChange" />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { getCsTicketList, deleteCsTicket } from '@/api/cs'
  import { formatDate } from '@/utils/format'

  defineOptions({ name: 'CsTicket' })

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const tableData = ref([])

  const handleSizeChange = (val) => { pageSize.value = val; getTableData() }
  const handleCurrentChange = (val) => { page.value = val; getTableData() }

  const getTableData = async () => {
    const table = await getCsTicketList({ page: page.value, pageSize: pageSize.value })
    if (table.code === 0) {
      tableData.value = table.data.list
      total.value = table.data.total
      page.value = table.data.page
      pageSize.value = table.data.pageSize
    }
  }
  getTableData()

  const deleteRow = async (row) => {
    ElMessageBox.confirm('确定要删除吗?', '提示', { type: 'warning' }).then(async () => {
      const res = await deleteCsTicket({ ID: row.ID })
      if (res.code === 0) {
        ElMessage({ type: 'success', message: '删除成功' })
        if (tableData.value.length === 1 && page.value > 1) page.value--
        getTableData()
      }
    })
  }
</script>
```

**规则**
1. 成功判定统一 `res.code === 0`；失败由拦截器 `ElMessage.error(msg)` 统一提示，页面不重复弹错；401 自动跳登录。
2. 分页：传 `page/pageSize`，回写 `data.list/total/page/pageSize`；删除后若当前页空且 `page > 1` 则回退一页。
3. 必须 `defineOptions({ name: 'Xxx' })`——`vitePlugin/componentName` 靠它做 DOM 定位与组件名映射。
4. 时间/布尔/字典分别用 `@/utils/format` 的 `formatDate`、`formatBoolean`、`filterDict`，禁止各页重复实现。
5. 危险操作（删除/停用/批量）必须 `ElMessageBox.confirm` 二次确认。
6. 全局 loading 由 request 拦截器统一处理（>400ms 显示），轮询等静默请求加 `donNotShowLoading: true`。

---

## 5. 表单

- 仓库 GVA 风格：列表 + `el-drawer` 表单同页（见 `src/view/example/customer/customer.vue`）；也可拆 `el-dialog` + `form.vue`。
- 新增/编辑共用同一份 `form` 数据，用 `type`（create/update）或有无 `ID` 区分。
- `rules` 覆盖后端必填项，前端提示文案与后端一致；提交成功后关闭弹窗并刷新列表。
- 枚举选项取字典（`getDict(type)` / `filterDict(value, options)`）或后端返回说明，**禁止前端硬编码与后端不一致的枚举**。
- `ID`、`CreatedAt`、`UpdatedAt`、`DeletedAt` 等后端生成字段**不得出现在表单**中。

---

## 6. 路由与菜单

- 业务页面由**后端菜单管理**配置（`component` 指向 `src/view/<模块>/<资源>.vue`），前端不改动态路由逻辑。
- 仅新增静态页/异常页时才改 `src/router/index.js`（属 Ask）。
- 新建页面后必须在交付说明中写明菜单路径与按钮权限标识，否则视为未完成。

---

## 7. 代码生成优先（生成器入口固定）

1. 入口：**系统工具 → 代码生成器**（`src/view/systemTools/autoCode`，含 autoCodeAdmin、autoPkg、mcp）与**表单生成器**（`src/view/systemTools/formCreate`）。
2. 生成前：后端接口与字段已就绪（swagger 可查），字段类型与枚举明确。
3. 产物落点：`src/api/<模块>.js` + `src/view/<模块>/<资源>.vue`（必要时 `index.vue` + `form.vue`）。
4. 生成后：
   - 允许：补查询条件、补列展示与格式化、补字典映射、补权限控制、补交互细节。
   - 禁止：改生成器产物的目录结构、命名风格、删除标准方法、把骨架改造成私有写法。
5. 生成器覆盖不到的场景（图表、复杂联动、AI 检索结果展示、异步任务进度）人工补齐，写法与本文件一致。
6. 提交前必须 `npx eslint .` 与 `npm run build` 通过，禁止把生成器的调试代码带上。

---

## 8. 编码红线

1. 禁止在页面写业务逻辑"第二套规则"（状态流转、金额计算、权限判定）。
2. 禁止引入新依赖、新全局组件、新工具函数来解决局部问题（Ask 后方可）。
3. 禁止 `console.log` 残留、注释掉的大段代码、无编号 TODO。
4. 禁止硬编码接口地址、密钥、账号、环境域名、接口 `/api` 前缀。
5. 禁止大面积格式化/重构无关文件（"顺手改"）。
6. 样式必须 `scoped` 或用 UnoCSS 原子类，禁止全局污染（`src/style/` 改动属 Ask）。
