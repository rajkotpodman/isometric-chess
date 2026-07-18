/**
 * Main Application Controller
 */

class IsometricChessApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = new ChessGame();
        this.board = new IsometricBoard(this.canvas);
        this.input = new InputHandler(this.canvas, this.game, this.board);
        
        this.setupUI();
        this.resize();
        this.gameLoop();
    }

    setupUI() {
        // New Game button
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.game.reset();
            this.board.deselect();
            this.updateUI();
        });
        
        // Reset View button
        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.resize();
        });
        
        // Window resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.board.resize();
    }

    updateUI() {
        // Update player turn
        const playerText = this.game.currentPlayer === PieceColor.WHITE ? '⚪ White' : '⚫ Black';
        document.getElementById('currentPlayer').textContent = playerText;
        
        // Update game status
        document.getElementById('gameStatus').textContent = this.game.getStatusString();
        
        // Update move history
        const moveList = document.getElementById('moveList');
        moveList.innerHTML = '';
        
        const moves = this.game.getMoveHistory();
        moves.forEach(move => {
            const li = document.createElement('li');
            li.textContent = move.displayText;
            moveList.appendChild(li);
        });
        
        // Scroll to bottom
        moveList.scrollTop = moveList.scrollHeight;
    }

    gameLoop() {
        // Update and render
        this.board.draw(this.game.board);
        this.updateUI();
        
        // Request next frame
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new IsometricChessApp();
});