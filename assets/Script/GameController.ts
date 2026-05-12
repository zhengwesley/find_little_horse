import { _decorator, Component, Node, Prefab, Label, Button } from 'cc';
import { GameConfig } from './GameConfig';
import { GameState } from './GameState';
import { LevelManager } from './LevelManager';
import { MapGenerator } from './MapGenerator';
import { GridRenderer } from './GridRenderer';
import { CellData, LevelConfig } from './types';

const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    @property(Prefab) cellPrefab: Prefab = null;
    @property(Node) gridContainer: Node = null;
    @property(Label) lifeLabel: Label = null;
    @property(Label) timeLabel: Label = null;
    @property(Label) remainingLabel: Label = null;
    @property(Label) messageLabel: Label = null;
    @property(Button) resetButton: Button = null;
    
    private gameState: GameState;
    private gridRenderer: GridRenderer;
    private cells: CellData[][] = [];
    private timeInterval: number = null;
    private currentLevelConfig: LevelConfig | null = null;
    
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
        console.log("Game Win!");
    }
    
    private gameLose() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        if (this.messageLabel) this.messageLabel.string = "💀 游戏失败！生命值用完了！ 💀";
        this.gridRenderer.revealAllHorses(this.cells);
    }
    
    async resetGame() {
        if (this.timeInterval) clearInterval(this.timeInterval);
        await this.initGame();
    }
    
    private setupEvents() {
        if (this.resetButton) {
            this.resetButton.node.on(Button.EventType.CLICK, this.resetGame, this);
        }
    }
    
    onDestroy() {
        if (this.timeInterval) clearInterval(this.timeInterval);
    }
}