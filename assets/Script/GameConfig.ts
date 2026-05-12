import { Color } from 'cc';

export class GameConfig {
    static currentLevel: number = 1;
    static readonly DEFAULT_GRID_SIZE = 4;
    static readonly DEFAULT_LIFE = 2;
    static readonly DEFAULT_HORSES = 4;
    static readonly CELL_SIZE = 100;
    static readonly CELL_SPACING = 5;
    static readonly LEVEL_RECORD_PATH = 'levels/levels';
    
    static readonly COLOR_POOL: Color[] = [
        new Color(255, 100, 100, 255),  // 红色
        new Color(100, 255, 100, 255),  // 绿色
        new Color(100, 100, 255, 255),  // 蓝色
        new Color(255, 255, 100, 255),  // 黄色
        new Color(255, 100, 255, 255),  // 紫色
        new Color(100, 255, 255, 255),  // 青色
        new Color(255, 180, 100, 255),  // 橙色
        new Color(180, 100, 255, 255)   // 粉色
    ];
    
    // 4x4网格（16格）的区域大小配置：[1, 3, 5, 7]（可自定义）
    // 总和必须 = gridSize * gridSize
    static readonly REGION_SIZES: { [key: number]: number[] } = {
        4: [1, 3, 5, 7],      // 4x4网格: 4种颜色，大小分别为1,3,5,7
        5: [1, 4, 5, 5, 10],  // 5x5网格: 5种颜色
        6: [1, 5, 8, 8, 8, 12] // 6x6网格: 6种颜色
    };
}
