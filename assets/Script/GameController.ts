import { _decorator, Component, Node, Prefab, instantiate, Label, Button, Sprite, Color, Vec3, resources } from 'cc';
const { ccclass, property } = _decorator;

// 格子数据结构
interface CellData {
    row: number;      // 行号 0-3 对应 A-D
    col: number;      // 列号 0-3 对应 1-4
    hasHorse: boolean;
    markType: 'none' | 'horse' | 'cross';
    node: Node | null;
}

@ccclass('GameController')
export class GameController extends Component {
    @property(Prefab)
    cellPrefab: Prefab = null;

    @property(Node)
    gridContainer: Node = null;

    @property(Label)
    lifeLabel: Label = null;

    @property(Label)
    timeLabel: Label = null;

    @property(Label)
    remainingLabel: Label = null;

    @property(Label)
    messageLabel: Label = null;

    @property(Button)
    resetButton: Button = null;

    // 游戏配置
    private gridSize: number = 4;
    private cells: CellData[][] = [];
    private currentLife: number = 2;
    private remainingHorses: number = 4;
    private gameTime: number = 0;
    private isGameOver: boolean = false;
    private isWin: boolean = false;
    private timeInterval: number = null;

    // 固定的小马位置 (行, 列)
    // 行: 0=A,1=B,2=C,3=D
    // 列: 0=1,1=2,2=3,3=4
    private horsePositions: { row: number; col: number }[] = [
        { row: 1, col: 0 },  // B1
        { row: 3, col: 1 },  // D2
        { row: 0, col: 2 },  // A3
        { row: 2, col: 3 }   // C4
    ];

    start() {
        this.initGame();
        this.setupEvents();
    }

    initGame() {
        this.currentLife = 2;
        this.remainingHorses = 4;
        this.gameTime = 0;
        this.isGameOver = false;
        this.isWin = false;
        
        this.updateUI();
        this.createGrid();
        this.startTimer();
        
        if (this.messageLabel) {
            this.messageLabel.string = "游戏开始！双击格子标记小马，单击标记X";
        }
    }

    setupEvents() {
        if (this.resetButton) {
            this.resetButton.node.on(Button.EventType.CLICK, this.resetGame, this);
        }
    }

    createGrid() {
        // 清空容器
        if (this.gridContainer) {
            this.gridContainer.removeAllChildren();
        }
        
        this.cells = [];
        
        const cellSize = 100; // 格子大小
        const spacing = 5;    // 间距
        
        // 从下到上创建行 (A-D 对应行索引 0-3)
        for (let row = 0; row < this.gridSize; row++) {
            this.cells[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                // 检查是否有马
                const hasHorse = this.horsePositions.some(pos => pos.row === row && pos.col === col);
                
                // 实例化格子
                const cellNode = instantiate(this.cellPrefab);
                cellNode.setParent(this.gridContainer);
                
                // 设置位置 (从左到右，从下到上)
                const x = col * (cellSize + spacing) - (this.gridSize * (cellSize + spacing)) / 2 + cellSize / 2;
                const y = row * (cellSize + spacing) - (this.gridSize * (cellSize + spacing)) / 2 + cellSize / 2;
                cellNode.setPosition(new Vec3(x, y, 0));
                
                // 初始化格子数据
                const cellData: CellData = {
                    row: row,
                    col: col,
                    hasHorse: hasHorse,
                    markType: 'none',
                    node: cellNode
                };
                this.cells[row][col] = cellData;
                
                // 获取格子组件并初始化
                const cellComp = cellNode.getComponent('Cell');
                if (cellComp) {
                    cellComp.init(row, col, this);
                }
                
                // 设置格子显示文本 (可选，显示坐标)
                this.updateCellDisplay(row, col);
            }
        }
    }

    updateCellDisplay(row: number, col: number) {
        const cell = this.cells[row][col];
        if (!cell || !cell.node) return;
        
        const cellComp = cell.node.getComponent('Cell');
        if (cellComp) {
            cellComp.updateDisplay(cell.markType);
        }
    }

    // 双击格子（标记为马）
    onCellDoubleClick(row: number, col: number) {
        if (this.isGameOver || this.isWin) return;
        
        const cell = this.cells[row][col];
        
        // 如果已经标记为马，不能重复标记
        if (cell.markType === 'horse') return;
        
        // 如果已经标记为X，清除X标记
        if (cell.markType === 'cross') {
            cell.markType = 'none';
            this.updateCellDisplay(row, col);
            return;
        }
        
        // 判定是否有马
        if (cell.hasHorse) {
            // 正确标记为马
            cell.markType = 'horse';
            this.remainingHorses--;
            this.updateUI();
            this.updateCellDisplay(row, col);
            
            // 检查胜利
            if (this.remainingHorses === 0) {
                this.gameWin();
            }
        } else {
            // 错误标记，扣生命值
            this.currentLife--;
            this.updateUI();
            
            // 显示错误提示
            if (this.messageLabel) {
                this.messageLabel.string = `错误！这里没有小马！剩余生命：${this.currentLife}`;
                this.scheduleOnce(() => {
                    if (this.messageLabel && !this.isGameOver) {
                        this.messageLabel.string = "继续游戏...";
                    }
                }, 1.5);
            }
            
            // 检查游戏结束
            if (this.currentLife <= 0) {
                this.gameLose();
            }
        }
    }
    
    // 单击格子（标记为X）
    onCellClick(row: number, col: number) {
        if (this.isGameOver || this.isWin) return;
        
        const cell = this.cells[row][col];
        
        // 如果已经标记为马，不能标记X
        if (cell.markType === 'horse') return;
        
        // 切换X标记
        if (cell.markType === 'cross') {
            cell.markType = 'none';
        } else {
            cell.markType = 'cross';
        }
        
        this.updateCellDisplay(row, col);
    }

    updateUI() {
        if (this.lifeLabel) {
            this.lifeLabel.string = `生命值: ${this.currentLife}`;
        }
        if (this.remainingLabel) {
            this.remainingLabel.string = `剩余小马: ${this.remainingHorses}`;
        }
    }

    startTimer() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        
        this.timeInterval = setInterval(() => {
            if (!this.isGameOver && !this.isWin) {
                this.gameTime++;
                const minutes = Math.floor(this.gameTime / 60);
                const seconds = this.gameTime % 60;
                if (this.timeLabel) {
                    this.timeLabel.string = `时间: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    gameWin() {
        this.isWin = true;
        this.isGameOver = true;
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        
        if (this.messageLabel) {
            this.messageLabel.string = "🎉 胜利！恭喜你找出了所有小马！ 🎉";
        }
        
        // 可以在这里添加胜利特效
        console.log("Game Win!");
    }

    gameLose() {
        this.isGameOver = true;
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        
        if (this.messageLabel) {
            this.messageLabel.string = "💀 游戏失败！生命值用完了！ 💀";
        }
        
        // 显示所有小马位置
        this.revealAllHorses();
        
        console.log("Game Lose!");
    }

    revealAllHorses() {
        // 显示所有小马的正确位置
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.cells[row][col];
                if (cell.hasHorse && cell.markType !== 'horse') {
                    // 显示正确位置（可以用特殊标记）
                    const cellComp = cell.node.getComponent('Cell');
                    if (cellComp) {
                        cellComp.showHint();
                    }
                }
            }
        }
    }

    resetGame() {
        // 重置游戏
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
        
        // 清空格子
        if (this.gridContainer) {
            this.gridContainer.removeAllChildren();
        }
        
        // 重新初始化
        this.initGame();
    }

    onDestroy() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    }
}