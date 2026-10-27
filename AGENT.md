# AGENT.MD ｜ 萝卜快跑 GVA 管理前端（radish-admin-web）

> 版本 v1.3.0 ｜ 更新日期 2026-10-27 ｜ 主分支 `main`，仓库 `radish-admin-web`（gin-vue-admin 2.9.2，Vue3 + Vite + Element Plus）｜ 本地前端 `8080`、代理后端 `8888`
> 定位：**顶层总契约 + 索引入口**。本文件只放红线与索引；细则按 `.agent/xx` 查，**不复述正文、不复制大段细则**。

---

## 0. 八条红线（违者即回退）

1. **技术栈锁定**：Vue3 + Vite + Element Plus + Pinia + UnoCSS；请求统一走 `src/utils/request.js`（axios 单例），禁止第二套 UI 库 / HTTP 客户端 / 状态库（`.agent/01 §1`）。
2. **底盘禁改**：`src/core/`、`src/utils/request.js`、`src/permission.js`、`src/pinia/modules/{user,router}.js`、`src/view/layout/` 禁止随意改动，确需改动单独 PR 评审（`.agent/00 §1`）。
3. **业务代码只在分支**：切 `feature/`、`fix/` 等分支走 PR；`main` 只收框架/基础设施类变更（`.agent/03 §1`）。
4. **commit 格式固定**：`[类型] [版本号] [编号] 描述`，一次 commit 一个类型；严禁 `git add .` / `git add -A` 整体提交（`.agent/03 §2`）。
5. **能生成的必须生成**：列表页、`api/*.js` 骨架走代码生成器（autoCode），表单走表单生成器（formCreate），人工只补业务，不改生成器产物（`.agent/02 §7`）。
6. **不编造、不拼错前缀**：接口 url **不带 `/api` 前缀**（baseURL 取 `VITE_BASE_API`），成功判定统一 `code === 0`，字段以后端 swagger 为准（`.agent/06 §1`、`§10`）。
7. **自测必须连真实 GVA 后端、测试流一轮跑通**：本地 lint/build/dev → Apipost 接口核对 → 浏览器页面验证 → 回归，**项目可正常启动、页面链路跑通无报错即可**；多轮回归由开发者按需自测，**不再强制、不作 PR 阻断**（`.agent/04 §1`）。
8. **架构红线：前端只对接 GVA 后台接口**：订单/行程/司机等 Kratos 微服务明细由 GVA 后台转发，**前端禁止直连 Kratos 微服务地址**；**DB、Kafka、pgvector、微服务地址禁止出现在前端代码、环境配置（`.env.*`）与请求封装里**；金额、时间、状态枚举以后端返回为准，**前端不做二次计算、不自造字典**；异步 Kafka 任务必须提供**状态轮询/刷新入口**（`.agent/01 §2`、`.agent/06 §7~§8`）。

> AI 行为红线与交付红线（不编造字段、不伪造数据、不提交敏感信息、不改底盘与生成物）见 `.agent/00 §3`、`.agent/04 §7`，**一律不放宽**。

---

## 1. 版本与效力顺序

- 效力顺序（**不变**）：`AGENT.MD` > 00 > 01 > 03 > 08 > 02 > 04 > 05 > 07 > 06；冲突以排位靠前为准，仍不确定 → 停手问负责人。
- 本仓库分册对照：08 开发流程 = `.agent/05-dev-workflow.md`；04 测试验收 = `.agent/04-testing-acceptance.md`；06 审查清单 = `.agent/00-permission-matrix-deliverables.md §3`（DoD）；无独立 05（安全）/07（冲突）分册，安全见 `.agent/00` 与 `.agent/04 §7`，冲突见 `.agent/03 §4`。

---

## 2. 文档分工清单（索引）

| 文件 | 作用 | 什么时候读 |
|------|------|------------|
| `.agent/00-permission-matrix-deliverables.md` | 文件权限矩阵（Always/Ask/Never）、真实命令、DoD 检查清单 | 动手前 / 交付前 |
| `.agent/01-tech-stack-structure.md` | 技术栈版本、后端全景、工程结构、环境变量、依赖 | 动任何代码前 |
| `.agent/02-layering-coding-standard.md` | api/view/pinia 分层、命名、页面与表单写法、代码生成 | 写页面/接口时 |
| `.agent/03-git-branch-commit.md` | 分支模型、commit 格式、冲突解决、PR 模板 | 提交/合码前 |
| `.agent/04-testing-acceptance.md` | 测试模型（四环节）、Apipost 核对、浏览器验证、判定标准 | 自测/验收 |
| `.agent/05-dev-workflow.md` | **Web 开发全流程唯一来源**：需求→方案→分支→生成→编码→自测→PR→发布→复盘 | 接需求时 |
| `.agent/06-api-contract-integration.md` | 返回结构、url 规则、分页、字段、字典、错误码、异步 | 对接接口时 |
| `.agent/07-ui-components.md` | Element Plus、UnoCSS、列表页骨架、按钮权限、样式 | 写 UI 时 |

---

## 3. 技术栈锁定（详见 `.agent/01`）

Vue 3.5 + Vite 8 + Element Plus 2.13 + Pinia 2 + vue-router 4 + axios 1.8.2 + UnoCSS；ESLint + Prettier。**JavaScript**（`jsconfig.json`，禁止改 TS）；前端不直连微服务/数据库。

---

## 4. 分支规则（`main` 白名单，详见 `.agent/03 §1`、`.agent/00 §1`）

- `main` **只收框架/基础设施类变更**；文件级权限（Always/Ask/Never）以 `.agent/00 §1` 矩阵为准。
- 业务一律 `feature/*`、`fix/*`、`hotfix/*`、`opt/*` 分支 + PR 合入；一个分支只做一件事；长期分支定期 rebase `main`。

---

## 5. Git 提交规范（详见 `.agent/03 §2`）

- 格式 `[类型] [版本号] [编号] 描述`；`feat`/`fix` 版本号与编号必填；一次 commit 只含一个类型。
- 逐文件 `git add`，**禁止 `git add .` / `git add -A`**；提交前输出【变更文件清单】。
- **PR 标题与 commit 同格式**；PR 描述模板中的【关联编号（需求/Bug：`#编号`）】为**必填项**（`.agent/03 §5`）。

---

## 6. Git 冲突流程（详见 `.agent/03 §4`）

`git fetch` → `git rebase origin/main` → 逐文件按业务语义解决 → `npx eslint .` + `npm run build` + 页面验证 → push；**禁止对 `main` 强推**，框架类文件冲突停下来问负责人。

---

## 7. 极简 Web 开发主流程（唯一来源 `.agent/05`）

| 步 | 动作 | 命令 / 产出 |
|----|------|-------------|
| 1 | 需求 + 方案 | 需求编号齐全 → 页面/接口清单 + 变更文件清单 |
| 2 | 建分支 | `git switch -c feature/xxx`（业务禁直推 `main`） |
| 3 | 代码生成 | autoCode（列表页 + `api/*.js`）/ formCreate（表单），不改生成产物 |
| 4 | 编码补齐 | 分层、命名、字段、权限、样式按 `.agent/02`、`.agent/06`、`.agent/07` |
| 5 | 自测 | 四环节 + 测试流一轮跑通，见 §9（细节 `.agent/04`） |
| 6 | 提交 → PR → 发布/回滚 → 复盘 | commit 与 PR 标题同格式、关联编号必填（§5）；PR 模板与发布回滚见 `.agent/03 §5`、`§8` |

- **逐步命令、模板、DoD 全部见 `.agent/05`**，本文件不复制长流程。

---

## 8. 编写规则要点（详见 `.agent/02`、`.agent/07`）

页面 `defineOptions({ name })`、成功判定 `res.code === 0`、分页 `page/pageSize`、字段与字典按后端契约、按钮权限 `v-auth`、列表页骨架与样式规范——**全部细则在 `.agent/02` / `.agent/07`，本文件不展开**。

---

## 9. 测试要求（四道关 + 测试流一轮，详见 `.agent/04`）

| 关卡 | 要求 |
|------|------|
| ① 真实 GVA 后端联调 | 连真实/联调 GVA 后台实测；**禁止伪造数据让页面"看起来正常"，禁止直连 Kratos 微服务** |
| ② 本地 lint & 构建 | `npx eslint .` / `npm run build` / `npm run dev` 全通过（仓库无 `npm run lint` 脚本） |
| ③ 接口联调用例 | Apipost 四类用例（正常/边界/异常/权限），字段与页面一致，截图存档 |
| ④ 浏览器会话验证 | Console/Network 无报错、功能闭环、1280×720 与 1920×1080 不破版 |
| ⑤ 测试流一轮跑通 | **执行一轮，项目可正常启动、页面链路跑通无报错即可**；多轮回归按需自测，**不再强制 3 轮、不作 PR 阻断** |

- ①~④ 为强制门禁；⑤ 只要求一轮链路跑通。落地细节与 DoD 见 `.agent/04 §1`、`§6` 与 `.agent/00 §3`。
- **硬阻断不变**：不执行验证、伪造数据、测试记录/截图缺失 → 视为未自测，PR BLOCK（`.agent/04 §7`）。

---

## 10. 常见任务速查

| 任务 | 入口 |
|------|------|
| 本地启动 / 构建 | `npm run dev`（8080）、`npm run build`、`npm run preview` |
| 代码检查 | `npx eslint .`（仓库无 `lint` 脚本），格式化按 `.prettierrc` |
| 新增列表页 | 系统工具 → 代码生成器（autoCode），产物 `src/view/<模块>/<资源>.vue` |
| 新增表单 | 系统工具 → 表单生成器（formCreate） |
| 对接新接口 | `.agent/06`，swagger 确认后写 `src/api/<模块>.js`（url 不带 `/api`） |
| 提交 / PR / 冲突 | `.agent/03 §2`、`§3`、`§4`、`§5` |
| 菜单与按钮权限 | 后端菜单管理配置 + `v-auth`（`.agent/07 §4`） |
| 交付自检 | `.agent/00 §3` |

---

## 11. 维护（变更约定）

- 本文件与 `.agent/` 细则冲突时，以本文件红线为准，并向提出人提示风险。
- 框架升级（GVA/Vite/Element Plus 版本、脚本、目录）后同步更新 `.agent/01` 与本文件头部版本号。
- 规则只在其权威文件里写：其他位置一律用 `.agent/xx §n` 引用，**禁止复制大段原文**，避免多处副本不同步。
