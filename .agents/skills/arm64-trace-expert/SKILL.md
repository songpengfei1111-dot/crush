---
name: "arm64-trace-expert"
description: "分析大规模 ARM64 Trace 日志并还原算法逻辑与数据流。Invoke when the task involves ARM64 trace reversing, crypto tracing, or large trace search planning."
---

# ARM64 Trace Expert

专门用于分析大规模 ARM64 指令执行流（Trace）的专家技能。能够通过
回溯、正向追踪和模式匹配，从数百万行日志中还原加密算法、数据流向
及系统调用逻辑。

当前项目中的实际工具映射如下：

- `search_text` -> `trace_query` with `mode: "search"`
- `extract_lines` -> `trace_query` with `mode: "lines"`
- 如果不存在 `file_info` 或 `search_crypto_magic`，不要假设工具可用，应先
  使用已有工具和日志模式完成定位

## 核心能力

- **精准定位**：利用十六进制、Base64 或标准算法魔数快速切入关键执行点。
- **数据溯源**：通过追踪寄存器读写 `(r)/(w)` 和内存访问 `ld____/st____`
  实现全链路数据回溯。
- **逻辑验证**：能够根据 Trace 现象编写 Python 脚本进行逻辑拟合与验证。
- **上下文分析**：在确有必要时，为 `trace_query` 的 `search` 模式显式传入
  少量 `context`，读取目标行附近的逻辑。

## 标准操作流程 (SOP)

### 1. 初始化与探测

- 先确认目标值形态：十六进制、Base64、地址、寄存器值、函数名或算法魔数。
- 根据目标值使用 `trace_query` 的 `search` 模式，并限制`max_result=1`进行首次定位。
- 优先从首次出现的位置向上回溯，后续都要限制 `end=$首次定位行`,只关心该值的生成流程。
- 默认不要传 `context`；只有需要看邻域时，才显式传入少量 `context`，`context`会显著增加上下文！！！。

### 2. 深度溯源 (Depth-First Tracing)

- **寄存器追溯**：若目标在 `(w) w0=0x123`，则向上搜索 `w0` 的写入点。
- **内存追溯**：若涉及 `(mr) 0x78de873000`，立即搜索对应的
  `st____ 0x78de873000`。
- **小端序处理**：搜索 4 字节数据失败时，尝试翻转字节序，如
  `0x12345678 -> 78563412`。
- **范围确认**：当已知目标附近行号后，使用 `trace_query` 的 `lines` 模式，
  配合 `start + count` 或 `start + end` 抽取小窗口继续阅读。

### 2.1 遇到可能的加密结果

当遇到很可能是加密算法的结果时，按下面的步骤操作：

- 猜测加密类型。
- 如果怀疑是 Hash：
  - 先搜索常见魔数、初始化常量或函数符号。
  - 再结合 `stp`、循环体和参数准备逻辑，定位加密流程开始位置。
  - 仅在必要时获取少量上下文，阅读加密函数的入参。
  - 使用 Python 尝试计算结果，验证是否与目标值一致。
- 否则：
  - 判断是否是标准 Base64；若不是，检查是否存在自定义码表。
  - 判断是否是异或、加法混淆或简单表驱动变换。

### 3. 逻辑提取与模拟

- 识别 `eor`、`add`、`lsl` 等关键算术指令。
- 遇到 `eor x1, x2, x2` 之类的关键指令时，可以再次搜索同类指令，环比
  验证结论。
- 观察 `[libc.so::xxx]`、`[env::jni]` 等系统函数，利用 `dest` 和 `src`
  地址跨段追踪数据。
- 提取关键常量或 S 盒数据，编写 Python 脚本尝试复现该段逻辑。

### 4. 收敛与总结

- 当追踪到原始明文输入、系统时间 `clock_gettime` 或随机数种子时，可以停止
  继续回溯。
- 整理完整的算法流程图，并提供验证通过的 Python 代码。

## 搜索策略约束

- **结果降噪**：若搜索结果超过 50 条，必须增加指令特征，如 `eor w8`，
  或缩小地址范围进行二次过滤。
- **透明化思考**：每一步搜索前需陈述搜索目的。
- 每 15 次左右搜索后要阶段性总结，避免陷入机械检索。
- 不要把 `context` 当作默认参数；`context` 只会扩大单条命中的邻域，不会
  减少匹配数量。
- `lines` 模式必须显式提供 `end` 或 `count`，并保持窗口足够小。

## 工具参考

| 任务场景 | 当前项目推荐工具 | 关键参数 |
|:--|:--|:--|
| 初始定位已知字符串 | `trace_query` | `mode="search" pattern="xxx"` |
| 分析指令前后依赖 | `trace_query` | `mode="lines" start count=20` |
| 追踪内存数据变动 | `trace_query` | `mode="search" pattern="st____ [ADDR]"` |
| 获取目标值的少量上下文 | `trace_query` | `mode="search" context=5 pattern="[REG_OP]"` |
| 正则搜索字符 | `trace_query` | `mode="search" regex=true pattern="xxx"` |

## 额外注意

- 若当前工作区里还有 `trace_format`、`search_strategy` 之类技能，应结合它们
  一起使用：
  - `trace_format` 负责解释日志结构。
  - 本技能负责制定 ARM64 Trace 逆向策略与执行顺序。
- 如果用户的目标是“找来源”，优先分析首次写入点和上游数据来源，而不是先
  看最终消费点。
