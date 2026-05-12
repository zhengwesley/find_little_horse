import { _decorator, Component, Node, Prefab, Label, Button, EventTouch, UITransform, Vec3 } from 'cc';
import { GameConfig } from './GameConfig';
import { GameState } from './GameState';
import { LevelManager } from './LevelManager';
import { MapGenerator } from './MapGenerator';
import { GridRenderer } from './GridRenderer';
import { CellData, LevelConfig } from './types';
import { GameOverPanel } from './GameOverPanel';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Prefab) cellPrefab: Prefab = null;
    @property(Node) gridContainer: Node = null;
    @property(Label) levelLabel: Label = null;
    @property(Label) lifeLabel: Label = null;
    @property(Label) timeLabel: Label = null;
    @property(Label) remainingLabel: Label = null;
    @property(Label) messageLabel: Label = null;
    @property(Button) resetButton: Button = null;
    @property(GameOverPanel) gameOverPanel: GameOverPanel = null;
    
    private gameState: GameState;
    private gridRenderer: GridRenderer;
    private cells: CellData[][] = [];
    private timeInterval: number = null;
    private currentLevelConfig: LevelConfig | null = null;
    private dragMarkType: 'cross' | 'none' | null = null;
    
    async start() {
        this.gameState = new GameState(() => this.onStateChanged());
        await this.loadCurrentLevel();
        const gridSize = this.currentLevelConfig?.gridSize ?? GameConfig.DEFAULT_GRID_SIZE;
        this.gridRenderer = new GridRenderer(this.gridContainer, this.cellPrefab, gridSize, this);
        this.setupEvents();
        await this.initGame();
    }
    
    private async loadCurrentLevel() {
        try {
            this.currentLevelConfig = await LevelManager.getLevel(GameConfig.currentLevel);
            if (this.currentLevelConfig) {
                GameConfig.currentLevel = this.currentLevelConfig.level;
            }
        } catch (error) {
            console.error('[GameController] 关卡加载失败，使用默认配置', error);
            this.currentLevelConfig = null;
        }
    }
    
    async initGame() {
        const life = this.currentLevelConfig?.life ?? GameConfig.DEFAULT_LIFE;
        const gridSize = this.currentLevelConfig?.gridSize ?? GameConfig.DEFAULT_GRID_SIZE;
        const horses = this.currentLevelConfig?.horsePositions.length ?? GameConfig.DEFAULT_HORSES;
        
        this.gameState.init(life, horses);
        
        const mapGenerator = new MapGenerator(gridSize);
        const mapData = mapGenerator.generateFullMap(this.currentLevelConfig ?? undefined);
        
        if (!mapData) {
            console.error("游戏配置生成失败");
            if (this.messageLabel) this.messageLabel.string = "游戏初始化失败，请重置";
            return;
        }
        
        this.gridRenderer = new GridRenderer(this.gridContainer, this.cellPrefab, gridSize, this);
        this.cells = this.gridRenderer.createGrid(mapData.regions);
        this.startTimer();
        if (this.messageLabel) this.messageLabel.string = "游戏开始！双击格子标记小马，单击标记X";
        this.updateUI();
    }
    
    onCellDoubleClick(row: number, col: number) {
        if (this.gameState.isGameOver || this.gameState.isWin) return;
        
        const cell = this.cells[row][col];
        if (cell.markType === 'horse') return;
        
        if (cell.markType === 'cross') {
            cell.markType = 'none';
            this.gridRenderer.updateCellDisplay(row, col, 'none');
            return;
        }
        
        if (cell.hasHorse) {
            cell.markType = 'horse';
            this.gameState.decrementHorse();
            this.gridRenderer.updateCellDisplay(row, col, 'horse');
            if (this.gameState.isWin) this.gameWin();
        } else {
            const hasLife = this.gameState.decrementLife();
            if (this.messageLabel) {
                this.messageLabel.string = `错误！这里没有小马！剩余生命：${this.gameState.currentLife}`;
                this.scheduleOnce(() => {
                    if (this.messageLabel && !this.gameState.isGameOver) {
                        this.messageLabel.string = "继续游戏...";
                    }
                }, 1.5);
            }
            if (!hasLife) this.gameLose();
        }
    }
    
    onCellClick(row: number, col: number) {
        if (this.gameState.isGameOver || this.gameState.isWin) return;
        
        const cell = this.cells[row][col];
        if (cell.markType === 'horse') return;
        
        const newMark = cell.markType === 'cross' ? 'none' : 'cross';
        cell.markType = newMark;
        this.gridRenderer.updateCellDisplay(row, col, newMark);
    }
    
    private onStateChanged() {
        this.updateUI();
    }
    
    private updateUI() {
        if (this.levelLabel) this.levelLabel.string = `第 ${GameConfig.currentLevel} 关`;
        if (this.lifeLabel) this.lifeLabel.string = `生命值: ${this.gameState.currentLife}`;
        if (this.remainingLabel) this.remainingLabel.string = `剩余小马: ${this.gameState.remainingHorses}`;
    }
    
    private startTimer() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        
        this.timeInterval = setInterval(() => {
            if (!this.gameState.isGameOver && !this.gameState.isWin) {
                this.gameState.incrementTime();
                const minutes = Math.floor(this.gameState.gameTime / 60);
                const seconds = this.gameState.gameTime % 60;
                if (this.timeLabel) {
                    const minuteText = ('0' + minutes).slice(-2);
                    const secondText = ('0' + seconds).slice(-2);
                    this.timeLabel.string = `时间: ${minuteText}:${secondText}`;
                }
            }
        }, 1000);
    }
    
    private gameWin() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.messageLabel) this.messageLabel.string = "🎉 胜利！恭喜你找出了所有小马！ 🎉";
        this.gameOverPanel?.show(true, () => this.goNextLevel());
    }

    private gameLose() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.messageLabel) this.messageLabel.string = "💀 游戏失败！生命值用完了！ 💀";
        this.gameOverPanel?.show(false, () => this.resetGame());
    }

    private async goNextLevel() {
        GameConfig.currentLevel += 1;
        await this.loadCurrentLevel();
        await this.initGame();
    }
    
    async resetGame() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        await this.initGame();
    }
    
    private setupEvents() {
        if (this.resetButton) {
            this.resetButton.node.on(Button.EventType.CLICK, this.resetGame, this);
        }
        if (this.gridContainer) {
            this.gridContainer.on(Node.EventType.TOUCH_START, this.onGridTouchStart, this);
            this.gridContainer.on(Node.EventType.TOUCH_MOVE, this.onGridTouchMove, this);
            this.gridContainer.on(Node.EventType.TOUCH_END, this.onGridTouchEnd, this);
            this.gridContainer.on(Node.EventType.TOUCH_CANCEL, this.onGridTouchEnd, this);
        }
    }

private getCellAtTouch(event: EventTouch): { row: number, col: number } | null {
    const gridSize = this.currentLevelConfig?.gridSize ?? GameConfig.DEFAULT_GRID_SIZE;
    const cellSize = GameConfig.CELL_SIZE + GameConfig.CELL_SPACING;
    
    // 1. 验证必要组件是否存在
    if (!this.gridContainer) {
        console.warn('gridContainer is null');
        return null;
    }
    
    const uiTransform = this.gridContainer.getComponent(UITransform);
    if (!uiTransform) {
        console.warn('UITransform component not found on gridContainer');
        return null;
    }
    
    // 2. 获取触摸位置并验证
    const touchLocation = event.getUILocation();
    if (isNaN(touchLocation.x) || isNaN(touchLocation.y) || 
        !isFinite(touchLocation.x) || !isFinite(touchLocation.y)) {
        console.warn('Invalid touch location', touchLocation);
        return null;
    }
    
    // 3. 转换坐标并验证
    const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(touchLocation.x, touchLocation.y, 0));
    if (isNaN(localPos.x) || isNaN(localPos.y)) {
        console.warn('Invalid local position after conversion', { localPos, touchLocation });
        return null;
    }
    
    // 4. 验证 cellSize
    if (cellSize <= 0 || isNaN(cellSize)) {
        console.warn('Invalid cellSize', cellSize);
        return null;
    }
    
    const offsetX = localPos.x + (gridSize * cellSize) / 2;
    const offsetY = localPos.y + (gridSize * cellSize) / 2;
    
    // 5. 验证 offset
    if (isNaN(offsetX) || isNaN(offsetY)) {
        console.warn('Invalid offset', { offsetX, offsetY, localPos, gridSize, cellSize });
        return null;
    }
    
    const col = Math.floor(offsetX / cellSize);
    const row = Math.floor(offsetY / cellSize);
    
    // 6. 边界检查（先检查 NaN 再比较）
    if (isNaN(row) || isNaN(col) || !isFinite(row) || !isFinite(col)) {
        console.warn('getCellAtTouch returned invalid coordinates', { row, col, offsetX, offsetY, cellSize });
        return null;
    }
    
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null;
    
    return { row, col };
}


    private onGridTouchStart(event: EventTouch) {
        this.dragMarkType = null;
    }

    private onGridTouchMove(event: EventTouch) {
        if (this.gameState.isGameOver || this.gameState.isWin) return;
        if (!this.cells || this.cells.length === 0) return;
        const pos = this.getCellAtTouch(event);
        if (!pos) return;
        const cell = this.cells[pos.row][pos.col];
        if (cell.markType === 'horse') return;

        if (this.dragMarkType === null) {
            this.dragMarkType = cell.markType === 'cross' ? 'none' : 'cross';
        }
        if (cell.markType !== this.dragMarkType) {
            cell.markType = this.dragMarkType;
            this.gridRenderer.updateCellDisplay(pos.row, pos.col, this.dragMarkType);
        }
    }

    private onGridTouchEnd() {
        this.dragMarkType = null;
    }
    
    onDestroy() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.gridContainer) {
            this.gridContainer.off(Node.EventType.TOUCH_START, this.onGridTouchStart, this);
            this.gridContainer.off(Node.EventType.TOUCH_MOVE, this.onGridTouchMove, this);
            this.gridContainer.off(Node.EventType.TOUCH_END, this.onGridTouchEnd, this);
            this.gridContainer.off(Node.EventType.TOUCH_CANCEL, this.onGridTouchEnd, this);
        }
    }
}