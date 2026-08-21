# Agent Note：Desktop 兼容性修复归入维护 fork

状态：已实现

[English](2026-08-21-maintained-fork-desktop-compatibility.md) | 中文

## 问题

DSH Desktop 曾用七个 pnpm patch 保存与已发布 Harness `0.1.0-rc.8` 包不同的行为。这些 patch 涵盖空用户 patch 文档、DeepSeek 流式 tool call 身份、重复沙箱提权、目录 view 携带文件专用范围、Workspace 拖放目标、Windows 受限 shell 隐藏窗口，以及 Desktop 原生目录选择器桥接。

只在消费侧保留这些修改，会在各次发布之间重复保存源码 diff，让测试离开所属 package，并导致每次 Harness 升级都要手工重制 patch。仅把 Git submodule 指向 fork，也不会改变 Desktop 实际安装的 package。

## 决策

维护中的 Harness fork 在各自源码 package 内拥有这七项行为，并把回归测试放在对应 package 旁：

- `dsh-app-boot` 将空或 null 的 YAML patch 文档视为空 patch 列表。
- `dsh-llm-deepseek` 保留流式 tool call 中最后一个非空 id 和函数名。
- `dsh-sandbox` 在调用已经具有 `danger-full-access` 时接受重复的较窄请求。
- `dsh-tool-str-replace-editor` 在列目录时忽略文件专用 `view_range`，并为文件 view 规范化空范围。
- `dsh-client-ui-workspace` 将 Workspace browser 根元素公开为 Desktop 文件夹拖放目标。
- `dsh-sandbox-windows-acl` 在两条受限进程创建路径中都使用 `STARTF_USESHOWWINDOW` 和 `SW_HIDE`。
- `dsh-client-ui-directory-picker-browse` 通过 Client injection 边界接收可选的原生选择和路径校验回调。

Desktop 仓库将该 fork 固定为 Git submodule。其安装流程先构建 fork，再把七个已构建的 `lib` 目录同步到 pnpm 安装出的每个匹配 package 实例。这样既保留发布 package 的解析图，也让 fork 成为这些维护行为的唯一源码来源。未来可以用自有 package registry 替换同步步骤，而无需把源码修改迁回 Desktop。

## 考虑过的替代方案

**继续使用 pnpm patch。** 这能保持 registry package 身份，但每次 Harness 发布都要重制消费侧 diff，测试也仍然位于源码 package 之外。

**直接链接 Harness workspace。** 这会跨越两个独立 workspace 的边界，并可能从第二棵依赖树解析 host-runtime peer。

**只用本地 tarball override 七个 package。** pack 能保留发布元数据，但 pnpm 的 optional-peer 解析仍可能同时保留 registry 和 `file:` 两种身份。经 aggregate `dsh` package 发起的沙箱调用已经证明 registry 实例仍可能被执行。

**立即发布到私有 registry。** 这是长期最干净的分发边界，但它需要当前仓库尚未具备的 registry 所有权、认证和发布自动化。

## 影响

- Harness 源码和 package 本地测试成为权威；Desktop 不再保存 DSH patch 文件。
- fork 仍是独立 submodule 和 pnpm workspace，并显式保留官方 `upstream` remote。
- Desktop 安装依赖后、执行测试、开发或打包前，必须运行 Harness 同步命令。
- 同步步骤只复制版本匹配的 package，并忽略 pnpm store 中旧版本的历史残留。
- 未来迁移到自有 registry 时只需移除同步步骤，不需要再次迁移源码。

## 验证

- Harness 针对性测试覆盖每项迁移行为，包括目录 `view_range` 数组、重复沙箱请求、两条 Windows 进程创建路径、空 YAML、流式 tool call continuation、Workspace 拖放目标和原生目录选择回调。
- Harness Host、Client library 构建和 contracts-ready 类型检查已通过迁移后的源码。
- Desktop 集成测试通过 aggregate 安装依赖图解析行为，并在同步后验证重复提权和目录列表行为。
- Desktop layout 检查会拒绝新的 `patches/dsh-*` 配置，并验证维护 fork 与官方 upstream remote。
