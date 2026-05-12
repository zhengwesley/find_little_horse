import { Color, Node } from 'cc';

export interface CellData {
    row: number;
    col: number;
    colorId: number;
    hasHorse: boolean;
    markType: 'none' | 'horse' | 'cross';
    node: Node | null;
}

export interface ColorRegion {
    id: number;
    color: Color;
    cells: { row: number; col: number }[];
    horsePosition: { row: number; col: number } | null;
}

export interface RegionDefinition {
    cells: { row: number; col: number }[];
}

export interface LevelConfig {
    level: number;
    gridSize: number;
    regionSizes: number[];
    regions?: RegionDefinition[];
    horsePositions: { row: number; col: number }[];
    life: number;
}

export interface GameStats {
    currentLife: number;
    remainingHorses: number;
    gameTime: number;
    isGameOver: boolean;
    isWin: boolean;
}