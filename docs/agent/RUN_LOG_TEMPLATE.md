# Run-Log Template

Save copies as `memory/runs/YYYY-MM-DD_<model>-<NN>.md` — one per substantive prompt.

```markdown
- **Goal:** <one-line goal of this prompt>
- **Did:** <files touched, agents launched, key decisions>
- **Result:** <success/partial/blocked + measurable variable, e.g. "lint:0, tests:142/142, axe:0 critical">
- **Surprise:** <unexpected finding, or "—">
- **Next:** <single, concrete next prompt>
```

## Numbering

- Date format: `YYYY-MM-DD` (today's date as ISO).
- Model: `opus-4-7`, `sonnet-4-6`, `haiku-4-5`.
- NN: zero-padded counter starting at `01` per day.

Examples:
- `memory/runs/2026-05-04_opus-4-7-01.md`
- `memory/runs/2026-05-04_opus-4-7-02.md`
- `memory/runs/2026-05-04_sonnet-4-6-03.md`

## Why

Without this discipline the engineering harness loses its memory advantage between sessions. Five lines is the right number — long enough to be useful for a future context window, short enough that you actually do it every time.
