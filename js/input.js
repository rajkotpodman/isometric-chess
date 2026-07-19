/**
 * Input Handling - Mouse and Touch Events
 */

class InputHandler {
    constructor(canvas, game, board) {
        this.canvas = canvas;
        this.game = game;
        this.board = board;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchCoordinates(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    handleClick(e) {
        const { x, y } = this.getCanvasCoordinates(e);
        const boardPos = this.board.screenToBoard(x, y);
        
        if (!boardPos) return;
        
        // If a piece is selected and clicking on a valid move
        if (this.board.selectedSquare) {
            const isValidMove = this.board.validMoves.some(
                m => m.row === boardPos.row && m.col === boardPos.col
            );
            
            if (isValidMove) {
                // Execute move
                const fromRow = this.board.selectedSquare.row;
                const fromCol = this.board.selectedSquare.col;
                const toRow = boardPos.row;
                const toCol = boardPos.col;
                
                this.game.movePiece(toRow, toCol);
                this.board.recordMove(fromRow, fromCol, toRow, toCol);
                this.board.deselect();
                
                return;
            }
        }
        
        // Try to select a piece at this position
        const piece = this.game.board[boardPos.row][boardPos.col];
        
        if (piece && piece.color === this.game.currentPlayer) {
            // Select this piece
            const validMoves = this.game.selectPiece(boardPos.row, boardPos.col);
            if (validMoves) {
                this.board.selectSquare(boardPos.row, boardPos.col);
                this.board.setValidMoves(validMoves);
            }
        } else if (this.board.selectedSquare) {
            // Clicking on empty square or opponent's piece while a piece is selected
            this.board.deselect();
        }
    }

    handleMouseMove(e) {
        const { x, y } = this.getCanvasCoordinates(e);
        const boardPos = this.board.screenToBoard(x, y);
        
        if (boardPos) {
            this.board.hoverSquare(boardPos.row, boardPos.col);
        } else {
            this.board.clearHover();
        }
    }

    handleMouseLeave(e) {
        this.board.clearHover();
    }

    handleRightClick(e) {
        e.preventDefault();
        this.board.deselect();
        this.game.deselectPiece();
    }

    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const { x, y } = this.getTouchCoordinates(e.touches[0]);
            const boardPos = this.board.screenToBoard(x, y);
            
            if (!boardPos) return;
            
            // Try to select a piece
            const piece = this.game.board[boardPos.row][boardPos.col];
            if (piece && piece.color === this.game.currentPlayer) {
                const validMoves = this.game.selectPiece(boardPos.row, boardPos.col);
                if (validMoves) {
                    this.board.selectSquare(boardPos.row, boardPos.col);
                    this.board.setValidMoves(validMoves);
                }
            }
        }
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const { x, y } = this.getTouchCoordinates(e.touches[0]);
            const boardPos = this.board.screenToBoard(x, y);
            
            if (boardPos) {
                this.board.hoverSquare(boardPos.row, boardPos.col);
            }
        }
    }

    handleTouchEnd(e) {
        if (this.board.selectedSquare && this.board.highlightedSquare) {
            const boardPos = this.board.highlightedSquare;
            
            // Check if it's a valid move
            const isValidMove = this.board.validMoves.some(
                m => m.row === boardPos.row && m.col === boardPos.col
            );
            
            if (isValidMove) {
                const fromRow = this.board.selectedSquare.row;
                const fromCol = this.board.selectedSquare.col;
                const toRow = boardPos.row;
                const toCol = boardPos.col;
                
                this.game.movePiece(toRow, toCol);
                this.board.recordMove(fromRow, fromCol, toRow, toCol);
                this.board.deselect();
            }
        }
    }
}