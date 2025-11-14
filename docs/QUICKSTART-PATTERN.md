# Quickstart Pattern

When user says "quickstart", generate a **minimal prompt for rapid Claude restart**.

Goal: Get Claude productive in <30 seconds of reading.

## Format:

```
Continue working on [Project Name] at /path/to/repo

SESSION [N]: [Stage Name] - [Brief Description]

LAST 5 COMMITS:
[hash] [message]
[hash] [message]
...

WHERE WE ARE:
- Just finished: [what's done]
- Currently: [what's being tested/worked on]
- Next: [immediate next step]

KEY CONTEXT:
- [Critical decision 1]
- [Critical decision 2]
- [Known issue if blocking]

AWAITING: [User action/feedback needed]
```

Keep it under 15 lines. Focus on resuming work, not explaining everything.
