---
description: Implementation plan for Math Parser, OCR, and Layout engine
---

# Math Parser & Digitizer Workflow

## Phase 1: Text Parser (The "Regex Engine")
- [x] **Create `LatexParser` Class**: Logic to split string into Text/Math tokens.
- [x] **Define Interfaces**: `Token` structure (`type`, `content`, `display`).
- [ ] **Implement Regex**: Handle `$..$`, `$$..$$`, `\(..\)`, `\[..\]`.
- [ ] **Unit Tests**: Verify it handles currency symbols (`$5`) vs math correctly.
- [ ] **UI Integration**: Add "Batch Mode" input in the UI to paste text.

## Phase 2: Image Scanner (The "Eye")
- [ ] **Research API**: Select Mathpix or similar (Mock for now if no key).
- [ ] **UI Component**: Drag & Drop zone for images.
- [ ] **Image Processing**: Convert file to Base64.
- [ ] **API Client**: Send image -> Receive LaTeX.
- [ ] **Correction UI**: Show parsed LaTeX for user verification before generation.

## Phase 3: Layout & Generation (The "Printer")
- [ ] **Batch Generator**: Loop through parsed math tokens and generating PNGs.
- [ ] **Sandbox Command**: Update `insertMath` to positioning.
- [ ] **Placement Logic (Strategy A)**:
    - [ ] Calculate positions (grid or stack).
    - [ ] Insert images sequentially on the canvas.

## Current Status
Starting Phase 1.
