import { Color } from 'cc';

export class GameConfig {
    static readonly DEFAULT_GRID_SIZE = 4;
    static readonly DEFAULT_LIFE = 2;
    static readonly DEFAULT_HORSES = 4;
    static readonly CELL_SIZE = 100;
    static readonly CELL_SPACING = 5;
    
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
}