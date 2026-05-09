Query a large trace file through the dedicated `large-text-viewer` binary using either `search` or `lines` mode.

<when_to_use>
- Use `mode: "search"` to search a GB-scale trace file by pattern.
- Use `mode: "lines"` to inspect an exact line range after you already know the target area.
- Prefer this tool over generic `grep`/`view` when the target is a very large trace file.
</when_to_use>

<modes>
- `search`: requires `file_path` and `pattern`; supports `regex`, optional `context`, and optional `max_results` less than `100`
- `lines`: requires `file_path`, `start`, and exactly one of `end` or `count`; supports `line_numbers`, rejects `context/regex/pattern/max_results`, and rejects requests where `end - start > 100` or `count > 100`
</modes>

<usage_notes>
- Keep searches narrow. If the tool reports too many matches, refine the pattern or inspect a smaller range first.
- Do not set `context` by default. Only provide it when nearby lines are necessary for the immediate step.
- Use `lines` after `search` to validate exact neighborhoods instead of requesting huge contexts repeatedly.
- In `lines` mode, always provide an explicit `end` or `count`. Do not rely on open-ended reads.
- When a search unexpectedly misses, treat it as evidence and adjust anchors, scope, or regex strategy.
</usage_notes>
