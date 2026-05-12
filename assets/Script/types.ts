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

export interface GameStats {
    currentLife: number;
    remainingHorses: number;
    gameTime: number;
    isGameOver: boolean;
    isWin: boolean;
}