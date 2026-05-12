import { _decorator, Component, Node, Sprite, Color, Label, UITransform, EventHandler, Button, input, Input, EventTouch } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Cell')
export class Cell extends Component {
    @property(Sprite)
    backgroundSprite: Sprite = null;
    
    @property(Label)
    displayLabel: Label = null;
    
    @property(Sprite)
    markSprite: Sprite = null;
    
    private row: number = 0;
    private col: number = 0;
    private gameController: any = null;
    private clickTimer: number = null;
    private isWaitingForDoubleClick: boolean = false;
    private originalColor: Color = null;
    
    // 不同状态的显示颜色
    private readonly crossColor = new Color(150, 150, 150, 255);
    private readonly horseColor = new Color(100, 200, 100, 255);
    private readonly hintColor = new Color(255, 200, 100, 255);
    
    start() {
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
    
    onTouchEnd(event: EventTouch) {
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
            this.isWaitingForDoubleClick = false;
            this.onDoubleClick();
        } else {
            this.isWaitingForDoubleClick = true;
            this.clickTimer = setTimeout(() => {
                if (this.isWaitingForDoubleClick) {
                    this.onSingleClick();
                }
                this.clickTimer = null;
                this.isWaitingForDoubleClick = false;
            }, 200);
        }
    }
    
    onSingleClick() {
        if (this.gameController) {
            this.gameController.onCellClick(this.row, this.col);
        }
    }
    
    onDoubleClick() {
        if (this.gameController) {
            this.gameController.onCellDoubleClick(this.row, this.col);
        }
    }
    
    init(row: number, col: number, controller: any, regionColor: Color) {
        this.row = row;
        this.col = col;
        this.gameController = controller;
        this.originalColor = regionColor;
        
        // 设置背景颜色
        if (this.backgroundSprite) {
            this.backgroundSprite.color = regionColor;
        }
        
        // 设置显示文本（坐标）- 初始为空
        if (this.displayLabel) {
            this.displayLabel.string = "";
        }
    }
    
    // 获取对比色（用于文字显示）
    getContrastColor(color: Color): Color {
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
        return brightness > 128 ? new Color(0, 0, 0, 255) : new Color(255, 255, 255, 255);
    }
    
    updateDisplay(markType: 'none' | 'horse' | 'cross') {
        if (!this.displayLabel) return;
        
        switch (markType) {
            case 'horse':
                this.displayLabel.string = "🐴";
                this.displayLabel.color = new Color(0, 0, 0, 255);
                if (this.markSprite) {
                    this.markSprite.node.active = true;
                    const label = this.markSprite.node.getComponent(Label);
                    if (label) label.string = "🐴";
                }
                break;
            case 'cross':
                this.displayLabel.string = "❌";
                this.displayLabel.color = new Color(0, 0, 0, 255);
                if (this.markSprite) {
                    this.markSprite.node.active = true;
                    const label = this.markSprite.node.getComponent(Label);
                    if (label) label.string = "❌";
                }
                break;
            default:
                this.displayLabel.string = "";
                if (this.markSprite) {
                    this.markSprite.node.active = false;
                }
                break;
        }
    }
    
    showHint() {
        if (this.displayLabel) {
            this.displayLabel.string = "🐴";
            this.displayLabel.color = new Color(0, 0, 0, 255);
        }
    }
    
    onDestroy() {
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
        }
    }
}