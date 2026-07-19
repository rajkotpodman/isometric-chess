class InputHandler {
    constructor(canvas, game, board) {
        this.canvas = canvas;
        this.game   = game;
        this.board  = board;
        canvas.addEventListener('click',       e => this._onClick(e));
        canvas.addEventListener('mousemove',   e => this._onMove(e));
        canvas.addEventListener('mouseleave',  () => this.board.clearHover());
        canvas.addEventListener('contextmenu', e => { e.preventDefault(); this._deselect(); });
        canvas.addEventListener('touchstart',  e => { e.preventDefault(); this._onTouch(e); }, {passive:false});
    }

    _xy(e) {
        const r = this.canvas.getBoundingClientRect();
        return {x: e.clientX - r.left, y: e.clientY - r.top};
    }

    _onClick(e) {
        const {x, y} = this._xy(e);
        const pos = this.board.toBoard(x, y);
        if (!pos) { this._deselect(); return; }

        // Move if a valid target is clicked
        if (this.board.selected) {
            const isValid = this.board.validMoves.some(m => m.row === pos.row && m.col === pos.col);
            if (isValid) {
                const {row: fr, col: fc} = this.board.selected;
                this.game.movePiece(pos.row, pos.col);
                this.board.recordMove(fr, fc, pos.row, pos.col);
                this.board.deselect();
                return;
            }
        }

        // Select own piece
        const piece = this.game.board[pos.row][pos.col];
        if (piece && piece.color === this.game.currentPlayer) {
            const moves = this.game.selectPiece(pos.row, pos.col);
            if (moves) {
                this.board.selectSquare(pos.row, pos.col);
                this.board.setValidMoves(moves);
            }
        } else {
            this._deselect();
        }
    }

    _onMove(e) {
        const {x, y} = this._xy(e);
        const pos = this.board.toBoard(x, y);
        if (pos) this.board.hoverSquare(pos.row, pos.col);
        else     this.board.clearHover();
    }

    _onTouch(e) {
        if (e.touches.length) {
            const t = e.touches[0];
            this._onClick({clientX: t.clientX, clientY: t.clientY});
        }
    }

    _deselect() {
        this.board.deselect();
        this.game.deselectPiece();
    }
}
