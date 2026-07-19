/**
 * Main Application Controller
 */
class IsometricChessApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.game = new ChessGame();
        this.board = new IsometricBoard(this.canvas);
        this.input = new InputHandler(this.canvas, this.game, this.board);

        this.turnDot   = document.getElementById('turnDot');
        this.turnName  = document.getElementById('turnName');
        this.statusText = document.getElementById('statusText');
        this.statusPanel = document.getElementById('statusPanel');
        this.moveTableBody = document.querySelector('#moveTable tbody');
        this.noMoves = document.getElementById('noMoves');

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.game.reset();
            this.board.deselect();
            this.board.setCheckSquare(null);
            this.board.lastMovedFrom = null;
            this.board.lastMovedTo = null;
        });

        window.addEventListener('resize', () => this.board.resize());

        this.board.resize();
        this.loop();
    }

    loop() {
        this.board.draw(this.game.board);
        this.updateUI();
        requestAnimationFrame(() => this.loop());
    }

    updateUI() {
        const isWhite = this.game.currentPlayer === PieceColor.WHITE;

        // Turn indicator
        this.turnDot.className = 'turn-dot ' + (isWhite ? 'white' : 'black');
        this.turnName.textContent = isWhite ? 'White' : 'Black';

        // Status
        const status = this.game.getStatusString();
        this.statusText.textContent = status;

        this.statusPanel.classList.remove('check', 'over');
        if (this.game.gameStatus === 'check') {
            this.statusPanel.classList.add('check');
        } else if (this.game.gameStatus === 'checkmate' || this.game.gameStatus === 'stalemate') {
            this.statusPanel.classList.add('over');
        }

        // Check highlight on king
        if (this.game.gameStatus === 'check' || this.game.gameStatus === 'checkmate') {
            const k = this.findKing(this.game.currentPlayer);
            this.board.setCheckSquare(k ? k.row : null, k ? k.col : null);
        } else {
            this.board.setCheckSquare(null);
        }

        // Move history table
        const history = this.game.getMoveHistory();
        if (history.length === 0) {
            this.noMoves.style.display = 'block';
            this.moveTableBody.innerHTML = '';
        } else {
            this.noMoves.style.display = 'none';
            this.moveTableBody.innerHTML = '';
            for (let i = 0; i < history.length; i += 2) {
                const tr = document.createElement('tr');
                const num = document.createElement('td');
                num.className = 'num';
                num.textContent = (Math.floor(i / 2) + 1) + '.';
                tr.appendChild(num);

                const w = document.createElement('td');
                w.className = 'white-move';
                w.textContent = history[i].notation;
                tr.appendChild(w);

                const b = document.createElement('td');
                b.className = 'black-move';
                b.textContent = (history[i + 1] ? history[i + 1].notation : '');
                tr.appendChild(b);

                this.moveTableBody.appendChild(tr);
            }
        }
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
}

document.addEventListener('DOMContentLoaded', () => new IsometricChessApp());
