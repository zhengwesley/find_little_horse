import { Node, Prefab, instantiate, Vec3, resources,Color } from 'cc';
import { CellData, ColorRegion } from './types';
import { GameConfig } from './GameConfig';

export class GridRenderer {
    private gridContainer: Node;
    private cellPrefab: Prefab;
    private gridSize: number;
    private cells: CellData[][] = [];
    private controller: any;
    
    constructor(gridContainer: Node, cellPrefab: Prefab, gridSize: number, controller: any) {
        this.gridContainer = gridContainer;
        this.cellPrefab = cellPrefab;
        this.gridSize = gridSize;
        this.controller = controller;
    }
    
    createGrid(regions: ColorRegion[]): CellData[][] {
        this.gridContainer.removeAllChildren();
        this.cells = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                const { colorId, regionColor, hasHorse } = this.getCellAttributes(row, col, regions);
                const cellNode = this.createCellNode(row, col, regionColor);
                
                this.cells[row][col] = {
                    row, col, colorId,
                    hasHorse,
                    markType: 'none',
                    node: cellNode
                };
            }
        }
        
        return this.cells;
    }
    
    private getCellAttributes(row: number, col: number, regions: ColorRegion[]) {
        let colorId = -1;
        let regionColor = new Color(200, 200, 200, 255);
        let hasHorse = false;
        
        for (const region of regions) {
            const inRegion = region.cells.some(cell => cell.row === row && cell.col === col);
            if (inRegion) {
                colorId = region.id;
                regionColor = region.color;
                if (region.horsePosition?.row === row && region.horsePosition?.col === col) {
                    hasHorse = true;
                }
                break;
            }
        }
        
        return { colorId, regionColor, hasHorse };
    }
    
    private createCellNode(row: number, col: number, color: Color): Node {
        const cellNode = instantiate(this.cellPrefab);
        cellNode.setParent(this.gridContainer);
        
        const cellSize = GameConfig.CELL_SIZE;
        const spacing = GameConfig.CELL_SPACING;
        const x = col * (cellSize + spacing) - (this.gridSize * (cellSize + spacing)) / 2 + cellSize / 2;
        const y = row * (cellSize + spacing) - (this.gridSize * (cellSize + spacing)) / 2 + cellSize / 2;
        cellNode.setPosition(new Vec3(x, y, 0));
        
        const cellComp = cellNode.getComponent('Cell');
        if (cellComp) {
            cellComp.init(row, col, this.controller, color);
        }
        
        return cellNode;
    }
    
    getCells(): CellData[][] {
        return this.cells;
    }
    
    updateCellDisplay(row: number, col: number, markType: 'none' | 'horse' | 'cross') {
        const cell = this.cells[row]?.[col];
        if (!cell?.node) return;
        
        const cellComp = cell.node.getComponent('Cell');
        if (cellComp) cellComp.updateDisplay(markType);
    }
    
    revealAllHorses(cells: CellData[][]) {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = cells[row][col];
                if (cell.hasHorse && cell.markType !== 'horse') {
                    const cellComp = cell.node.getComponent('Cell');
                    if (cellComp) cellComp.showHint();
                }
            }
        }
    }
}