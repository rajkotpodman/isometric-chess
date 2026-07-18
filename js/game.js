/**
 * Game State and Logic
 */

class ChessGame {
    constructor() {
        this.board = createInitialBoard();
        this.currentPlayer = PieceColor.WHITE;
        this.moveHistory = [];
        this.gameStatus = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate'
        this.selectedPiece = null;
        this.validMoves = [];
    }

    /**
     * Get current board state
     */
    getBoard() {
        return this.board;
    }

    /**
     * Select a piece at position
     */
    selectPiece(row, col) {
        const piece = this.board[row][col];
        
        if (!piece) {
            this.selectedPiece = null;
            this.validMoves = [];
            return null;
        }
        
        if (piece.color !== this.currentPlayer) {
            return null;
        }
        
        this.selectedPiece = { row, col, piece };
        this.validMoves = piece.getValidMoves(this.board);
        
        return this.validMoves;
    }

    /**
     * Deselect piece
     */
    deselectPiece() {
        this.selectedPiece = null;
        this.validMoves = [];
    }

    /**
     * Move a piece
     */
    movePiece(toRow, toCol) {
        if (!this.selectedPiece) {
            return false;
        }
        
        const { row, col, piece } = this.selectedPiece;
        
        // Check if move is valid
        const isValidMove = this.validMoves.some(m => m.row === toRow && m.col === toCol);
        if (!isValidMove) {
            return false;
        }
        
        // Record move
        const capturedPiece = this.board[toRow][toCol];
        this.moveHistory.push({
            piece: piece.type,
            from: { row, col },
            to: { row: toRow, col: toCol },
            captured: capturedPiece ? capturedPiece.type : null,
            notation: this.getMoveNotation(piece, row, col, toRow, toCol, capturedPiece)
        });
        
        // Execute move
        piece.position = { row: toRow, col: toCol };
        piece.hasMoved = true;
        this.board[toRow][toCol] = piece;
        this.board[row][col] = null;
        
        // Switch player
        this.currentPlayer = this.currentPlayer === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
        
        // Update game status
        this.updateGameStatus();
        
        // Deselect
        this.deselectPiece();
        
        return true;
    }

    /**
     * Get valid moves for a square
     */
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        return piece.getValidMoves(this.board);
    }

    /**
     * Check if current player is in check
     */
    isInCheck() {
        let kingPos = null;
        
        // Find king
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.type === PieceType.KING && p.color === this.currentPlayer) {
                    kingPos = { row: r, col: c };
                    break;
                }
            }
        }
        
        if (!kingPos) return false;
        
        // Check if any enemy piece can capture the king
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.color !== this.currentPlayer) {
                    const moves = this.getMovesWithoutCheckValidation(p, r, c);
                    if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    /**
     * Check if current player has any valid moves
     */
    hasValidMoves() {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = this.board[r][c];
                if (p && p.color === this.currentPlayer) {
                    if (p.getValidMoves(this.board).length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Helper to get moves without check validation
     */
    getMovesWithoutCheckValidation(piece, row, col) {
        // Create temporary piece with position set
        const tempPiece = piece.clone();
        tempPiece.position = { row, col };
        
        const moves = [];
        switch (tempPiece.type) {
            case PieceType.PAWN:
                moves.push(...tempPiece.getPawnMoves(this.board));
                break;
            case PieceType.KNIGHT:
                moves.push(...tempPiece.getKnightMoves(this.board));
                break;
            case PieceType.BISHOP:
                moves.push(...tempPiece.getBishopMoves(this.board));
                break;
            case PieceType.ROOK:
                moves.push(...tempPiece.getRookMoves(this.board));
                break;
            case PieceType.QUEEN:
                moves.push(...tempPiece.getQueenMoves(this.board));
                break;
            case PieceType.KING:
                moves.push(...tempPiece.getKingMoves(this.board));
                break;
        }
        return moves;
    }

    /**
     * Update game status (check, checkmate, stalemate)
     */
    updateGameStatus() {
        if (this.isInCheck()) {
            if (!this.hasValidMoves()) {
                this.gameStatus = 'checkmate';
            } else {
                this.gameStatus = 'check';
            }
        } else {
            if (!this.hasValidMoves()) {
                this.gameStatus = 'stalemate';
            } else {
                this.gameStatus = 'playing';
            }
        }
    }

    /**
     * Get move notation (simplified)
     */
    getMoveNotation(piece, fromRow, fromCol, toRow, toCol, capturedPiece) {
        const fromPos = String.fromCharCode(97 + fromCol) + (8 - fromRow);
        const toPos = String.fromCharCode(97 + toCol) + (8 - toRow);
        
        let notation = '';
        
        if (piece.type !== PieceType.PAWN) {
            notation += piece.type[0].toUpperCase();
        }
        
        if (capturedPiece) {
            notation += 'x';
        }
        
        notation += toPos;
        
        return notation;
    }

    /**
     * Get game status string
     */
    getStatusString() {
        switch (this.gameStatus) {
            case 'check':
                return `${this.currentPlayer.toUpperCase()} in Check`;
            case 'checkmate':
                const winner = this.currentPlayer === PieceColor.WHITE ? 'Black' : 'White';
                return `Checkmate! ${winner} wins`;
            case 'stalemate':
                return 'Stalemate - Draw';
            default:
                return `${this.currentPlayer.toUpperCase()}'s turn`;
        }
    }

    /**
     * Check if game is over
     */
    isGameOver() {
        return this.gameStatus === 'checkmate' || this.gameStatus === 'stalemate';
    }

    /**
     * Reset the game
     */
    reset() {
        this.board = createInitialBoard();
        this.currentPlayer = PieceColor.WHITE;
        this.moveHistory = [];
        this.gameStatus = 'playing';
        this.selectedPiece = null;
        this.validMoves = [];
    }

    /**
     * Get formatted move history
     */
    getMoveHistory() {
        return this.moveHistory.map((move, index) => {
            const moveNumber = Math.floor(index / 2) + 1;
            const isWhiteMove = index % 2 === 0;
            const prefix = isWhiteMove ? `${moveNumber}.` : '';
            return {
                moveNumber,
                notation: move.notation,
                displayText: `${prefix} ${move.notation}`
            };
        });
    }
}