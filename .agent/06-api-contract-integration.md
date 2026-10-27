# 06｜接口契约与联调规范（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 覆盖：url 规则、返回结构、分页、字段、字典、错误码、异步与向量检索约定

---

## 1. 统一返回结构

```json
{
  "code": 0,
  "data": { "list": [], "total": 100, "page": 1, "pageSize": 10 },
  "msg": "获取成功"
}
```

- `src/utils/request.js` 响应拦截：`code === 0` 或响应头 `success === 'true'` 视为成功，直接返回 `response.data`（页面拿到的就是 `{ code, data, msg }`）。
- 失败：拦截器统一 `ElMessage.error(msg)`（msg 可能来自响应头 `decodeURI`），**页面不重复弹错**。
- 401：拦截器 `emitter.emit('show-error')` → 清 store 并跳登录，页面不自行处理。
- 列表接口取 `data.list` + `data.total`；详情接口 `data` 为对象（如 `data.ticket`）。

---

## 2. url 与 baseURL（最容易写错的一条）

- `request.js` 中 `config.baseURL = import.meta.env.VITE_BASE_API`（`.env.development` 为 `/api`）。
- 因此 api 文件 url **只写路径、不带 `/api`**：`url: '/cs/ticketList'`；禁止 `/api/cs/...`、禁止写域名/端口。
- 本地：`vite.config.js` 把 `/api` 代理到 `VITE_BASE_PATH:VITE_SERVER_PORT`（`http://127.0.0.1:8888`）并 rewrite 掉前缀；生产由 nginx 转发。
- 文件上传前缀 `VITE_FILE_API`（同为 `/api`）；`/plugin` 走插件市场代理。
- 请求头 `x-token`、`x-user-id` 由拦截器自动注入；响应头 `new-token` 自动续期，页面无需处理。

---

## 3. 分页约定（必须一致）

| 项 | 前端传参 | 后端返回 |
|----|----------|----------|
| 页码 | `page` | `data.page` |
| 每页条数 | `pageSize` | `data.pageSize` |
| 总条数 | — | `data.total` |
| 数据 | — | `data.list` |

- 默认传 `page=1, pageSize=10`；后端 `PageInfo` 会兜底，前端不要依赖兜底。
- 请求后回写 `page/pageSize/total`（后端可能纠正）；搜索条件变化按需求重置或保留页码。
- 删除后若当前页仅剩一条且 `page > 1`，回退一页再刷新。
- 禁止前端拉全量后本地分页（除非后端明确提供全量接口且数据量极小）。

---

## 4. 字段命名与类型

1. **框架固定字段为大驼峰**：`ID`、`CreatedAt`、`UpdatedAt`、`DeletedAt`（见 `src/view/example/customer/customer.vue` 中 `row.ID`、`scope.row.CreatedAt`）。
2. **业务字段小驼峰**：`ticketNo`、`passengerId`、`sessionStatus`。
3. 时间字段用 `@/utils/format` 的 `formatDate`（内部走 `utils/date` 的 `formatTimeToStr`），禁止各页自定义解析。
4. 金额按后端返回展示，禁止前端二次计算、禁止浮点运算。
5. 可空字段（指针字段）可能返回 `null`，必须空值兜底（`?? ''` / `v-if`），禁止直接取属性导致报错。
6. 软删除：删除后列表不再返回，前端不实现后端未提供的"回收站/恢复"。
7. 单号类字段（`ticketNo`、`sessionNo`）由后端生成，**创建表单不得出现这些输入框**。

---

## 5. 枚举与字典

- 状态、类型、优先级等展示**优先取字典**：`@/utils/dictionary` 的 `getDict(type)` 与 `src/pinia/modules/dictionary.js`。
- 表格中做值→标签转换用 `filterDict(value, options)`（支持层级 `children`）、`filterDataSource`、`formatBoolean`。
- 必须写映射表时：值域与后端注释完全一致并注明来源（字典名/接口），**禁止与后端不一致的自定义枚举**。
- 状态展示统一 `el-tag` 语义色，同一状态全系统配色一致。

---

## 6. 错误码与提示

| 场景 | 前端处理 |
|------|----------|
| `code !== 0` | 拦截器统一 `ElMessage.error(msg)`，页面不再处理 |
| 401/鉴权失效 | 拦截器清 store 并跳登录，页面不自行处理 |
| 403/无权限 | 提示"无权限"，按钮级权限提前隐藏（`v-auth`） |
| 5xx/网络异常 | 拦截器 `show-error` 提示，页面补"重试"入口 |
| 校验失败 | 展示后端 `msg`，并与前端 `rules` 保持一致 |

---

## 7. 与 Kratos 微服务的边界

1. 前端**禁止直连微服务**地址；所有数据经 GVA 后台接口获取。
2. 订单/行程/司机等明细只通过 `orderId` 等关联 ID 由后台接口返回聚合结果。
3. 字段变更以 proto + 后台接口契约为准，前端不解析 proto、不猜测字段。
4. 微服务超时/降级由后台返回明确错误，前端按第 6 节提示即可，禁止自动无限重试（防雪崩）。
5. **环境配置（`.env.*`）与请求封装同样禁止出现微服务、DB、Kafka、pgvector 地址**；金额、时间、状态枚举一律展示后端返回值，**前端不做二次计算、不自造字典**（见 §8 异步、§9 向量检索）。

---

## 8. 异步链路（Kafka）展示约定

- 导出、批量操作、向量化、通知推送为**最终一致**。
- 前端必须：提交后提示"已提交，处理中"，提供刷新按钮/轮询状态接口；禁止提示"操作成功"后数据未变化造成误解。
- 轮询请求加 `donNotShowLoading: true`，并有次数上限与退避，禁止无限高频轮询。
- 状态展示后端返回的枚举，禁止前端推断状态。

---

## 9. 向量检索（pgvector）结果展示

- 相似检索结果由后端返回，通常含 `score`（值越大越相似）。
- 前端展示：`score` 保留 2~4 位小数或按产品要求转百分比；排序**使用后端返回顺序**，禁止前端重排。
- 阈值、topK 由后端配置，前端不传、不硬编码。
- 检索为耗时操作：必须有 loading 态与超时提示，按钮防抖/禁用防连续触发。

---

## 10. 联调流程

1. **接口先行**：后端接口 swagger 可查后前端才对接；未就绪不得伪造数据宣称完成。
2. Apipost 建集合：按模块分组，环境变量区分本地/联调/测试（见 `.agent/04` 环节 2）。
3. 字段核对：逐字段比对响应与页面，命名（大驼峰框架字段/小驼峰业务字段）、类型、空值、枚举全部对齐。
4. 异常对齐：缺参、非法值、无权限、token 失效的表现与提示文案统一。
5. 变更同步：接口字段/枚举变更必须同步前端，PR 中注明"依赖后端接口版本"。

---

## 11. 契约红线

1. 禁止编造 url、字段、错误码；不确定先看 swagger 或问后端。
2. 禁止在 api 层或页面里写 `/api` 前缀、域名、端口。
3. 禁止缓存/伪造后端数据以"通过演示"。
4. 禁止把 `ID`、单号、时间戳等后端生成值放在前端生成。
5. 禁止前端定义与后端不一致的状态流转与业务规则。
6. 禁止对失败接口做无限自动重试。
