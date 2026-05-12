import { Color } from 'cc';
import { ColorRegion, LevelConfig, RegionDefinition } from './types';
import { GameConfig } from './GameConfig';

export class MapGenerator {
    private gridSize: number;
    
    constructor(gridSize: number) {
        this.gridSize = gridSize;
    }
    
    generateFullMap(levelConfig?: LevelConfig): { regions: ColorRegion[]; horsePositions: { row: number; col: number }[] } | null {
        let regions: ColorRegion[] | null = null;
        if (levelConfig?.regions && levelConfig.regions.length > 0) {
            regions = this.createFixedRegions(levelConfig.regions);
        } else {
            const regionSizes = levelConfig?.regionSizes || GameConfig.REGION_SIZES[this.gridSize] || this.generateDefaultRegionSizes();
            regions = this.generateColorRegions(regionSizes);
        }

        if (!regions) {
            console.error('[MapGenerator] 区域生成失败');
            return null;
        }

        console.log(`[MapGenerator] 生成了 ${regions.length} 个区域:`, regions.map(r => `${r.id}(${r.cells.length}格)`).join(', '));
        
        let horsePositions: { row: number; col: number }[] | null = null;
        if (levelConfig?.horsePositions && levelConfig.horsePositions.length === this.gridSize) {
            const validAssignment = this.assignHorsesToRegions(regions, levelConfig.horsePositions);
            if (!validAssignment) {
                console.error('[MapGenerator] 关卡中指定的小马位置无法分配到区域');
                return null;
            }
            horsePositions = levelConfig.horsePositions;
        } else {
            horsePositions = this.generateHorsesForRegions(regions);
        }
        
        console.log(`[MapGenerator] 生成了 ${horsePositions?.length ?? 0} 匹小马位置`);
        
        if (!horsePositions || horsePositions.length !== this.gridSize) {
            console.error(`[MapGenerator] 失败: 小马数量不匹配。期望: ${this.gridSize}, 实际: ${horsePositions?.length ?? 0}`);
            return null;
        }
        
        return { regions, horsePositions };
    }
    
    // 新方法：为每个区域生成一匹马
    private generateHorsesForRegions(regions: ColorRegion[]): { row: number; col: number }[] | null {
        const horsePositions: { row: number; col: number }[] = [];
        const usedRows = new Set<number>();
        const usedCols = new Set<number>();
        
        // 为每个区域随机选择一个格子放马
        for (const region of regions) {
            if (region.cells.length === 0) {
                console.error(`[MapGenerator] 区域 ${region.id} 没有格子`);
                return null;
            }
            
            // 过滤出符合条件的格子（不在已使用的行/列，且不与已有的马相邻）
            const validCells = region.cells.filter(cell => {
                if (usedRows.has(cell.row) || usedCols.has(cell.col)) return false;
                
                // 检查是否与已有的马相邻
                for (const pos of horsePositions) {
                    if (Math.abs(pos.row - cell.row) <= 1 && Math.abs(pos.col - cell.col) <= 1) {
                        return false;
                    }
                }
                return true;
            });
            
            if (validCells.length === 0) {
                console.warn(`[MapGenerator] 区域 ${region.id} 找不到有效的马位置，尝试降低约束...`);
                // 降低约束：只要求不在已使用的行/列
                const relaxedCells = region.cells.filter(cell => 
                    !usedRows.has(cell.row) && !usedCols.has(cell.col)
                );
                
                if (relaxedCells.length === 0) {
                    console.error(`[MapGenerator] 区域 ${region.id} 仍然找不到有效位置`);
                    return null;
                }
                
                const cell = relaxedCells[Math.floor(Math.random() * relaxedCells.length)];
                horsePositions.push(cell);
                region.horsePosition = cell;
                usedRows.add(cell.row);
                usedCols.add(cell.col);
            } else {
                // 从有效格子中随机选择一个
                const cell = validCells[Math.floor(Math.random() * validCells.length)];
                horsePositions.push(cell);
                region.horsePosition = cell;
                usedRows.add(cell.row);
                usedCols.add(cell.col);
            }
        }
        
        return horsePositions;
    }
    
    private createFixedRegions(regionDefs: RegionDefinition[]): ColorRegion[] | null {
        const regions: ColorRegion[] = [];
        const occupied = new Set<string>();

        for (let regionId = 0; regionId < regionDefs.length; regionId++) {
            const def = regionDefs[regionId];
            if (!Array.isArray(def.cells) || def.cells.length === 0) {
                console.error(`[MapGenerator] 区域 ${regionId} 定义无效或为空`);
                return null;
            }

            const cells = def.cells.map(cell => ({ row: Number(cell.row), col: Number(cell.col) }));
            for (const cell of cells) {
                const key = `${cell.row},${cell.col}`;
                if (cell.row < 0 || cell.row >= this.gridSize || cell.col < 0 || cell.col >= this.gridSize) {
                    console.error(`[MapGenerator] 区域 ${regionId} 包含超出范围的格子: ${key}`);
                    return null;
                }
                if (occupied.has(key)) {
                    console.error(`[MapGenerator] 区域 ${regionId} 与其它区域存在重叠格子: ${key}`);
                    return null;
                }
                occupied.add(key);
            }

            regions.push({
                id: regionId,
                color: GameConfig.COLOR_POOL[regionId % GameConfig.COLOR_POOL.length],
                cells,
                horsePosition: null
            });
        }

        if (occupied.size !== this.gridSize * this.gridSize) {
            console.warn(`[MapGenerator] 固定区域配置未覆盖全部格子：已覆盖 ${occupied.size}/${this.gridSize * this.gridSize}`);
            return null;
        }

        return regions;
    }

    private generateColorRegions(regionSizes: number[]): ColorRegion[] {
        const regions: ColorRegion[] = [];
        const assigned = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));
        
        for (let regionId = 0; regionId < regionSizes.length; regionId++) {
            const targetSize = regionSizes[regionId];
            const cells = this.generateConnectedRegion(assigned, targetSize);
            
            regions.push({
                id: regionId,
                color: GameConfig.COLOR_POOL[regionId % GameConfig.COLOR_POOL.length],
                cells: cells,
                horsePosition: null
            });
        }
        
        return regions;
    }
    
    // 如果没有配置，生成默认的均匀分配
    private generateDefaultRegionSizes(): number[] {
        const totalCells = this.gridSize * this.gridSize;
        const numRegions = this.gridSize;
        const baseSizes = new Array(numRegions).fill(Math.floor(totalCells / numRegions));
        const remainder = totalCells % numRegions;
        
        // 将余数分配到最后几个区域
        for (let i = 0; i < remainder; i++) {
            baseSizes[numRegions - 1 - i]++;
        }
        
        return baseSizes;
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