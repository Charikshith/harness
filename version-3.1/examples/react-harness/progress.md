# Session Progress Log

## Current State

**Last Updated:** 2026-07-15 14:30
**Session ID:** sess-042
**Active Feature:** feat-003 - Q&A with Citations

## Status

### What's Done

- [x] Document chunking pipeline (src/services/Chunker.ts)
- [x] Chunk index data structure (src/shared/types.ts)
- [x] PDF and DOCX parsers (src/services/parsers/)
- [x] Chunker unit tests (12 tests, all passing)

### What's In Progress

- [ ] Q&A IPC handler (src/main/QaHandler.ts)
  - Details: Implementing ipcMain.handle('qa:ask') with streaming response
  - Blockers: Need decision on citation format — inline [doc:chunk] vs footnotes

### What's Next

1. Complete Q&A handler with streaming IPC
2. Add citation formatting to renderer (src/renderer/components/CitationLink.tsx)
3. End-to-end integration test with a real PDF document
4. Verify all typechecks pass and no lint warnings

## Blockers / Risks

- [ ] **Citation format decision**: Inline [doc:chunk] is simpler for implementation; footnotes are better for UX. Need product call by EOD.
- [ ] **Streaming vs batch**: Streaming IPC adds complexity but is required for UX. Keep batch path as fallback in MVP.

## Decisions Made

- **Chunk strategy: semantic paragraph splitting**: Split on paragraph boundaries, max 500 tokens per chunk. Overlap of 1 sentence between consecutive chunks.
  - Context: Sliding window was too slow; fixed-size was too imprecise.
  - Alternatives considered: Sliding window with overlapping tokens (discarded — 3x slower), sentence-level (discarded — too many small chunks).
- **Parser approach: per-format adapters**: One parser per format (PDF via pdf-parse, DOCX via mammoth), shared ChunkedDocument output type.
  - Context: Needed to support PDF and DOCX at launch with CSV planned later.
  - Alternatives considered: Unified parser with format detection (discarded — tight coupling makes adding formats harder).

## Files Modified This Session

- `src/main/QaHandler.ts` - Scaffolded IPC handler (in progress)
- `src/shared/types.ts` - Added Citation, QaResult, and ChunkedDocument types
- `src/services/Chunker.ts` - Semantic paragraph splitter (done)
- `src/services/parsers/PdfParser.ts` - PDF chunked extraction with page metadata
- `src/services/parsers/DocxParser.ts` - DOCX chunked extraction

## Evidence of Completion

- [ ] Tests pass: `npm test -- --run` — 47 tests passing, 0 failing (Chunker + parsers)
- [x] Type check clean: `npm run typecheck` — 0 errors
- [x] Lint clean: `npm run lint` — 0 warnings, 0 errors
- [ ] Manual verification: Q&A handler still in progress, no end-to-end test yet

## Notes for Next Session

Decision on citation format is the only blocker preventing Q&A handler completion.
Once resolved, the handler implementation is straightforward — about 2 hours of work.
After handler is done, focus on integration test with a real PDF (test/fixtures/sample-report.pdf already committed).
