Delegate a trace-analysis execution task to a dedicated sub-agent that focuses on large-file searching, evidence collection, miss analysis, and concise conclusions.

<when_to_use>
Use this tool when you need to:
- Execute many search iterations against a large trace file
- Isolate noisy search/tool output from the main agent context
- Validate or falsify a specific reverse-engineering hypothesis
- Preserve an audit trail of search attempts and unexpected misses

DO NOT use this tool when:
- The task can be solved in a couple of direct tool calls
- You still need to plan the overall strategy before execution
- The user is asking for a final synthesis rather than a bounded execution task
</when_to_use>

<usage>
- Provide a prompt that defines the execution task, current hypothesis, expected values, and any constraints
- The sub-agent will execute the trace queries, analyze misses, and return a compressed conclusion
- Search/tool calls made inside the sub-agent are kept in the child session for later debugging
</usage>

<parameters>
- prompt: The bounded execution task for the trace sub-agent (required)
</parameters>

<usage_notes>
- Use this after loading the relevant skills in the main agent
- Pass down the essential strategy and expected findings in the prompt
- Be explicit about what counts as success, failure, or an unexpected miss
- The sub-agent is optimized for execution, not broad planning
- The sub-agent primarily uses the dedicated `trace_query` binary wrapper rather than generic repository search tools
</usage_notes>
