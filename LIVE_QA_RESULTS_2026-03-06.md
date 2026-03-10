# AI+ Live QA Results

Date: 2026-03-06
Environment:
- Backend: local `http://localhost:3001`
- Test book: `3fb98d52-794b-4fbd-92ba-4d71c10e206f`
- Test chapter: `80bcf4b6-2c44-458c-82fc-d58608073339` (`第一章：雨夜残响`)

## Verified Models

- `Pro/deepseek-ai/DeepSeek-V3.2`
- `THUDM/GLM-4-9B-Chat`
- `Pro/MiniMaxAI/MiniMax-M2.5`

## Regression Status

- Backend tests: passed (`107/107`)
- Backend build: passed
- Frontend build: passed

## Live Matrix

| Model | Normal chat | Continue | Tool analysis | Creative plan | Full-text analysis | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Pro/deepseek-ai/DeepSeek-V3.2` | Pass | Pass | Pass | Pass | Pass | Chat now answers directly without `suggestedActions` |
| `THUDM/GLM-4-9B-Chat` | Pass | Pass | Pass | Pass | Pass | Chat returns direct answer; full-text analysis returned fenced JSON-style content |
| `Pro/MiniMaxAI/MiniMax-M2.5` | Pass | Pass | Pass | Pass | Pass | Chat and continue both stable |

## Checked Inputs

### Normal chat
Question:
`这个主角目前最大的动机是什么 请结合已有设定回答`

Expected:
- Direct answer
- No auto action suggestion

Observed:
- All three models returned direct answers
- `suggestedActions` was absent / null

### Continue generation
Instruction:
`延续现有悬疑紧张氛围，续写约200字`

Observed:
- All three models returned non-empty continuation text
- DeepSeek and GLM also returned consistency warnings, which is acceptable behavior

### Tool analysis
Tool:
`proofread`

Observed:
- All three models returned non-empty proofread analysis
- Output quality differed by model, but all requests completed successfully

### Creative plan
Prompt:
`我想写一本赛博修仙小说 给我主角设定和前两章计划`

Observed:
- All three models returned valid structured plans
- All returned at least 2 chapter outlines

### Full-text analysis
Analysis type:
`pacing`

Observed:
- All three models returned non-empty analysis
- `THUDM/GLM-4-9B-Chat` responded with fenced JSON-like markdown, which may be less ideal for UI readability but still produced usable content

## Key Fixes Confirmed By Live Testing

- Normal natural-language chat no longer forces action suggestions
- Model switching is effective across chat, continue, tool analysis, creative plan, and full-text analysis
- The replaced GLM model (`THUDM/GLM-4-9B-Chat`) is callable in the current environment

## Residual Risks

- This round validated representative live flows, not every single front-end button interaction path

## Frontend Toolbar Mapping

Visible right-toolbar button order from `frontend/src/views/BookEditorView.vue`:

1. `AI`
2. `校对`
3. `拼字`
4. `大纲`
5. `角色`
6. `设定`
7. `灵感`
8. `妙笔`
9. `润色`

## GLM Analysis Compatibility Follow-Up

- Issue reproduced: `THUDM/GLM-4-9B-Chat` could return fenced or semi-structured JSON for full-text analysis
- Fix applied in `backend/src/agent/orchestrator.service.ts`
- Post-fix live verification result:
	- analysis body is now converted into readable summary text
	- response no longer starts with a raw code fence
	- structured suggestion items are still preserved

## Remaining Button Follow-Up

Additional live verification completed for the previously pending buttons:

- `拼字`: pass
- `灵感`: pass
- `妙笔`: pass
- `润色` / inline polish: pass (`16` structured suggestions returned in sample run)
- `AI 辅助` editors:
	- character: pass at structure level after backend key normalization
	- world setting: pass
	- plot line: pass
	- foreshadowing: pass

Backend follow-up fix applied:
- `backend/src/agent/orchestrator.service.ts`
- `assist-content` now normalizes localized keys and tolerates JSON-like pseudo-JSON model output

Residual risk:
- `character` AI assist can still produce semantically drifting suggestions even when the returned field structure is now correct; manual per-field acceptance remains safer than one-click full acceptance
