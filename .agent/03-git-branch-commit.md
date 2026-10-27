# 03｜Git 分支与提交规范（Web）

> 归属总纲：[AGENT.MD](../AGENT.MD)
> 强制：所有 commit、分支、PR 行为以本文件为准

---

## 1. 分支模型

| 分支 | 命名 | 用途 | 合入方式 |
|------|------|------|----------|
| 主分支 | `main` | **只承载框架/基础设施类变更** | PR + 评审 |
| 需求分支 | `feature/xxx` | 新功能开发（页面、接口对接） | PR → `main` |
| 缺陷分支 | `fix/xxx` | 已提 Bug 单的修复 | PR → `main` |
| 紧急分支 | `hotfix/xxx` | 线上紧急修复（事后补编号） | PR → `main`（快速评审） |
| 优化分支 | `opt/xxx` | 性能/重构/代码质量 | PR → `main` |
| 文档分支 | `docs/xxx` | 文档变更 | PR → `main` |
| 测试分支 | `test/xxx` | 测试代码/用例 | PR → `main` |
| 发布分支 | `release/xxx` | 发布准备（版本冻结与回归） | PR → `main` |

**硬规则**
1. **禁止直接向 `main` 推送业务代码**；业务代码一律在分支完成并经 PR 合入。
2. 一个分支只做一件事，禁止"顺手改别的页面/别的模块"。
3. 分支基于最新 `main` 创建：`git switch main && git pull && git switch -c feature/xxx`。
4. 长期分支定期 `rebase main`，避免大规模冲突。

---

## 2. Commit 格式

```
[类型] [版本号] [需求/Bug编号] 描述
```

### 类型

| 类型 | 用途 |
|------|------|
| feat | 新增功能需求 |
| fix | 修复 Bug |
| hotfix | 线上紧急修复（来不及提 Bug 单，事后补） |
| opt | 项目优化（性能、代码质量、重构等） |
| docs | 文档变更 |
| test | 测试相关 |

### 必填规则

| 类型 | 版本号 | 编号 | 说明 |
|------|--------|------|------|
| feat | 必填 | 必填 | 新功能必须关联需求编号 |
| fix | 必填 | 必填 | Bug 修复必须关联 Bug 编号 |
| hotfix | 必填 | 可选 | 线上紧急修复，编号可事后补 |
| opt | 必填 | 可选 | 优化可以不关联编号 |
| docs | 可选 | 可选 | 文档变更可以都不带 |
| test | 可选 | 可选 | 测试相关可以都不带 |

### 示例

```
[feat] [v2.1.0] [#6974499249] 新增客服工单列表页与表单
[fix] [v2.1.0] [#6922369604] 修复工单详情缺少状态过滤条件
[hotfix] [v2.1.0] 修复线上菜单无法加载问题
[hotfix] [v2.1.0] [#6974499251] 修复线上页面白屏（事后补编号）
[opt] [v2.1.0] 优化工单列表首屏加载，表格改为分页懒加载
[opt] [v2.1.0] [#6974499250] 重构客服模块表单组件
[docs] 更新前端接口对接说明
[test] [v2.1.0] 补充工单表单校验用例
```

### 规则细节

- 描述使用**中文**，简洁明了，动词开头（新增/修复/优化/删除/调整）。
- 版本号格式：`v{主版本}.{次版本}.{修订号}`，如 `v2.1.0`。
- 编号格式：`#数字`（如 `#6974499249`）。
- **一次 commit 只包含一个类型**；混合变更拆分为多次 commit。
- **严禁整体提交**：禁止 `git add .` / `git add -A`；提交前先输出【变更文件清单】并逐文件确认。
- 禁止提交：`node_modules/`、`dist/`、`.env.*` 含密钥、日志、编辑器配置、临时文件。

---

## 3. 提交前自检（每次 commit 必做）

```bash
git status                       # 只看本次相关文件
git diff --stat                  # 确认无夹带
npm run build                    # 构建通过
npx eslint .                     # ESLint 通过（仓库无 lint 脚本）
git add <明确的文件路径>           # 逐文件暂存，禁止 git add .
git commit -m "[feat] [v2.1.0] [#编号] 描述"
```

---

## 4. 冲突解决方案（标准流程）

> 原则：以最新 `main` 为基线，用 rebase 保持线性历史；冲突解决后必须重新构建 + 页面验证，禁止"解决完就推"。

### 4.1 拉取阶段冲突（本地未推送）

```bash
git fetch origin
git rebase origin/main
# 冲突处理：
#   1) git status 查看冲突文件
#   2) 逐文件打开，按业务语义保留双方正确逻辑（禁止整文件覆盖）
#   3) 清除所有 <<<<<<< ======= >>>>>>> 标记
git add <解决后的文件>
git rebase --continue
# 方向错误时回退
git rebase --abort
```

### 4.2 推送被拒（远端有新提交）

```bash
git push origin feature/xxx        # 被拒：! [rejected] (fetch first)
git fetch origin
git pull --rebase origin feature/xxx
# 解决冲突 → add → rebase --continue
npm run build && npx eslint .
git push origin feature/xxx
```

### 4.3 已推送又需整理历史（谨慎）

```bash
# 仅限自己的功能分支，且已通知协作人
git fetch origin
git rebase -i origin/main                     # squash / reword
git push --force-with-lease origin feature/xxx # 禁止 --force，禁止对 main 使用
```

### 4.4 冲突解决硬规则

1. **禁止对 `main` 强推**（`--force` / `--force-with-lease` 均禁止）。
2. 禁止整文件覆盖（`--ours` / `--theirs`），必须逐文件判断业务语义。
3. 框架类文件冲突（`src/core/`、`utils/request.js`、路由守卫、`vite.config.js`、`package.json` 锁文件）：**停下来问**，由前端负责人裁决。
4. 冲突解决后必须：`npx eslint .` + `npm run build` + 关键页面浏览器验证，全绿才 push。
5. 解决不了的冲突保留现场（`git rebase --abort` 或建备份分支），禁止留下冲突标记。
6. 提交描述中注明"合并 main，解决 xxx 冲突"（如涉及他人代码）。

---

## 5. PR 规范

PR 标题与 commit 同格式：`[feat] [v2.1.0] [#6974499249] 新增客服工单管理页面`

PR 描述模板：

```markdown
## 变更类型
feat / fix / hotfix / opt / docs / test

## 关联编号
需求/Bug：#编号

## 变更文件清单
- src/api/cs.js
- src/view/cs/ticket.vue
- ...

## 实现说明
（页面结构、是否使用代码生成器、依赖的接口清单、菜单配置路径）

## 自测情况
- [ ] npx eslint . / npm run build / npm run dev 通过
- [ ] Apipost 接口核对通过（附截图）
- [ ] 浏览器页面 Console/Network 无报错，功能闭环（附截图）
- [ ] 回归测试通过
- [ ] 测试流已执行一轮：项目可正常启动、页面链路无报错（多轮回归按需自测，非阻断）

## 影响面与回滚
（影响页面、是否需同步后端菜单/字典、回滚方式）
```

**红线**：PR 未通过评审禁止合入 `main`；禁止把多个需求打包成一个 PR；涉及后端接口未就绪的页面禁止合入。
