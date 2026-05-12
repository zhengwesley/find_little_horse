import { GameStats } from './types';

export class GameState {
    private _currentLife: number = 0;
    private _remainingHorses: number = 0;
    private _gameTime: number = 0;
    private _isGameOver: boolean = false;
    private _isWin: boolean = false;
    
    private onStateChange?: () => void;
    
    constructor(onStateChange?: () => void) {
        this.onStateChange = onStateChange;
    }
    
    init(life: number, horses: number) {
        this._currentLife = life;
        this._remainingHorses = horses;
        this._gameTime = 0;
        this._isGameOver = false;
        this._isWin = false;
        this.notifyChange();
    }
    
    get currentLife(): number { return this._currentLife; }
    get remainingHorses(): number { return this._remainingHorses; }
    get gameTime(): number { return this._gameTime; }
    get isGameOver(): boolean { return this._isGameOver; }
    get isWin(): boolean { return this._isWin; }
    
    decrementLife(): boolean {
        this._currentLife--;
        this.notifyChange();
        if (this._currentLife <= 0) {
            this._isGameOver = true;
            return false;
        }
        return true;
    }
    
    decrementHorse() {
        this._remainingHorses--;
        this.notifyChange();
        if (this._remainingHorses === 0) {
            this._isWin = true;
            this._isGameOver = true;
        }
    }
    
    incrementTime() {
        if (!this._isGameOver && !this._isWin) {
            this._gameTime++;
            this.notifyChange();
        }
    }
    
    gameOver() {
        this._isGameOver = true;
        this.notifyChange();
    }
    
    private notifyChange() {
        if (this.onStateChange) this.onStateChange();
    }
    
    getSnapshot(): GameStats {
        return {
            currentLife: this._currentLife,
            remainingHorses: this._remainingHorses,
            gameTime: this._gameTime,
            isGameOver: this._isGameOver,
            isWin: this._isWin
        };
    }
}