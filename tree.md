# internal 文件树说明

- 说明：按目录列出 `internal/` 下的全部文件，并给出一句话职责说明。
- 约定：大量 `testdata` / `*.golden` / 样例文件采用模式化描述；核心运行时代码单独精确说明。
- 统计：共整理 `808` 个文件。

## `internal/agent`

- 目录作用：Agent 编排核心，负责运行时会话、模型与工具装配、sub-agent 与 hook 拦截。

- `.env.sample`: 配置、样例或静态资源文件。
- `agent.go`: 会话级 agent 核心，实现 prompt 准备、消息落库、流式回调、队列、取消与自动摘要。
- `agent_test.go`: 针对 `agent.go` 的测试与回归用例。
- `agent_tool.go`: 实现 `agent_tool` 相关逻辑。
- `agentic_fetch_tool.go`: 实现 `agentic_fetch_tool` 相关逻辑。
- `common_test.go`: 该目录下相关逻辑的测试文件。
- `convert_test.go`: 该目录下相关逻辑的测试文件。
- `coordinator.go`: agent 协调层，负责模型刷新、工具构建、provider 重试、运行入口与 sub-agent 调度。
- `coordinator_test.go`: 针对 `coordinator.go` 的测试与回归用例。
- `errors.go`: 实现 `errors` 相关逻辑。
- `event.go`: 实现 `event` 相关逻辑。
- `hooked_tool.go`: 为顶层工具注入 PreToolUse hook 拦截逻辑。
- `hooked_tool_test.go`: 针对 `hooked_tool.go` 的测试与回归用例。
- `loop_detection.go`: 实现 `loop_detection` 相关逻辑。
- `loop_detection_test.go`: 针对 `loop_detection.go` 的测试与回归用例。
- `prompts.go`: 实现 `prompts` 相关逻辑。

## `internal/agent/hyper`

- 目录作用：Hyper provider 的辅助逻辑。

- `provider.go`: 实现 `provider` 相关逻辑。
- `provider.json`: 配置、样例或静态资源文件。

## `internal/agent/notify`

- 目录作用：Agent 完成、重认证等通知事件定义。

- `notify.go`: 实现 `notify` 相关逻辑。

## `internal/agent/prompt`

- 目录作用：System prompt 的模板构建与上下文注入。

- `prompt.go`: 实现 `prompt` 相关逻辑。

## `internal/agent/templates`

- 目录作用：Agent 使用的 system prompt 模板文件。

- `agent_tool.md`: 该目录相关的说明文档。
- `agentic_fetch.md`: 该目录相关的说明文档。
- `agentic_fetch_prompt.md.tpl`: 用于生成 `agentic_fetch_prompt.md` 内容的 Go 模板文件。
- `coder.md.tpl`: 用于生成 `coder.md` 内容的 Go 模板文件。
- `initialize.md.tpl`: 用于生成 `initialize.md` 内容的 Go 模板文件。
- `summary.md`: 该目录相关的说明文档。
- `task.md.tpl`: 用于生成 `task.md` 内容的 Go 模板文件。
- `title.md`: 该目录相关的说明文档。

## `internal/agent/testdata/TestCoderAgent/glm-5.1`

- 目录作用：包含 `glm-5.1` 相关实现或资源。

- `bash_tool.yaml`: 测试数据/夹具文件。
- `download_tool.yaml`: 测试数据/夹具文件。
- `fetch_tool.yaml`: 测试数据/夹具文件。
- `glob_tool.yaml`: 测试数据/夹具文件。
- `grep_tool.yaml`: 测试数据/夹具文件。
- `ls_tool.yaml`: 测试数据/夹具文件。
- `multiedit_tool.yaml`: 测试数据/夹具文件。
- `parallel_tool_calls.yaml`: 测试数据/夹具文件。
- `read_a_file.yaml`: 测试数据/夹具文件。
- `simple_test.yaml`: 测试数据/夹具文件。
- `sourcegraph_tool.yaml`: 测试数据/夹具文件。
- `update_a_file.yaml`: 测试数据/夹具文件。
- `write_tool.yaml`: 测试数据/夹具文件。

## `internal/agent/tools`

- 目录作用：内置工具实现与工具描述文档。

- `bash.go`: 内置工具 `bash` 的实现或辅助逻辑。
- `bash.tpl`: 用于生成 `bash` 内容的 Go 模板文件。
- `bash_test.go`: 针对 `bash.go` 的测试与回归用例。
- `context_test.go`: 该目录下相关逻辑的测试文件。
- `crush_info.go`: 内置工具 `crush_info` 的实现或辅助逻辑。
- `crush_info.md`: 该目录相关的说明文档。
- `crush_info_test.go`: 针对 `crush_info.go` 的测试与回归用例。
- `crush_logs.go`: 内置工具 `crush_logs` 的实现或辅助逻辑。
- `crush_logs.md`: 该目录相关的说明文档。
- `crush_logs_test.go`: 针对 `crush_logs.go` 的测试与回归用例。
- `diagnostics.go`: 内置工具 `diagnostics` 的实现或辅助逻辑。
- `diagnostics.md`: 该目录相关的说明文档。
- `download.go`: 内置工具 `download` 的实现或辅助逻辑。
- `download.md`: 该目录相关的说明文档。
- `edit.go`: 内置工具 `edit` 的实现或辅助逻辑。
- `edit.md`: 该目录相关的说明文档。
- `fetch.go`: 内置工具 `fetch` 的实现或辅助逻辑。
- `fetch.md`: 该目录相关的说明文档。
- `fetch_helpers.go`: 内置工具 `fetch_helpers` 的实现或辅助逻辑。
- `fetch_types.go`: 内置工具 `fetch_types` 的实现或辅助逻辑。
- `glob.go`: 内置工具 `glob` 的实现或辅助逻辑。
- `glob.md`: 该目录相关的说明文档。
- `grep.go`: 内置工具 `grep` 的实现或辅助逻辑。
- `grep.md`: 该目录相关的说明文档。
- `grep_test.go`: 针对 `grep.go` 的测试与回归用例。
- `job_kill.go`: 内置工具 `job_kill` 的实现或辅助逻辑。
- `job_kill.md`: 该目录相关的说明文档。
- `job_output.go`: 内置工具 `job_output` 的实现或辅助逻辑。
- `job_output.md`: 该目录相关的说明文档。
- `job_test.go`: 该目录下相关逻辑的测试文件。
- `list_mcp_resources.go`: 内置工具 `list_mcp_resources` 的实现或辅助逻辑。
- `list_mcp_resources.md`: 该目录相关的说明文档。
- `ls.go`: 内置工具 `ls` 的实现或辅助逻辑。
- `ls.md`: 该目录相关的说明文档。
- `lsp_restart.go`: 内置工具 `lsp_restart` 的实现或辅助逻辑。
- `lsp_restart.md`: 该目录相关的说明文档。
- `mcp-tools.go`: 内置工具 `mcp-tools` 的实现或辅助逻辑。
- `multiedit.go`: 内置工具 `multiedit` 的实现或辅助逻辑。
- `multiedit.md`: 该目录相关的说明文档。
- `multiedit_test.go`: 针对 `multiedit.go` 的测试与回归用例。
- `read_mcp_resource.go`: 内置工具 `read_mcp_resource` 的实现或辅助逻辑。
- `read_mcp_resource.md`: 该目录相关的说明文档。
- `references.go`: 内置工具 `references` 的实现或辅助逻辑。
- `references.md`: 该目录相关的说明文档。
- `rg.go`: 内置工具 `rg` 的实现或辅助逻辑。
- `safe.go`: 内置工具 `safe` 的实现或辅助逻辑。
- `search.go`: 内置工具 `search` 的实现或辅助逻辑。
- `sourcegraph.go`: 内置工具 `sourcegraph` 的实现或辅助逻辑。
- `sourcegraph.md`: 该目录相关的说明文档。
- `todos.go`: 内置工具 `todos` 的实现或辅助逻辑。
- `todos.md`: 该目录相关的说明文档。
- `tools.go`: 内置工具 `tools` 的实现或辅助逻辑。
- `view.go`: 内置工具 `view` 的实现或辅助逻辑。
- `view.md`: 该目录相关的说明文档。
- `view_test.go`: 针对 `view.go` 的测试与回归用例。
- `web_fetch.go`: 内置工具 `web_fetch` 的实现或辅助逻辑。
- `web_fetch.md`: 该目录相关的说明文档。
- `web_search.go`: 内置工具 `web_search` 的实现或辅助逻辑。
- `web_search.md`: 该目录相关的说明文档。
- `write.go`: 内置工具 `write` 的实现或辅助逻辑。
- `write.md`: 该目录相关的说明文档。

## `internal/agent/tools/mcp`

- 目录作用：MCP client/tool 的接入、状态管理与测试。

- `init.go`: 内置工具 `init` 的实现或辅助逻辑。
- `init_test.go`: 针对 `init.go` 的测试与回归用例。
- `prompts.go`: 内置工具 `prompts` 的实现或辅助逻辑。
- `resources.go`: 内置工具 `resources` 的实现或辅助逻辑。
- `tools.go`: 内置工具 `tools` 的实现或辅助逻辑。
- `tools_test.go`: 针对 `tools.go` 的测试与回归用例。

## `internal/agent/tools/testdata`

- 目录作用：包含 `testdata` 相关实现或资源。

- `grep.txt`: 测试数据/夹具文件。

## `internal/ansiext`

- 目录作用：包含 `ansiext` 相关实现或资源。

- `ansi.go`: 实现 `ansi` 相关逻辑。

## `internal/app`

- 目录作用：应用级装配层，连接配置、DB、agent、LSP、MCP、事件与生命周期。

- `app.go`: 应用主装配点，初始化服务、agent、LSP、MCP、事件订阅与整体生命周期。
- `app_test.go`: 针对 `app.go` 的测试与回归用例。
- `lsp_events.go`: 实现 `lsp_events` 相关逻辑。
- `provider.go`: 实现 `provider` 相关逻辑。
- `provider_test.go`: 针对 `provider.go` 的测试与回归用例。
- `resolve_session_test.go`: 该目录下相关逻辑的测试文件。

## `internal/backend`

- 目录作用：面向 server/client 模式的后端服务接口。

- `agent.go`: 面向 server 的 agent 相关后端接口。
- `backend.go`: 实现 `backend` 相关逻辑。
- `config.go`: 实现 `config` 相关逻辑。
- `events.go`: 工作区事件订阅、LSP 状态读取与后端侧辅助接口。
- `filetracker.go`: 实现 `filetracker` 相关逻辑。
- `permission.go`: 实现 `permission` 相关逻辑。
- `session.go`: 实现 `session` 相关逻辑。
- `util.go`: 实现 `util` 相关逻辑。

## `internal/client`

- 目录作用：包含 `client` 相关实现或资源。

- `client.go`: 实现 `client` 相关逻辑。
- `config.go`: 实现 `config` 相关逻辑。
- `dial_other.go`: 实现 `dial_other` 相关逻辑。
- `dial_windows.go`: 实现 `dial_windows` 相关逻辑。
- `proto.go`: 实现 `proto` 相关逻辑。

## `internal/cmd`

- 目录作用：CLI 命令入口与参数解析。

- `dirs.go`: 实现 `dirs` 相关逻辑。
- `dirs_test.go`: 针对 `dirs.go` 的测试与回归用例。
- `login.go`: 实现 `login` 相关逻辑。
- `logs.go`: 实现 `logs` 相关逻辑。
- `models.go`: 实现 `models` 相关逻辑。
- `projects.go`: 实现 `projects` 相关逻辑。
- `projects_test.go`: 针对 `projects.go` 的测试与回归用例。
- `root.go`: CLI 根命令定义。
- `root_other.go`: 实现 `root_other` 相关逻辑。
- `root_windows.go`: 实现 `root_windows` 相关逻辑。
- `run.go`: 非交互运行入口。
- `schema.go`: 实现 `schema` 相关逻辑。
- `schema_test.go`: 针对 `schema.go` 的测试与回归用例。
- `server.go`: 实现 `server` 相关逻辑。
- `server_other.go`: 实现 `server_other` 相关逻辑。
- `server_windows.go`: 实现 `server_windows` 相关逻辑。
- `session.go`: 实现 `session` 相关逻辑。
- `stats.go`: 实现 `stats` 相关逻辑。
- `update_providers.go`: 实现 `update_providers` 相关逻辑。

## `internal/cmd/gitignore`

- 目录作用：包含 `gitignore` 相关实现或资源。

- `default`: 辅助文件或测试样本。
- `old`: 辅助文件或测试样本。

## `internal/cmd/stats`

- 目录作用：包含 `stats` 相关实现或资源。

- `AGENTS.md`: 该目录相关的说明文档。
- `footer.svg`: UI 图标或静态资源文件。
- `header.svg`: UI 图标或静态资源文件。
- `heartbit.svg`: UI 图标或静态资源文件。
- `index.css`: 配置、样例或静态资源文件。
- `index.html`: 配置、样例或静态资源文件。
- `index.js`: 配置、样例或静态资源文件。

## `internal/commands`

- 目录作用：包含 `commands` 相关实现或资源。

- `commands.go`: 实现 `commands` 相关逻辑。
- `commands_test.go`: 针对 `commands.go` 的测试与回归用例。

## `internal/config`

- 目录作用：配置结构、加载、校验、合并与 provider/model 解析。

- `agent_id_test.go`: 该目录下相关逻辑的测试文件。
- `attribution_migration_test.go`: 该目录下相关逻辑的测试文件。
- `catwalk.go`: 实现 `catwalk` 相关逻辑。
- `catwalk_test.go`: 针对 `catwalk.go` 的测试与回归用例。
- `config.go`: 配置主结构与各子配置类型定义。
- `copilot.go`: 实现 `copilot` 相关逻辑。
- `docker_mcp.go`: 实现 `docker_mcp` 相关逻辑。
- `docker_mcp_test.go`: 针对 `docker_mcp.go` 的测试与回归用例。
- `hyper.go`: 实现 `hyper` 相关逻辑。
- `hyper_test.go`: 针对 `hyper.go` 的测试与回归用例。
- `init.go`: 实现 `init` 相关逻辑。
- `load.go`: 配置加载、归一化与校验逻辑。
- `load_bench_test.go`: 该目录下相关逻辑的测试文件。
- `load_test.go`: 针对 `load.go` 的测试与回归用例。
- `lsp_defaults_test.go`: 该目录下相关逻辑的测试文件。
- `provider.go`: provider 与模型选择/解析辅助。
- `provider_empty_test.go`: 该目录下相关逻辑的测试文件。
- `provider_test.go`: 针对 `provider.go` 的测试与回归用例。
- `recent_models_test.go`: 该目录下相关逻辑的测试文件。
- `reload_hooks_test.go`: 该目录下相关逻辑的测试文件。
- `resolve.go`: 实现 `resolve` 相关逻辑。
- `resolve_test.go`: 针对 `resolve.go` 的测试与回归用例。
- `scope.go`: 实现 `scope` 相关逻辑。
- `store.go`: 实现 `store` 相关逻辑。
- `store_test.go`: 针对 `store.go` 的测试与回归用例。

## `internal/csync`

- 目录作用：并发安全的小型容器封装。

- `doc.go`: 该包的包级文档。
- `maps.go`: 实现 `maps` 相关逻辑。
- `maps_test.go`: 针对 `maps.go` 的测试与回归用例。
- `slices.go`: 实现 `slices` 相关逻辑。
- `slices_test.go`: 针对 `slices.go` 的测试与回归用例。
- `value.go`: 实现 `value` 相关逻辑。
- `value_test.go`: 针对 `value.go` 的测试与回归用例。
- `versionedmap.go`: 实现 `versionedmap` 相关逻辑。
- `versionedmap_test.go`: 针对 `versionedmap.go` 的测试与回归用例。

## `internal/db`

- 目录作用：sqlc 生成代码与数据库访问封装。

- `connect.go`: 实现 `connect` 相关逻辑。
- `connect_modernc.go`: 实现 `connect_modernc` 相关逻辑。
- `connect_ncruces.go`: 实现 `connect_ncruces` 相关逻辑。
- `db.go`: 实现 `db` 相关逻辑。
- `files.sql.go`: 实现 `files.sql` 相关逻辑。
- `messages.sql.go`: 实现 `messages.sql` 相关逻辑。
- `models.go`: 实现 `models` 相关逻辑。
- `querier.go`: 实现 `querier` 相关逻辑。
- `read_files.sql.go`: 实现 `read_files.sql` 相关逻辑。
- `sessions.sql.go`: 实现 `sessions.sql` 相关逻辑。
- `stats.sql.go`: 实现 `stats.sql` 相关逻辑。

## `internal/db/migrations`

- 目录作用：SQLite schema 迁移文件。

- `20250424200609_initial.sql`: 数据库迁移脚本。
- `20250515105448_add_summary_message_id.sql`: 数据库迁移脚本。
- `20250624000000_add_created_at_indexes.sql`: 数据库迁移脚本。
- `20250627000000_add_provider_to_messages.sql`: 数据库迁移脚本。
- `20250810000000_add_is_summary_message.sql`: 数据库迁移脚本。
- `20250812000000_add_todos_to_sessions.sql`: 数据库迁移脚本。
- `20260127000000_add_read_files_table.sql`: 数据库迁移脚本。

## `internal/db/sql`

- 目录作用：供 sqlc 使用的 SQL 查询定义。

- `files.sql`: 供 sqlc 或数据库层使用的 SQL 定义。
- `messages.sql`: 供 sqlc 或数据库层使用的 SQL 定义。
- `read_files.sql`: 供 sqlc 或数据库层使用的 SQL 定义。
- `sessions.sql`: 供 sqlc 或数据库层使用的 SQL 定义。
- `stats.sql`: 供 sqlc 或数据库层使用的 SQL 定义。

## `internal/diff`

- 目录作用：包含 `diff` 相关实现或资源。

- `diff.go`: 实现 `diff` 相关逻辑。

## `internal/diffdetect`

- 目录作用：包含 `diffdetect` 相关实现或资源。

- `detect.go`: 实现 `detect` 相关逻辑。
- `detect_test.go`: 针对 `detect.go` 的测试与回归用例。

## `internal/env`

- 目录作用：包含 `env` 相关实现或资源。

- `env.go`: 实现 `env` 相关逻辑。
- `env_test.go`: 针对 `env.go` 的测试与回归用例。

## `internal/event`

- 目录作用：事件埋点与遥测。

- `all.go`: 实现 `all` 相关逻辑。
- `event.go`: 实现 `event` 相关逻辑。
- `event_test.go`: 针对 `event.go` 的测试与回归用例。
- `identifier.go`: 实现 `identifier` 相关逻辑。
- `logger.go`: 实现 `logger` 相关逻辑。

## `internal/filepathext`

- 目录作用：路径处理辅助函数。

- `filepath.go`: 实现 `filepath` 相关逻辑。

## `internal/filetracker`

- 目录作用：跟踪 session 对文件的读写接触记录。

- `service.go`: 实现 `service` 相关逻辑。
- `service_test.go`: 针对 `service.go` 的测试与回归用例。

## `internal/format`

- 目录作用：终端格式化与 spinner 等输出辅助。

- `spinner.go`: 实现 `spinner` 相关逻辑。

## `internal/fsext`

- 目录作用：文件系统相关辅助函数。

- `drive_other.go`: 实现 `drive_other` 相关逻辑。
- `drive_windows.go`: 实现 `drive_windows` 相关逻辑。
- `expand.go`: 实现 `expand` 相关逻辑。
- `fileutil.go`: 实现 `fileutil` 相关逻辑。
- `fileutil_test.go`: 针对 `fileutil.go` 的测试与回归用例。
- `ignore_test.go`: 该目录下相关逻辑的测试文件。
- `lookup.go`: 实现 `lookup` 相关逻辑。
- `lookup_test.go`: 针对 `lookup.go` 的测试与回归用例。
- `ls.go`: 实现 `ls` 相关逻辑。
- `ls_test.go`: 针对 `ls.go` 的测试与回归用例。
- `owner_others.go`: 实现 `owner_others` 相关逻辑。
- `owner_windows.go`: 实现 `owner_windows` 相关逻辑。
- `paste.go`: 实现 `paste` 相关逻辑。
- `paste_test.go`: 针对 `paste.go` 的测试与回归用例。

## `internal/history`

- 目录作用：会话历史文件记录与查询。

- `file.go`: 实现 `file` 相关逻辑。

## `internal/home`

- 目录作用：用户目录/配置目录定位辅助。

- `home.go`: 实现 `home` 相关逻辑。
- `home_test.go`: 针对 `home.go` 的测试与回归用例。

## `internal/hooks`

- 目录作用：自定义 hook 事件、输入输出协议与执行器。

- `hooks.go`: hook 事件、决策类型与聚合逻辑。
- `hooks_test.go`: 针对 `hooks.go` 的测试与回归用例。
- `input.go`: hook stdin/env 协议构建与 stdout 解析。
- `runner.go`: hook 执行器，负责匹配、并发运行、超时与结果聚合。

## `internal/log`

- 目录作用：日志初始化、HTTP 调试日志等通用日志能力。

- `http.go`: 实现 `http` 相关逻辑。
- `http_test.go`: 针对 `http.go` 的测试与回归用例。
- `log.go`: 实现 `log` 相关逻辑。

## `internal/lsp`

- 目录作用：LSP manager 与 client 实现。

- `client.go`: 实现 `client` 相关逻辑。
- `client_test.go`: 针对 `client.go` 的测试与回归用例。
- `handlers.go`: 实现 `handlers` 相关逻辑。
- `manager.go`: LSP manager，按文件类型懒启动/停止语言服务器并维护 client 状态。
- `manager_test.go`: 针对 `manager.go` 的测试与回归用例。

## `internal/lsp/util`

- 目录作用：包含 `util` 相关实现或资源。

- `edit.go`: 实现 `edit` 相关逻辑。
- `edit_test.go`: 针对 `edit.go` 的测试与回归用例。

## `internal/message`

- 目录作用：消息模型、分片内容类型与持久化服务。

- `attachment.go`: 实现 `attachment` 相关逻辑。
- `content.go`: 消息内容分片定义，以及 Message 到 AI 协议消息的转换逻辑。
- `content_test.go`: 针对 `content.go` 的测试与回归用例。
- `message.go`: 消息服务实现，负责消息的增删改查与事件发布。

## `internal/oauth`

- 目录作用：OAuth 通用流程与各 provider 集成。

- `token.go`: 实现 `token` 相关逻辑。

## `internal/oauth/copilot`

- 目录作用：GitHub Copilot OAuth 与请求辅助。

- `client.go`: 实现 `client` 相关逻辑。
- `disk.go`: 实现 `disk` 相关逻辑。
- `http.go`: 实现 `http` 相关逻辑。
- `oauth.go`: 实现 `oauth` 相关逻辑。
- `urls.go`: 实现 `urls` 相关逻辑。

## `internal/oauth/hyper`

- 目录作用：包含 `hyper` 相关实现或资源。

- `device.go`: 实现 `device` 相关逻辑。

## `internal/permission`

- 目录作用：工具权限请求、持久授权与 hook 预授权。

- `permission.go`: 实现 `permission` 相关逻辑。
- `permission_test.go`: 针对 `permission.go` 的测试与回归用例。

## `internal/projects`

- 目录作用：包含 `projects` 相关实现或资源。

- `projects.go`: 实现 `projects` 相关逻辑。
- `projects_test.go`: 针对 `projects.go` 的测试与回归用例。

## `internal/proto`

- 目录作用：包含 `proto` 相关实现或资源。

- `agent.go`: 实现 `agent` 相关逻辑。
- `history.go`: 实现 `history` 相关逻辑。
- `mcp.go`: 实现 `mcp` 相关逻辑。
- `message.go`: 实现 `message` 相关逻辑。
- `permission.go`: 实现 `permission` 相关逻辑。
- `proto.go`: 实现 `proto` 相关逻辑。
- `requests.go`: 实现 `requests` 相关逻辑。
- `server.go`: 实现 `server` 相关逻辑。
- `session.go`: 实现 `session` 相关逻辑。
- `tools.go`: 实现 `tools` 相关逻辑。
- `version.go`: 实现 `version` 相关逻辑。

## `internal/pubsub`

- 目录作用：进程内发布订阅基础设施。

- `broker.go`: 实现 `broker` 相关逻辑。
- `events.go`: 实现 `events` 相关逻辑。

## `internal/server`

- 目录作用：HTTP server/controller 与对外 API 接线。

- `config.go`: 实现 `config` 相关逻辑。
- `events.go`: 实现 `events` 相关逻辑。
- `logging.go`: 实现 `logging` 相关逻辑。
- `net_other.go`: 实现 `net_other` 相关逻辑。
- `net_windows.go`: 实现 `net_windows` 相关逻辑。
- `proto.go`: HTTP API controller，暴露 workspace/session/agent 等 REST 接口。
- `server.go`: 实现 `server` 相关逻辑。

## `internal/session`

- 目录作用：会话模型、任务子会话、todo 与持久化服务。

- `session.go`: 会话服务核心，负责创建/保存/删除会话、task session 与 todo 持久化。

## `internal/shell`

- 目录作用：Shell 执行、后台任务与终端交互。

- `background.go`: 实现 `background` 相关逻辑。
- `background_test.go`: 针对 `background.go` 的测试与回归用例。
- `command_block_test.go`: 该目录下相关逻辑的测试文件。
- `comparison_test.go`: 该目录下相关逻辑的测试文件。
- `coreutils.go`: 实现 `coreutils` 相关逻辑。
- `doc.go`: 该包的包级文档。
- `jq.go`: 实现 `jq` 相关逻辑。
- `shell.go`: 实现 `shell` 相关逻辑。
- `shell_test.go`: 针对 `shell.go` 的测试与回归用例。

## `internal/skills`

- 目录作用：Skill 发现、装载、内置 skill 与事件。

- `diagnostics_test.go`: 该目录下相关逻辑的测试文件。
- `embed.go`: 实现 `embed` 相关逻辑。
- `skills.go`: 实现 `skills` 相关逻辑。
- `skills_test.go`: 针对 `skills.go` 的测试与回归用例。
- `tracker.go`: 实现 `tracker` 相关逻辑。
- `tracker_test.go`: 针对 `tracker.go` 的测试与回归用例。

## `internal/skills/builtin/crush-config`

- 目录作用：包含 `crush-config` 相关实现或资源。

- `SKILL.md`: 内置 skill 文档，描述用法、限制或配置。

## `internal/skills/builtin/crush-hooks`

- 目录作用：包含 `crush-hooks` 相关实现或资源。

- `SKILL.md`: 内置 skill 文档，描述用法、限制或配置。

## `internal/skills/builtin/jq`

- 目录作用：包含 `jq` 相关实现或资源。

- `SKILL.md`: 内置 skill 文档，描述用法、限制或配置。

## `internal/stringext`

- 目录作用：字符串辅助函数。

- `string.go`: 实现 `string` 相关逻辑。
- `string_test.go`: 针对 `string.go` 的测试与回归用例。

## `internal/swagger`

- 目录作用：包含 `swagger` 相关实现或资源。

- `docs.go`: 实现 `docs` 相关逻辑。
- `swagger.json`: 配置、样例或静态资源文件。
- `swagger.yaml`: 配置、样例或静态资源文件。

## `internal/ui`

- 目录作用：Bubble Tea TUI 主实现与子组件。

- `AGENTS.md`: TUI 子系统开发说明与架构约定。

## `internal/ui/anim`

- 目录作用：UI 动画与加载状态组件。

- `anim.go`: 实现 `anim` 相关逻辑。

## `internal/ui/attachments`

- 目录作用：附件列表与附件交互 UI。

- `attachments.go`: 实现 `attachments` 相关逻辑。

## `internal/ui/chat`

- 目录作用：聊天消息与工具结果的渲染器。

- `agent.go`: 聊天 UI 中与 `agent` 相关的消息/工具渲染逻辑。
- `assistant.go`: 聊天 UI 中与 `assistant` 相关的消息/工具渲染逻辑。
- `bash.go`: 聊天 UI 中与 `bash` 相关的消息/工具渲染逻辑。
- `diagnostics.go`: 聊天 UI 中与 `diagnostics` 相关的消息/工具渲染逻辑。
- `docker_mcp.go`: 聊天 UI 中与 `docker_mcp` 相关的消息/工具渲染逻辑。
- `fetch.go`: 聊天 UI 中与 `fetch` 相关的消息/工具渲染逻辑。
- `file.go`: 聊天 UI 中与 `file` 相关的消息/工具渲染逻辑。
- `generic.go`: 聊天 UI 中与 `generic` 相关的消息/工具渲染逻辑。
- `lsp_restart.go`: 聊天 UI 中与 `lsp_restart` 相关的消息/工具渲染逻辑。
- `mcp.go`: 聊天 UI 中与 `mcp` 相关的消息/工具渲染逻辑。
- `mcp_test.go`: 针对 `mcp.go` 的测试与回归用例。
- `messages.go`: 聊天 UI 中与 `messages` 相关的消息/工具渲染逻辑。
- `references.go`: 聊天 UI 中与 `references` 相关的消息/工具渲染逻辑。
- `search.go`: 聊天 UI 中与 `search` 相关的消息/工具渲染逻辑。
- `todos.go`: 聊天 UI 中与 `todos` 相关的消息/工具渲染逻辑。
- `tool_result_content.go`: 聊天 UI 中与 `tool_result_content` 相关的消息/工具渲染逻辑。
- `tool_result_content_test.go`: 针对 `tool_result_content.go` 的测试与回归用例。
- `tools.go`: 工具消息渲染总入口与不同工具渲染器分发。
- `unified_diff.go`: 聊天 UI 中与 `unified_diff` 相关的消息/工具渲染逻辑。
- `user.go`: 聊天 UI 中与 `user` 相关的消息/工具渲染逻辑。

## `internal/ui/common`

- 目录作用：UI 共享上下文、排版、markdown/diff 等公共部件。

- `button.go`: 实现 `button` 相关逻辑。
- `capabilities.go`: 实现 `capabilities` 相关逻辑。
- `common.go`: 实现 `common` 相关逻辑。
- `diff.go`: 实现 `diff` 相关逻辑。
- `elements.go`: 实现 `elements` 相关逻辑。
- `highlight.go`: 实现 `highlight` 相关逻辑。
- `interface.go`: 实现 `interface` 相关逻辑。
- `markdown.go`: 实现 `markdown` 相关逻辑。
- `scrollbar.go`: 实现 `scrollbar` 相关逻辑。

## `internal/ui/completions`

- 目录作用：输入补全弹层与候选列表。

- `completions.go`: 实现 `completions` 相关逻辑。
- `completions_test.go`: 针对 `completions.go` 的测试与回归用例。
- `item.go`: 实现 `item` 相关逻辑。
- `keys.go`: 实现 `keys` 相关逻辑。

## `internal/ui/dialog`

- 目录作用：对话框系统与各类弹窗实现。

- `actions.go`: `actions` 相关对话框或弹窗逻辑。
- `api_key_input.go`: `api_key_input` 相关对话框或弹窗逻辑。
- `arguments.go`: `arguments` 相关对话框或弹窗逻辑。
- `commands.go`: `commands` 相关对话框或弹窗逻辑。
- `commands_item.go`: `commands_item` 相关对话框或弹窗逻辑。
- `common.go`: `common` 相关对话框或弹窗逻辑。
- `dialog.go`: `dialog` 相关对话框或弹窗逻辑。
- `filepicker.go`: `filepicker` 相关对话框或弹窗逻辑。
- `models.go`: `models` 相关对话框或弹窗逻辑。
- `models_item.go`: `models_item` 相关对话框或弹窗逻辑。
- `models_list.go`: `models_list` 相关对话框或弹窗逻辑。
- `oauth.go`: `oauth` 相关对话框或弹窗逻辑。
- `oauth_copilot.go`: `oauth_copilot` 相关对话框或弹窗逻辑。
- `oauth_hyper.go`: `oauth_hyper` 相关对话框或弹窗逻辑。
- `permissions.go`: `permissions` 相关对话框或弹窗逻辑。
- `quit.go`: `quit` 相关对话框或弹窗逻辑。
- `reasoning.go`: `reasoning` 相关对话框或弹窗逻辑。
- `sessions.go`: `sessions` 相关对话框或弹窗逻辑。
- `sessions_item.go`: `sessions_item` 相关对话框或弹窗逻辑。

## `internal/ui/diffview`

- 目录作用：统一/分栏 diff 渲染与 golden 测试数据。

- `Taskfile.yaml`: 配置、样例或静态资源文件。
- `diffview.go`: 实现 `diffview` 相关逻辑。
- `diffview_test.go`: 针对 `diffview.go` 的测试与回归用例。
- `split.go`: 实现 `split` 相关逻辑。
- `style.go`: 实现 `style` 相关逻辑。
- `udiff_test.go`: 该目录下相关逻辑的测试文件。
- `util.go`: 实现 `util` 相关逻辑。
- `util_test.go`: 针对 `util.go` 的测试与回归用例。

## `internal/ui/diffview/testdata`

- 目录作用：包含 `testdata` 相关实现或资源。

- `TestDefault.after`: 测试/示例使用的 `期望修改后` 文件样本。
- `TestDefault.before`: 测试/示例使用的 `修改前` 文件样本。
- `TestLineBreakIssue.after`: 测试/示例使用的 `期望修改后` 文件样本。
- `TestLineBreakIssue.before`: 测试/示例使用的 `修改前` 文件样本。
- `TestMultipleHunks.after`: 测试/示例使用的 `期望修改后` 文件样本。
- `TestMultipleHunks.before`: 测试/示例使用的 `修改前` 文件样本。
- `TestNarrow.after`: 测试/示例使用的 `期望修改后` 文件样本。
- `TestNarrow.before`: 测试/示例使用的 `修改前` 文件样本。
- `TestTabs.after`: 测试/示例使用的 `期望修改后` 文件样本。
- `TestTabs.before`: 测试/示例使用的 `修改前` 文件样本。

## `internal/ui/diffview/testdata/TestDiffView/Split/CustomContextLines`

- 目录作用：包含 `CustomContextLines` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/Default`

- 目录作用：包含 `Default` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/LargeWidth`

- 目录作用：包含 `LargeWidth` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/MultipleHunks`

- 目录作用：包含 `MultipleHunks` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/Narrow`

- 目录作用：包含 `Narrow` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/NoLineNumbers`

- 目录作用：包含 `NoLineNumbers` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/NoSyntaxHighlight`

- 目录作用：包含 `NoSyntaxHighlight` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Split/SmallWidth`

- 目录作用：包含 `SmallWidth` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/CustomContextLines`

- 目录作用：包含 `CustomContextLines` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/Default`

- 目录作用：包含 `Default` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/LargeWidth`

- 目录作用：包含 `LargeWidth` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/MultipleHunks`

- 目录作用：包含 `MultipleHunks` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/Narrow`

- 目录作用：包含 `Narrow` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/NoLineNumbers`

- 目录作用：包含 `NoLineNumbers` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/NoSyntaxHighlight`

- 目录作用：包含 `NoSyntaxHighlight` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffView/Unified/SmallWidth`

- 目录作用：包含 `SmallWidth` 相关实现或资源。

- `DarkMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。
- `LightMode.golden`: `TestDiffView` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewHeight/Split`

- 目录作用：包含 `Split` 相关实现或资源。

- `HeightOf001.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf002.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf003.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf004.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf005.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf006.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf007.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf008.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf009.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf010.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf011.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf012.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf013.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf014.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf015.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf016.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf017.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf018.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf019.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf020.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewHeight/Unified`

- 目录作用：包含 `Unified` 相关实现或资源。

- `HeightOf001.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf002.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf003.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf004.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf005.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf006.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf007.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf008.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf009.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf010.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf011.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf012.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf013.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf014.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf015.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf016.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf017.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf018.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf019.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。
- `HeightOf020.golden`: `TestDiffViewHeight` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewLineBreakIssue`

- 目录作用：包含 `TestDiffViewLineBreakIssue` 相关实现或资源。

- `Split.golden`: `TestDiffViewLineBreakIssue` 用例的 golden 快照，用于断言渲染/输出结果。
- `Unified.golden`: `TestDiffViewLineBreakIssue` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewTabs`

- 目录作用：包含 `TestDiffViewTabs` 相关实现或资源。

- `Split.golden`: `TestDiffViewTabs` 用例的 golden 快照，用于断言渲染/输出结果。
- `Unified.golden`: `TestDiffViewTabs` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewWidth/Split`

- 目录作用：包含 `Split` 相关实现或资源。

- `WidthOf001.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf002.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf003.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf004.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf005.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf006.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf007.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf008.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf009.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf010.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf011.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf012.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf013.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf014.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf015.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf016.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf017.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf018.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf019.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf020.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf021.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf022.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf023.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf024.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf025.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf026.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf027.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf028.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf029.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf030.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf031.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf032.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf033.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf034.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf035.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf036.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf037.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf038.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf039.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf040.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf041.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf042.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf043.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf044.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf045.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf046.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf047.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf048.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf049.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf050.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf051.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf052.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf053.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf054.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf055.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf056.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf057.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf058.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf059.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf060.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf061.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf062.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf063.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf064.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf065.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf066.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf067.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf068.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf069.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf070.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf071.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf072.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf073.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf074.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf075.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf076.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf077.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf078.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf079.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf080.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf081.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf082.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf083.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf084.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf085.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf086.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf087.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf088.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf089.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf090.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf091.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf092.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf093.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf094.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf095.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf096.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf097.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf098.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf099.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf100.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf101.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf102.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf103.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf104.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf105.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf106.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf107.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf108.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf109.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf110.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewWidth/Unified`

- 目录作用：包含 `Unified` 相关实现或资源。

- `WidthOf001.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf002.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf003.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf004.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf005.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf006.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf007.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf008.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf009.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf010.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf011.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf012.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf013.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf014.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf015.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf016.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf017.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf018.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf019.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf020.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf021.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf022.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf023.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf024.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf025.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf026.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf027.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf028.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf029.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf030.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf031.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf032.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf033.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf034.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf035.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf036.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf037.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf038.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf039.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf040.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf041.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf042.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf043.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf044.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf045.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf046.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf047.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf048.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf049.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf050.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf051.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf052.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf053.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf054.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf055.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf056.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf057.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf058.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf059.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。
- `WidthOf060.golden`: `TestDiffViewWidth` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewXOffset/Split`

- 目录作用：包含 `Split` 相关实现或资源。

- `XOffsetOf00.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf01.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf02.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf03.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf04.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf05.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf06.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf07.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf08.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf09.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf10.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf11.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf12.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf13.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf14.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf15.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf16.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf17.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf18.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf19.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf20.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewXOffset/Unified`

- 目录作用：包含 `Unified` 相关实现或资源。

- `XOffsetOf00.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf01.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf02.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf03.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf04.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf05.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf06.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf07.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf08.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf09.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf10.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf11.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf12.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf13.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf14.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf15.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf16.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf17.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf18.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf19.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `XOffsetOf20.golden`: `TestDiffViewXOffset` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewYOffset/Split`

- 目录作用：包含 `Split` 相关实现或资源。

- `YOffsetOf00.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf01.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf02.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf03.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf04.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf05.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf06.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf07.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf08.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf09.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf10.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf11.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf12.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf13.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf14.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf15.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf16.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewYOffset/Unified`

- 目录作用：包含 `Unified` 相关实现或资源。

- `YOffsetOf00.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf01.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf02.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf03.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf04.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf05.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf06.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf07.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf08.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf09.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf10.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf11.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf12.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf13.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf14.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf15.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf16.golden`: `TestDiffViewYOffset` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewYOffsetInfinite/Split`

- 目录作用：包含 `Split` 相关实现或资源。

- `YOffsetOf00.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf01.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf02.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf03.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf04.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf05.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf06.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf07.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf08.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf09.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf10.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf11.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf12.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf13.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf14.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf15.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf16.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestDiffViewYOffsetInfinite/Unified`

- 目录作用：包含 `Unified` 相关实现或资源。

- `YOffsetOf00.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf01.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf02.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf03.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf04.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf05.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf06.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf07.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf08.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf09.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf10.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf11.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf12.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf13.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf14.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf15.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。
- `YOffsetOf16.golden`: `TestDiffViewYOffsetInfinite` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestUdiff`

- 目录作用：包含 `TestUdiff` 相关实现或资源。

- `Unified.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestUdiff/ToUnifiedDiff/DefaultContextLines`

- 目录作用：包含 `DefaultContextLines` 相关实现或资源。

- `Content.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。
- `JSON.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestUdiff/ToUnifiedDiff/DefaultContextLinesPlusOne`

- 目录作用：包含 `DefaultContextLinesPlusOne` 相关实现或资源。

- `Content.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。
- `JSON.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/diffview/testdata/TestUdiff/ToUnifiedDiff/DefaultContextLinesPlusTwo`

- 目录作用：包含 `DefaultContextLinesPlusTwo` 相关实现或资源。

- `Content.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。
- `JSON.golden`: `TestUdiff` 用例的 golden 快照，用于断言渲染/输出结果。

## `internal/ui/image`

- 目录作用：终端图片渲染支持。

- `image.go`: 实现 `image` 相关逻辑。
- `image_test.go`: 针对 `image.go` 的测试与回归用例。

## `internal/ui/list`

- 目录作用：通用滚动列表组件。

- `filterable.go`: 通用列表组件中与 `filterable` 相关的实现。
- `focus.go`: 通用列表组件中与 `focus` 相关的实现。
- `highlight.go`: 通用列表组件中与 `highlight` 相关的实现。
- `item.go`: 通用列表组件中与 `item` 相关的实现。
- `list.go`: 通用列表组件中与 `list` 相关的实现。

## `internal/ui/logo`

- 目录作用：Logo 绘制与随机化辅助。

- `letterforms.go`: 实现 `letterforms` 相关逻辑。
- `logo.go`: 实现 `logo` 相关逻辑。
- `rand.go`: 实现 `rand` 相关逻辑。

## `internal/ui/logo/example`

- 目录作用：Logo 渲染示例程序。

- `main.go`: 该目录的独立入口或示例程序。

## `internal/ui/model`

- 目录作用：顶层 UI 状态机与主界面子模块。

- `chat.go`: 聊天区与消息列表的 UI 行为封装。
- `clipboard.go`: 顶层 UI 中与 `clipboard` 相关的状态、布局或交互逻辑。
- `clipboard_not_supported.go`: 顶层 UI 中与 `clipboard_not_supported` 相关的状态、布局或交互逻辑。
- `clipboard_supported.go`: 顶层 UI 中与 `clipboard_supported` 相关的状态、布局或交互逻辑。
- `filter.go`: 顶层 UI 中与 `filter` 相关的状态、布局或交互逻辑。
- `header.go`: 顶层 UI 中与 `header` 相关的状态、布局或交互逻辑。
- `history.go`: 顶层 UI 中与 `history` 相关的状态、布局或交互逻辑。
- `keys.go`: 顶层 UI 中与 `keys` 相关的状态、布局或交互逻辑。
- `landing.go`: 顶层 UI 中与 `landing` 相关的状态、布局或交互逻辑。
- `layout_test.go`: 该目录下相关逻辑的测试文件。
- `lsp.go`: 顶层 UI 中与 `lsp` 相关的状态、布局或交互逻辑。
- `mcp.go`: 顶层 UI 中与 `mcp` 相关的状态、布局或交互逻辑。
- `onboarding.go`: 顶层 UI 中与 `onboarding` 相关的状态、布局或交互逻辑。
- `pills.go`: 顶层 UI 中与 `pills` 相关的状态、布局或交互逻辑。
- `session.go`: 顶层 UI 中与 `session` 相关的状态、布局或交互逻辑。
- `sidebar.go`: 顶层 UI 中与 `sidebar` 相关的状态、布局或交互逻辑。
- `skills.go`: 顶层 UI 中与 `skills` 相关的状态、布局或交互逻辑。
- `skills_test.go`: 针对 `skills.go` 的测试与回归用例。
- `status.go`: 顶层 UI 中与 `status` 相关的状态、布局或交互逻辑。
- `ui.go`: 顶层 Bubble Tea UI 模型与主消息路由。
- `ui_test.go`: 针对 `ui.go` 的测试与回归用例。

## `internal/ui/notification`

- 目录作用：桌面通知与图标资源。

- `crush-icon-solo.png`: UI 图标或静态资源文件。
- `crush-icon.png`: UI 图标或静态资源文件。
- `icon_darwin.go`: 实现 `icon_darwin` 相关逻辑。
- `icon_other.go`: 实现 `icon_other` 相关逻辑。
- `native.go`: 实现 `native` 相关逻辑。
- `noop.go`: 实现 `noop` 相关逻辑。
- `notification.go`: 实现 `notification` 相关逻辑。
- `notification_test.go`: 针对 `notification.go` 的测试与回归用例。

## `internal/ui/styles`

- 目录作用：TUI 样式、颜色与主题。

- `grad.go`: `grad` 相关样式或主题辅助。
- `quickstyle.go`: `quickstyle` 相关样式或主题辅助。
- `styles.go`: 主样式表，集中定义 TUI 的各类视觉 token。
- `themes.go`: `themes` 相关样式或主题辅助。

## `internal/ui/util`

- 目录作用：UI 小工具与辅助类型。

- `util.go`: 实现 `util` 相关逻辑。

## `internal/ui/xchroma`

- 目录作用：语法高亮桥接封装。

- `chroma.go`: 实现 `chroma` 相关逻辑。

## `internal/update`

- 目录作用：版本更新检查。

- `update.go`: 版本检查与更新信息获取。
- `update_test.go`: 针对 `update.go` 的测试与回归用例。

## `internal/version`

- 目录作用：版本号常量与构建注入。

- `version.go`: 版本号定义。

## `internal/workspace`

- 目录作用：前端使用的工作区抽象，以及本地/远程两种实现。

- `app_workspace.go`: 进程内工作区实现，直接委托给 app.App。
- `client_workspace.go`: 远程工作区实现，通过 HTTP client 代理后端能力。
- `workspace.go`: 前端统一工作区接口，抽象 session、agent、LSP、MCP、权限与事件操作。
