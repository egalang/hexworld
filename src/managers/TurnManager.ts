import { Player } from '../shared';

export class TurnManager {
    private currentPlayer: Player = 'blue';
    private turn = 1;
    private gameOver = false;

    getCurrentPlayer(): Player {
        return this.currentPlayer;
    }

    getTurn(): number {
        return this.turn;
    }

    isGameOver(): boolean {
        return this.gameOver;
    }

    nextPlayer(): Player {
        this.currentPlayer = this.currentPlayer === 'blue' ? 'red' : 'blue';
        this.turn++;
        return this.currentPlayer;
    }

    setCurrentPlayer(player: Player) {
        this.currentPlayer = player;
    }

    setTurn(turn: number) {
        this.turn = turn;
    }

    setGameOver() {
        this.gameOver = true;
    }

    setGameOverState(gameOver: boolean) {
        this.gameOver = gameOver;
    }

    reset() {
        this.currentPlayer = 'blue';
        this.turn = 1;
        this.gameOver = false;
    }
}
