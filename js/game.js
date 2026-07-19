class ChessGame {
    constructor() { this.reset(); }

    reset() {
        this.board         = createInitialBoard();
        this.currentPlayer = PieceColor.WHITE;
        this.history       = [];
        this.status        = 'playing'; // playing | check | checkmate | stalemate
        this.selectedPiece = null;
        this.validMoves    = [];
    }

    selectPiece(row, col) {
        const p = this.board[row][col];
        if (!p || p.color !== this.currentPlayer) { this.deselectPiece(); return null; }
        this.selectedPiece = {row, col, piece: p};
        this.validMoves    = p.getValidMoves(this.board);
        return this.validMoves;
    }

    deselectPiece() { this.selectedPiece = null; this.validMoves = []; }

    movePiece(toRow, toCol) {
        if (!this.selectedPiece) return false;
        const {row, col, piece} = this.selectedPiece;
        if (!this.validMoves.some(m => m.row === toRow && m.col === toCol)) return false;

        const captured = this.board[toRow][toCol];
        this.history.push({
            piece: piece.type,
            from: {row, col},
            to:   {row: toRow, col: toCol},
            notation: this._notation(piece, row, col, toRow, toCol, captured)
        });

        piece.row = toRow; piece.col = toCol; piece.hasMoved = true;
        this.board[toRow][toCol] = piece;
        this.board[row][col]     = null;

        this.currentPlayer = this.currentPlayer === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
        this._updateStatus();
        this.deselectPiece();
        return true;
    }

    _updateStatus() {
        const inCheck = this._isInCheck();
        const hasMoves = this._hasValidMoves();
        if (inCheck && !hasMoves)  this.status = 'checkmate';
        else if (inCheck)          this.status = 'check';
        else if (!hasMoves)        this.status = 'stalemate';
        else                       this.status = 'playing';
    }

    _isInCheck() {
        let kr = -1, kc = -1;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === PieceType.KING && p.color === this.currentPlayer)
                    { kr = r; kc = c; }
            }
        if (kr < 0) return false;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (!p || p.color === this.currentPlayer) continue;
                if (p._rawMoves(this.board).some(m => m.row === kr && m.col === kc)) return true;
            }
        return false;
    }

    _hasValidMoves() {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.color === this.currentPlayer && p.getValidMoves(this.board).length > 0)
                    return true;
            }
        return false;
    }

    _notation(piece, fr, fc, tr, tc, captured) {
        let n = piece.type !== PieceType.PAWN ? piece.type[0].toUpperCase() : '';
        if (captured) n += 'x';
        n += String.fromCharCode(97 + tc) + (8 - tr);
        return n;
    }

    findKing(color) {
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === PieceType.KING && p.color === color) return {row: r, col: c};
            }
        return null;
    }

    statusString() {
        const who = this.currentPlayer === PieceColor.WHITE ? 'White' : 'Black';
        if (this.status === 'checkmate') {
            const winner = this.currentPlayer === PieceColor.WHITE ? 'Black' : 'White';
            return `Checkmate — ${winner} wins!`;
        }
        if (this.status === 'stalemate') return 'Stalemate — Draw';
        if (this.status === 'check')     return `${who} is in check!`;
        return `${who}'s turn`;
    }

    formattedHistory() {
        const rows = [];
        for (let i = 0; i < this.history.length; i += 2)
            rows.push({ n: Math.floor(i/2)+1, w: this.history[i].notation, b: this.history[i+1]?.notation || '' });
        return rows;
    }
}
