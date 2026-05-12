# 找小马 (Find Little Horse)

Cocos Creator puzzle game — Minesweeper + Sudoku hybrid. N×N grid, N horses hidden in colored regions.

**Rules:** Each colored region has exactly 1 horse. Each row/column has exactly 1 horse. Horses can't be adjacent (8-dir).

**Controls:** Single-click = mark X (toggle). Double-click = mark as horse (validated). Wrong guess = lose 1 life.

## Key Files

| File | Role |
|------|------|
| `assets/Script/GameController.ts` | Main orchestrator — game loop, click handlers, win/lose logic |
| `assets/Script/GameState.ts` | State (lives, remaining horses, timer, flags) |
| `assets/Script/LevelManager.ts` | Loads `levels.json`, exposes `getLevel(n)` |
| `assets/Script/MapGenerator.ts` | Generates colored regions and places horses |
| `assets/Script/GridRenderer.ts` | Renders cells, updates display, reveals horses |
| `assets/Script/CellComponent.ts` | Single cell — click/double-click detection, mark display |
| `assets/Script/GameOverPanel.ts` | Win/lose panel with Next/Retry button |
| `assets/Script/GameConfig.ts` | Constants: grid size, life, colors, cell size |
| `assets/Script/types.ts` | Interfaces: `CellData`, `LevelConfig`, `ColorRegion`, `GameStats` |
| `assets/resources/levels/levels.json` | Level data (fixed, not generated) |

## Level Data Format (`levels.json`)

```json
{
  "level": 1,
  "gridSize": 4,
  "regionSizes": [1, 2, 6, 7],
  "regions": [{ "cells": [{"row": 0, "col": 0}, ...] }],
  "horsePositions": [{"row": 2, "col": 3}, ...],
  "life": 2
}
```

3 levels defined: levels 1–2 are 4×4, level 3 is 6×6.

## GameConfig Constants

- `currentLevel`: active level (default 3)
- `DEFAULT_GRID_SIZE`: 4, `DEFAULT_LIFE`: 2, `CELL_SIZE`: 100px, `CELL_SPACING`: 5px
- `COLOR_POOL`: 8 colors, `REGION_SIZES`: presets for 4×4, 5×5, 6×6

## Game Flow

`start()` → `loadCurrentLevel()` → `initGame()` (generate map, start timer) → player clicks → `onCellDoubleClick` validates horse → win/lose → `goNextLevel()` or `resetGame()`

## Architecture

- Modular: state, rendering, level management, map generation are separate classes
- GameState notifies GameController via callback
- Cells instantiated from prefab, positioned dynamically
- Level data is fixed in `levels.json` (not algorithmically generated)
- All UI strings and comments are in Chinese

## Current Branch

`LevelManager` — adds the LevelManager system (load levels from JSON). `master` is the stable base.
