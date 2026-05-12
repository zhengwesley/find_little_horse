import { JsonAsset, resources } from 'cc';
import { LevelConfig } from './types';

export class LevelManager {
    private static levels: LevelConfig[] = [];
    private static loaded: boolean = false;

    static async loadLevels(): Promise<LevelConfig[]> {
        if (this.loaded) {
            return this.levels;
        }

        return new Promise((resolve, reject) => {
            resources.load('levels/levels', JsonAsset, (err, asset) => {
                if (err) {
                    console.error('[LevelManager] 关卡配置加载失败:', err);
                    reject(err);
                    return;
                }

                if (!asset || !asset.json) {
                    const error = new Error('[LevelManager] 关卡配置无效');
                    console.error(error);
                    reject(error);
                    return;
                }

                const jsonData = asset.json as unknown;
                if (!Array.isArray(jsonData)) {
                    const error = new Error('[LevelManager] 关卡配置应为数组');
                    console.error(error);
                    reject(error);
                    return;
                }

                this.levels = jsonData.map(item => ({
                    level: Number(item.level) || 1,
                    gridSize: Number(item.gridSize) || 4,
                    regionSizes: Array.isArray(item.regionSizes) ? item.regionSizes.map(Number) : [],
                    regions: Array.isArray(item.regions) ? item.regions.map((region: any) => ({
                        cells: Array.isArray(region.cells) ? region.cells.map((cell: any) => ({
                            row: Number(cell.row) || 0,
                            col: Number(cell.col) || 0
                        })) : []
                    })) : undefined,
                    horsePositions: Array.isArray(item.horsePositions) ? item.horsePositions.map((pos: any) => ({
                        row: Number(pos.row) || 0,
                        col: Number(pos.col) || 0
                    })) : [],
                    life: Number(item.life) || 2
                }));

                this.loaded = true;
                resolve(this.levels);
            });
        });
    }

    static async getLevel(level: number): Promise<LevelConfig | null> {
        const levels = await this.loadLevels();
        const matched = levels.find(item => item.level === level);
        if (!matched) {
            console.warn(`[LevelManager] 未找到关卡 ${level}，使用第1关`);
            return levels[0] || null;
        }
        return matched;
    }
}
