/**
 * Main Application Controller
 */

class IsometricChessApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = new ChessGame();
        this.board = new IsometricBoard(this.canvas);
        this.input = new InputHandler(this.canvas, this.game, this.board);

        this.statusBanner = document.getElementById('statusBanner');
        this.statusCard = document.getElementById('gameStatus').parentElement;

        this.setupUI();
        this.resize();
        this.gameLoop();
    }

    setupUI() {
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.game.reset();
            this.board.deselect();
            this.board.setCheckSquare(null);
            this.updateUI();
        });

        document.getElementById('resetViewBtn').addEventListener('click', () => {
            this.board.deselect();
            this.game.deselectPiece();
            this.resize();
        });

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.board.resize();
    }

    updateUI() {
        const isWhite = this.game.currentPlayer === PieceColor.WHITE;

        // Turn chip + name
        const chip = document.getElementById('turnIndicator');
        chip.className = 'turn-chip ' + (isWhite ? 'white' : 'black');
        document.getElementById('currentPlayer').textContent = isWhite ? 'White' : 'Black';

        // Status text + banner styling
        const status = this.game.getStatusString();
        document.getElementById('gameStatus').textContent = status;
        this.statusBanner.textContent = status;

        this.statusBanner.classList.remove('check', 'over');
        this.statusCard.classList.remove('check', 'over');

        if (this.game.gameStatus === 'check') {
            this.statusBanner.classList.add('check');
            this.statusCard.classList.add('check');
        } else if (this.game.gameStatus === 'checkmate' || this.game.gameStatus === 'stalemate') {
            this.statusBanner.classList.add('over');
            this.statusCard.classList.add('over');
        }

        // Check square highlight on the king of the side to move
        if (this.game.gameStatus === 'check' || this.game.gameStatus === 'checkmate') {
            const kingPos = this.findKing(this.game.currentPlayer);
            this.board.setCheckSquare(kingPos ? kingPos.row : null, kingPos ? kingPos.col : null);
        } else {
            this.board.setCheckSquare(null);
        }

        // Move history
        const moveList = document.getElementById('moveList');
        moveList.innerHTML = '';
        const moves = this.game.getMoveHistory();
        moves.forEach(item => {
            const li = document.createElement('li');
            if (item.isWhiteMove) {
                const num = document.createElement('span');
                num.className = 'num';
                num.textContent = item.moveNumber + '.';
                li.appendChild(num);
            } else {
                li.appendChild(document.createElement('span'));
            }
            const txt = document.createElement('span');
            txt.textContent = item.notation;
            li.appendChild(txt);
            moveList.appendChild(li);
        });
        moveList.scrollTop = moveList.scrollHeight;
    }

    findKing(color) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.game.board[r][c];
                if (p && p.type === PieceType.KING && p.color === color) {
                    return { row: r, col: c };
                }
            }
        }
        return null;
    }

    gameLoop() {
        this.board.draw(this.game.board);
        this.updateUI();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IsometricChessApp();
});
