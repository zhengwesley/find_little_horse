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
    
    // 不同状态的显示颜色
    private readonly normalColor = new Color(200, 200, 200, 255);
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
            // 已经有一个点击等待中，这是双击
            clearTimeout(this.clickTimer);
            this.clickTimer = null;
            this.isWaitingForDoubleClick = false;
            this.onDoubleClick();
        } else {
            // 第一次点击，等待看是否有第二次点击
            this.isWaitingForDoubleClick = true;
            this.clickTimer = setTimeout(() => {
                // 超时，执行单击
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
    
    init(row: number, col: number, controller: any) {
        this.row = row;
        this.col = col;
        this.gameController = controller;
        this.updateDisplay('none');
        
        // 设置显示文本（坐标）
        if (this.displayLabel) {
            const rowLetter = String.fromCharCode(65 + row); // A, B, C, D
            const colNumber = col + 1;
            this.displayLabel.string = `${rowLetter}${colNumber}`;
        }
    }
    
    updateDisplay(markType: 'none' | 'horse' | 'cross') {
        if (!this.backgroundSprite) return;
        
        switch (markType) {
            case 'horse':
                this.backgroundSprite.color = this.horseColor;
                if (this.markSprite) {
                    this.markSprite.node.active = true;
                    // 这里可以设置马的图片，暂时用文字代替
                    const label = this.markSprite.node.getComponent(Label);
                    if (label) label.string = "🐴";
                }
                if (this.displayLabel) this.displayLabel.string = "🐴";
                break;
            case 'cross':
                this.backgroundSprite.color = this.crossColor;
                if (this.markSprite) {
                    this.markSprite.node.active = true;
                    const label = this.markSprite.node.getComponent(Label);
                    if (label) label.string = "❌";
                }
                if (this.displayLabel) this.displayLabel.string = "❌";
                break;
            default:
                this.backgroundSprite.color = this.normalColor;
                if (this.markSprite) {
                    this.markSprite.node.active = false;
                }
                const rowLetter = String.fromCharCode(65 + this.row);
                const colNumber = this.col + 1;
                if (this.displayLabel) this.displayLabel.string = `${rowLetter}${colNumber}`;
                break;
        }
    }
    
    showHint() {
        if (this.backgroundSprite && this.markType !== 'horse') {
            this.backgroundSprite.color = this.hintColor;
            if (this.displayLabel) {
                this.displayLabel.string = "🐴";
            }
        }
    }
    
    onDestroy() {
        if (this.clickTimer) {
            clearTimeout(this.clickTimer);
        }
    }
}