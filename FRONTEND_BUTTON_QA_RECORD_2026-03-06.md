# Frontend Button QA Record

Date: 2026-03-06
Source of button order: `frontend/src/views/BookEditorView.vue`
Validation method:
- Frontend code-path inspection
- Live backend/API validation with real token, real book, real chapter
- Note: current toolset cannot physically click the browser UI and read DOM state end-to-end, so this record maps each visible button to its actual request path and verified runtime result

## Right Toolbar Order

1. `AI`
2. `校对`
3. `拼字`
4. `大纲`
5. `角色`
6. `设定`
7. `灵感`
8. `妙笔`
9. `润色`

## Button-Level Validation

| Button | Frontend path | Backend/API path | Status | Notes |
| --- | --- | --- | --- | --- |
| `AI` | `frontend/src/components/ThreeLayerPanel.vue` | `/ai/chat/stream` or `/ai/deep-think/stream` | Pass | Chinese natural-language chat verified across 3 models; no forced `suggestedActions` for plain Q&A |
| `校对` | `frontend/src/components/RightToolPanel.vue` | `/ai/tool-analysis/stream` with `tool=proofread` | Pass | DeepSeek / GLM / MiniMax all returned non-empty results |
| `拼字` | `frontend/src/components/RightToolPanel.vue` | `/ai/tool-analysis/stream` with `tool=spelling` | Pending UI click record | Shared code path with other right-panel tools; endpoint path verified by code review |
| `大纲` | `frontend/src/components/ThreeLayerPanel.vue` | Strategy layer editors / context load | Pending UI click record | Not a single live AI endpoint button in this toolbar path |
| `角色` | `frontend/src/components/ThreeLayerPanel.vue` | Character editor + AI assist paths | Pending UI click record | AI assist path already supports `modelId`, but this round did not click the editor dialog end-to-end |
| `设定` | `frontend/src/components/ThreeLayerPanel.vue` | World setting editor + AI assist paths | Pending UI click record | AI assist path already supports `modelId`, but this round did not click the editor dialog end-to-end |
| `灵感` | `frontend/src/components/RightToolPanel.vue` | `/ai/tool-analysis/stream` with `tool=inspiration` | Pending UI click record | Same rendering path as `校对`, model switching path already shared |
| `妙笔` | `frontend/src/components/RightToolPanel.vue` | `/ai/tool-analysis/stream` with `tool=writing` | Pending UI click record | Same rendering path as `校对`, model switching path already shared |
| `润色` | `frontend/src/views/BookEditorView.vue` -> inline polish flow | `/ai/polish/inline` | Pending UI click record | Code path present; not re-run in this round because this pass focused on chat/tool/analysis compatibility |

## Analysis Buttons In AI Panel

These actions are triggered from the AI panel and eventually call `agentStore.analyzeFullText(...)`:

- `伏笔分析`
- `角色弧线分析`
- `节奏分析`
- `全面分析`

Backend path:
- `/ai/analyze/stream`

Status:
- Pass for all 3 models in live validation

## GLM Full-Text Analysis Compatibility

Issue found before fix:
- `THUDM/GLM-4-9B-Chat` could return fenced JSON / semi-structured JSON-like content
- Frontend markdown rendering would display that code block directly, which was readable but not ideal for user-facing analysis cards

Fix applied:
- `backend/src/agent/orchestrator.service.ts`
- Full-text analysis now:
  - extracts structured JSON more robustly
  - strips fenced/raw JSON from the visible analysis body
  - falls back to a readable markdown summary when the model mostly returns structured suggestions

Live result after fix:
- GLM pacing analysis now starts with readable summary text instead of raw code fence
- Structured suggestions are still preserved for downstream action generation

## Current Practical Conclusion

The main visible front-end AI flows are now in this state:
- Chat: verified live
- Continue generation: verified live
- Tool analysis shared path: verified live
- Creative plan: verified live
- Full-text analysis: verified live
- GLM full-text rendering compatibility: verified fixed

The remaining gap is manual browser-side clicking and visual confirmation for:
- `拼字`
- `灵感`
- `妙笔`
- `润色`
- editor-specific `AI 辅助` dialogs under role/world/plot/foreshadowing panels

## Remaining Button Scripts

Below are the concrete request shapes used to verify the remaining buttons at the API layer.

### `拼字`

Frontend path:
- `frontend/src/components/RightToolPanel.vue`
- `frontend/src/stores/agent.ts` -> `runToolAnalysis(...)`

Backend path:
- `POST /ai/tool-analysis/stream`

Request body shape:
```json
{
  "bookId": "<bookId>",
  "chapterId": "<chapterId>",
  "chapterTitle": "第一章：雨夜残响",
  "content": "<当前章节文本片段>",
  "tool": "spelling",
  "modelId": "Pro/deepseek-ai/DeepSeek-V3.2"
}
```

Expected:
- Returns non-empty spelling analysis
- Right panel renders markdown text

Live result:
- Pass
- Sample output: `经检查，本章节文本用词精准，无明显错别字或拼写错误...`

### `灵感`

Frontend path:
- `frontend/src/components/RightToolPanel.vue`
- `frontend/src/stores/agent.ts` -> `runToolAnalysis(...)`

Backend path:
- `POST /ai/tool-analysis/stream`

Request body difference:
```json
{
  "tool": "inspiration"
}
```

Expected:
- Returns non-empty story/inspiration suggestions based on current text

Live result:
- Pass
- Sample output: `基于您提供的《第一章：雨夜残响》内容，这是一部充满潜力的悬疑都市异能故事开端...`

### `妙笔`

Frontend path:
- `frontend/src/components/RightToolPanel.vue`
- `frontend/src/stores/agent.ts` -> `runToolAnalysis(...)`

Backend path:
- `POST /ai/tool-analysis/stream`

Request body difference:
```json
{
  "tool": "writing"
}
```

Expected:
- Returns non-empty literary polish / style enhancement suggestions

Live result:
- Pass
- Sample output: `整体文笔评价... 逐条润色建议...`

### `润色`

Frontend path:
- `frontend/src/views/BookEditorView.vue` -> `startInlinePolish()`
- `frontend/src/stores/agent.ts` -> `requestInlinePolish(...)`

Backend path:
- `POST /ai/polish/inline`

Request body shape:
```json
{
  "bookId": "<bookId>",
  "chapterId": "<chapterId>",
  "chapterTitle": "第一章：雨夜残响",
  "content": "<当前章节文本片段>",
  "modelId": "Pro/deepseek-ai/DeepSeek-V3.2"
}
```

Expected:
- Stream returns multiple `suggestion` events
- Each suggestion includes `original`, `replacement`, `reason`
- No `<<<FIND>>>` style parser residue

Live result:
- Pass
- Suggestions returned: `16`
- First suggestion sample:
  - original: `将霓虹灯的光晕晕染成一团团模糊而潮湿的雾。`
  - replacement: `将霓虹灯的光晕晕染成一团团模糊而潮湿的光斑。`

### `AI 辅助` in `CharacterEditor.vue`

Frontend path:
- `frontend/src/components/CharacterEditor.vue`
- `frontend/src/stores/agent.ts` -> `assistContent(bookId, 'character', currentData)`

Backend path:
- `POST /ai/assist-content`

Expected:
- Returns English field keys compatible with the form (`name`, `role`, `personality`, etc.)

Live result:
- Pass at structure level
- Returned keys:
  - `name`
  - `role`
  - `personality`
  - `background`
  - `motivation`
  - `fear`
  - `strength`
  - `weakness`
  - `currentGoal`
  - `longTermGoal`
  - `arc`
  - `appearance`
  - `catchphrase`

Risk note:
- Although keys are now normalized correctly, content semantics can drift; one live response proposed a different character identity. Manual acceptance is still recommended rather than one-click full acceptance.

### `AI 辅助` in `WorldSettingEditor.vue`

Frontend path:
- `frontend/src/components/WorldSettingEditor.vue`
- `frontend/src/stores/agent.ts` -> `assistContent(bookId, 'world_setting', currentData)`

Expected:
- Returns English field keys such as `genre`, `theme`, `tone`, `powerSystem`, `geography`, `history`, `society`, `rules`

Live result:
- Pass
- Returned keys:
  - `genre`
  - `theme`
  - `tone`
  - `targetWordCount`
  - `powerSystem`
  - `geography`
  - `society`
  - `history`
  - `rules`

### `AI 辅助` in `PlotLineEditor.vue`

Frontend path:
- `frontend/src/components/PlotLineEditor.vue`
- `frontend/src/stores/agent.ts` -> `assistContent(bookId, 'outline', currentData)`

Expected:
- Returns English keys compatible with plot line form

Live result:
- Pass
- Returned keys:
  - `title`
  - `description`
  - `type`
  - `conflict`
  - `climax`
  - `resolution`

### `AI 辅助` in `ForeshadowingEditor.vue`

Frontend path:
- `frontend/src/components/ForeshadowingEditor.vue`
- `frontend/src/stores/agent.ts` -> `assistContent(bookId, 'outline', currentData)`

Expected:
- Returns English keys compatible with foreshadowing form

Live result:
- Pass
- Returned keys:
  - `title`
  - `type`
  - `content`
  - `purpose`
  - `resolveHint`
  - `relatedCharacters`
