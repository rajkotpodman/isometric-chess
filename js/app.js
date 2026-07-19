class IsometricChessApp {
    constructor() {
        this.canvas    = document.getElementById('gameCanvas');
        this.game      = new ChessGame();
        this.board     = new IsometricBoard(this.canvas);
        this.input     = new InputHandler(this.canvas, this.game, this.board);

        this.turnDot   = document.getElementById('turnDot');
        this.turnName  = document.getElementById('turnName');
        this.statusText = document.getElementById('statusText');
        this.statusPanel = document.getElementById('statusPanel');
        this.moveBody  = document.querySelector('#moveTable tbody');
        this.noMoves   = document.getElementById('noMoves');

        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.game.reset();
            this.board.deselect();
            this.board.setCheckSquare(null);
            this.board.lastFrom = null;
            this.board.lastTo   = null;
        });

        window.addEventListener('resize', () => this.board.resize());
        window.addEventListener('load',  () => this.board.resize());

        requestAnimationFrame(() => {
            this.board.resize();
            this._loop();
        });
    }

    _loop() {
        this.board.draw(this.game.board);
        this._updateUI();
        requestAnimationFrame(() => this._loop());
    }

    _updateUI() {
        const isW = this.game.currentPlayer === PieceColor.WHITE;

        // Turn indicator
        this.turnDot.className  = 'turn-dot ' + (isW ? 'white' : 'black');
        this.turnName.textContent = isW ? 'White' : 'Black';

        // Status
        this.statusText.textContent = this.game.statusString();
        this.statusPanel.classList.remove('check', 'over');
        if (this.game.status === 'check') this.statusPanel.classList.add('check');
        if (this.game.status === 'checkmate' || this.game.status === 'stalemate')
            this.statusPanel.classList.add('over');

        // Check square highlight
        if (this.game.status === 'check' || this.game.status === 'checkmate') {
            const k = this.game.findKing(this.game.currentPlayer);
            this.board.setCheckSquare(k);
        } else {
            this.board.setCheckSquare(null);
        }

        // History
        const hist = this.game.formattedHistory();
        if (hist.length === 0) {
            this.noMoves.style.display = '';
            this.moveBody.innerHTML = '';
        } else {
            this.noMoves.style.display = 'none';
            this.moveBody.innerHTML = hist.map(h => `
                <tr>
                    <td class="num">${h.n}.</td>
                    <td class="white-move">${h.w}</td>
                    <td class="black-move">${h.b}</td>
                </tr>`).join('');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new IsometricChessApp());
