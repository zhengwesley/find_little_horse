import { Color, ColorConstants } from 'cc';
import { ColorRegion } from './types';
import { GameConfig } from './GameConfig';

export class MapGenerator {
    private gridSize: number;
    
    constructor(gridSize: number) {
        this.gridSize = gridSize;
    }
    
    generateFullMap(): { regions: ColorRegion[]; horsePositions: { row: number; col: number }[] } | null {
        const regions = this.generateColorRegions();
        const horsePositions = this.generateHorsePositions();
        
        if (!horsePositions || horsePositions.length !== this.gridSize) {
            return null;
        }
        
        if (!this.assignHorsesToRegions(regions, horsePositions)) {
            return null;
        }
        
        return { regions, horsePositions };
    }
    
    private generateColorRegions(): ColorRegion[] {
        const regions: ColorRegion[] = [];
        const assigned = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
        
        for (let regionId = 0; regionId < this.gridSize; regionId++) {
            let cells: { row: number; col: number }[] = [];
            
            if (regionId === this.gridSize - 1) {
                // 最后一个区域取所有剩余格子
                for (let i = 0; i < this.gridSize; i++) {
                    for (let j = 0; j < this.gridSize; j++) {
                        if (!assigned[i][j]) {
                            cells.push({ row: i, col: j });
                            assigned[i][j] = true;
                        }
                    }
                }
            } else {
                const targetSize = Math.floor((this.gridSize * this.gridSize) / this.gridSize);
                cells = this.generateConnectedRegion(assigned, targetSize);
            }
            
            regions.push({
                id: regionId,
                color: GameConfig.COLOR_POOL[regionId % GameConfig.COLOR_POOL.length],
                cells: cells,
                horsePosition: null
            });
        }
        
        return regions;
    }
    
    private generateConnectedRegion(assigned: boolean[][], targetSize: number): { row: number; col: number }[] {
        // 找到种子格子
        let seedRow = -1, seedCol = -1;
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (!assigned[i][j]) {
                    seedRow = i; seedCol = j;
                    break;
                }
            }
            if (seedRow !== -1) break;
        }
        
        if (seedRow === -1) return [];
        
        const region: { row: number; col: number }[] = [];
        const queue = [{ row: seedRow, col: seedCol }];
        const visited = new Set<string>();
        visited.add(`${seedRow},${seedCol}`);
        
        while (queue.length > 0 && region.length < targetSize) {
            const current = queue.shift()!;
            region.push(current);
            assigned[current.row][current.col] = true;
            
            const neighbors = this.getNeighbors(current.row, current.col);
            this.shuffleArray(neighbors);
            
            for (const neighbor of neighbors) {
                const key = `${neighbor.row},${neighbor.col}`;
                if (!assigned[neighbor.row][neighbor.col] && !visited.has(key)) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }
        
        return region;
    }
    
    private generateHorsePositions(): { row: number; col: number }[] | null {
        const positions: { row: number; col: number }[] = [];
        const usedRows = new Set<number>();
        const usedCols = new Set<number>();
        
        const backtrack = (index: number): boolean => {
            if (index === this.gridSize) return true;
            
            for (let row = 0; row < this.gridSize; row++) {
                if (usedRows.has(row)) continue;
                for (let col = 0; col < this.gridSize; col++) {
                    if (usedCols.has(col)) continue;
                    
                    let hasNeighbor = false;
                    for (const pos of positions) {
                        if (Math.abs(pos.row - row) <= 1 && Math.abs(pos.col - col) <= 1) {
                            hasNeighbor = true;
                            break;
                        }
                    }
                    
                    if (!hasNeighbor) {
                        positions.push({ row, col });
                        usedRows.add(row);
                        usedCols.add(col);
                        
                        if (backtrack(index + 1)) return true;
                        
                        positions.pop();
                        usedRows.delete(row);
                        usedCols.delete(col);
                    }
                }
            }
            return false;
        };
        
        return backtrack(0) ? positions : null;
    }
    
    private assignHorsesToRegions(regions: ColorRegion[], horsePositions: { row: number; col: number }[]): boolean {
        for (const horse of horsePositions) {
            let assigned = false;
            for (const region of regions) {
                const contains = region.cells.some(cell => cell.row === horse.row && cell.col === horse.col);
                if (contains && region.horsePosition === null) {
                    region.horsePosition = horse;
                    assigned = true;
                    break;
                }
            }
            if (!assigned) return false;
        }
        
        return regions.every(r => r.horsePosition !== null);
    }
    
    private getNeighbors(row: number, col: number): { row: number; col: number }[] {
        const neighbors: { row: number; col: number }[] = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of directions) {
            const newRow = row + dr, newCol = col + dc;
            if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        return neighbors;
    }
    
    private shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}