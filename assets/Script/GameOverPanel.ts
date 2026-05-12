import { _decorator, Component, Node, Label, Button } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('GameOverPanel')
export class GameOverPanel extends Component {
    @property(Label) buttonLabel: Label = null;
    @property(Button) actionButton: Button = null;

    private onButtonClick: () => void = null;

    show(isWin: boolean, onClick: () => void) {
        this.onButtonClick = onClick;
        this.buttonLabel.string = isWin ? '下一关' : '再来一次';
        this.node.active = true;
        this.actionButton.node.once(Button.EventType.CLICK, this.handleClick, this);
    }

    hide() {
        this.node.active = false;
    }

    private handleClick() {
        this.hide();
        this.onButtonClick?.();
    }
}
