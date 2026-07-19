const PieceType  = { PAWN:'pawn', KNIGHT:'knight', BISHOP:'bishop', ROOK:'rook', QUEEN:'queen', KING:'king' };
const PieceColor = { WHITE:'white', BLACK:'black' };

class Piece {
    constructor(type, color, row, col) {
        this.type     = type;
        this.color    = color;
        this.row      = row;
        this.col      = col;
        this.hasMoved = false;
    }

    clone() {
        const p = new Piece(this.type, this.color, this.row, this.col);
        p.hasMoved = this.hasMoved;
        return p;
    }

    getValidMoves(board) {
        return this._rawMoves(board).filter(m => !this._leavesKingInCheck(board, m));
    }

    _rawMoves(board) {
        switch (this.type) {
            case PieceType.PAWN:   return this._pawnMoves(board);
            case PieceType.KNIGHT: return this._knightMoves(board);
            case PieceType.BISHOP: return this._slideMoves(board, [[-1,-1],[-1,1],[1,-1],[1,1]]);
            case PieceType.ROOK:   return this._slideMoves(board, [[-1,0],[1,0],[0,-1],[0,1]]);
            case PieceType.QUEEN:  return this._slideMoves(board, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
            case PieceType.KING:   return this._kingMoves(board);
        }
        return [];
    }

    _pawnMoves(board) {
        const moves = [];
        const dir   = this.color === PieceColor.WHITE ? -1 : 1;
        const start = this.color === PieceColor.WHITE ? 6 : 1;
        const r1    = this.row + dir;

        if (this._inBounds(r1, this.col) && !board[r1][this.col]) {
            moves.push({row: r1, col: this.col});
            if (this.row === start) {
                const r2 = this.row + 2 * dir;
                if (!board[r2][this.col]) moves.push({row: r2, col: this.col});
            }
        }
        for (const dc of [-1, 1]) {
            const c = this.col + dc;
            if (this._inBounds(r1, c) && board[r1][c] && board[r1][c].color !== this.color)
                moves.push({row: r1, col: c});
        }
        return moves;
    }

    _knightMoves(board) {
        const moves = [];
        for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
            const r = this.row + dr, c = this.col + dc;
            if (this._inBounds(r, c) && (!board[r][c] || board[r][c].color !== this.color))
                moves.push({row: r, col: c});
        }
        return moves;
    }

    _slideMoves(board, dirs) {
        const moves = [];
        for (const [dr, dc] of dirs) {
            let r = this.row + dr, c = this.col + dc;
            while (this._inBounds(r, c)) {
                if (!board[r][c])           { moves.push({row: r, col: c}); r += dr; c += dc; }
                else if (board[r][c].color !== this.color) { moves.push({row: r, col: c}); break; }
                else break;
            }
        }
        return moves;
    }

    _kingMoves(board) {
        const moves = [];
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                if (!dr && !dc) continue;
                const r = this.row + dr, c = this.col + dc;
                if (this._inBounds(r, c) && (!board[r][c] || board[r][c].color !== this.color))
                    moves.push({row: r, col: c});
            }
        return moves;
    }

    _leavesKingInCheck(board, move) {
        // Simulate move
        const b = board.map(row => row.slice());
        const p = b[this.row][this.col].clone();
        p.row = move.row; p.col = move.col;
        b[this.row][this.col] = null;
        b[move.row][move.col] = p;

        // Find our king
        let kr = -1, kc = -1;
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++)
                if (b[r][c] && b[r][c].type === PieceType.KING && b[r][c].color === this.color)
                    { kr = r; kc = c; }

        // Check if any enemy attacks king
        for (let r = 0; r < 8; r++)
            for (let c = 0; c < 8; c++) {
                const ep = b[r][c];
                if (!ep || ep.color === this.color) continue;
                const tmp = ep.clone(); tmp.row = r; tmp.col = c;
                if (tmp._rawMoves(b).some(m => m.row === kr && m.col === kc)) return true;
            }
        return false;
    }

    _inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
}

function createInitialBoard() {
    const b    = Array.from({length: 8}, () => Array(8).fill(null));
    const back = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
                  PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK];
    for (let c = 0; c < 8; c++) {
        b[0][c] = new Piece(back[c],       PieceColor.BLACK, 0, c);
        b[1][c] = new Piece(PieceType.PAWN, PieceColor.BLACK, 1, c);
        b[6][c] = new Piece(PieceType.PAWN, PieceColor.WHITE, 6, c);
        b[7][c] = new Piece(back[c],        PieceColor.WHITE, 7, c);
    }
    return b;
}
