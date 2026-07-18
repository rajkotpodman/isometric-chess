/**
 * Piece Definitions and Types
 */

const PieceType = {
    PAWN: 'pawn',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    ROOK: 'rook',
    QUEEN: 'queen',
    KING: 'king'
};

const PieceColor = {
    WHITE: 'white',
    BLACK: 'black'
};

/**
 * Piece class - represents a single chess piece
 */
class Piece {
    constructor(type, color, position) {
        this.type = type;
        this.color = color;
        this.position = position; // { row, col }
        this.hasMoved = false; // for castling/pawn rules
    }

    /**
     * Get all valid moves for this piece
     * @param {Array} board - 8x8 board state
     * @returns {Array} Array of valid moves { row, col }
     */
    getValidMoves(board) {
        const moves = [];

        switch (this.type) {
            case PieceType.PAWN:
                moves.push(...this.getPawnMoves(board));
                break;
            case PieceType.KNIGHT:
                moves.push(...this.getKnightMoves(board));
                break;
            case PieceType.BISHOP:
                moves.push(...this.getBishopMoves(board));
                break;
            case PieceType.ROOK:
                moves.push(...this.getRookMoves(board));
                break;
            case PieceType.QUEEN:
                moves.push(...this.getQueenMoves(board));
                break;
            case PieceType.KING:
                moves.push(...this.getKingMoves(board));
                break;
        }

        // Filter out moves that would leave king in check
        return moves.filter(move => !this.wouldLeaveKingInCheck(board, move));
    }

    getPawnMoves(board) {
        const moves = [];
        const { row, col } = this.position;
        const direction = this.color === PieceColor.WHITE ? -1 : 1;
        const startRow = this.color === PieceColor.WHITE ? 6 : 1;

        // Forward move
        const forwardRow = row + direction;
        if (this.isValidPosition(forwardRow, col) && !board[forwardRow][col]) {
            moves.push({ row: forwardRow, col });

            // Double move from start
            if (row === startRow) {
                const doubleRow = row + 2 * direction;
                if (!board[doubleRow][col]) {
                    moves.push({ row: doubleRow, col });
                }
            }
        }

        // Captures
        [-1, 1].forEach(colOffset => {
            const captureRow = row + direction;
            const captureCol = col + colOffset;
            if (this.isValidPosition(captureRow, captureCol)) {
                const target = board[captureRow][captureCol];
                if (target && target.color !== this.color) {
                    moves.push({ row: captureRow, col: captureCol });
                }
            }
        });

        return moves;
    }

    getKnightMoves(board) {
        const moves = [];
        const { row, col } = this.position;
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        offsets.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target || target.color !== this.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });

        return moves;
    }

    getBishopMoves(board) {
        return this.getDiagonalMoves(board);
    }

    getRookMoves(board) {
        return this.getLinearMoves(board);
    }

    getQueenMoves(board) {
        return [
            ...this.getDiagonalMoves(board),
            ...this.getLinearMoves(board)
        ];
    }

    getKingMoves(board) {
        const moves = [];
        const { row, col } = this.position;

        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if (r === 0 && c === 0) continue;
                const newRow = row + r;
                const newCol = col + c;
                if (this.isValidPosition(newRow, newCol)) {
                    const target = board[newRow][newCol];
                    if (!target || target.color !== this.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                }
            }
        }

        return moves;
    }

    getDiagonalMoves(board) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        this.getDirectionalMoves(board, directions, moves);
        return moves;
    }

    getLinearMoves(board) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        this.getDirectionalMoves(board, directions, moves);
        return moves;
    }

    getDirectionalMoves(board, directions, moves) {
        const { row, col } = this.position;

        directions.forEach(([rowDir, colDir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + rowDir * i;
                const newCol = col + colDir * i;

                if (!this.isValidPosition(newRow, newCol)) break;

                const target = board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== this.color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        });
    }

    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    wouldLeaveKingInCheck(board, move) {
        // Create a copy of the board with the move
        const testBoard = board.map(row => [...row]);
        const piece = testBoard[this.position.row][this.position.col];
        testBoard[this.position.row][this.position.col] = null;
        testBoard[move.row][move.col] = piece;

        // Find our king
        let kingPos = null;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = testBoard[r][c];
                if (p && p.type === PieceType.KING && p.color === this.color) {
                    kingPos = { row: r, col: c };
                    break;
                }
            }
        }

        // Check if king is under attack
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = testBoard[r][c];
                if (p && p.color !== this.color) {
                    p.position = { row: r, col: c };
                    const enemyMoves = this.getMovesWithoutCheckValidation(p, testBoard);
                    if (enemyMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    getMovesWithoutCheckValidation(piece, board) {
        // Helper to get moves without recursive check validation
        const moves = [];
        switch (piece.type) {
            case PieceType.PAWN:
                moves.push(...this.getPawnMoves.call(piece, board));
                break;
            case PieceType.KNIGHT:
                moves.push(...this.getKnightMoves.call(piece, board));
                break;
            case PieceType.BISHOP:
                moves.push(...this.getBishopMoves.call(piece, board));
                break;
            case PieceType.ROOK:
                moves.push(...this.getRookMoves.call(piece, board));
                break;
            case PieceType.QUEEN:
                moves.push(...this.getQueenMoves.call(piece, board));
                break;
            case PieceType.KING:
                moves.push(...this.getKingMoves.call(piece, board));
                break;
        }
        return moves;
    }

    /**
     * Get symbol for rendering
     */
    getSymbol() {
        const symbols = {
            white: {
                pawn: '♙',
                rook: '♖',
                knight: '♘',
                bishop: '♗',
                queen: '♕',
                king: '♔'
            },
            black: {
                pawn: '♟',
                rook: '♜',
                knight: '♞',
                bishop: '♝',
                queen: '♛',
                king: '♚'
            }
        };
        return symbols[this.color][this.type];
    }

    /**
     * Clone the piece
     */
    clone() {
        const cloned = new Piece(this.type, this.color, { ...this.position });
        cloned.hasMoved = this.hasMoved;
        return cloned;
    }
}

/**
 * Create initial board state
 */
function createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place pawns
    for (let col = 0; col < 8; col++) {
        board[1][col] = new Piece(PieceType.PAWN, PieceColor.BLACK, { row: 1, col });
        board[6][col] = new Piece(PieceType.PAWN, PieceColor.WHITE, { row: 6, col });
    }

    // Place other pieces
    const backRow = [
        PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
        PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK
    ];

    backRow.forEach((type, col) => {
        board[0][col] = new Piece(type, PieceColor.BLACK, { row: 0, col });
        board[7][col] = new Piece(type, PieceColor.WHITE, { row: 7, col });
    });

    return board;
}