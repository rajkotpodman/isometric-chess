/**
 * Isometric Board Renderer
 * Handles conversion between board coordinates and isometric screen coordinates
 */

class IsometricBoard {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Larger isometric projection parameters
        this.tileWidth = 70;
        this.tileHeight = 35;
        this.boardOriginX = canvas.width / 2;
        this.boardOriginY = canvas.height / 2 + 60;
        
        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightedSquare = null;
        this.lastMovedFrom = null;
        this.lastMovedTo = null;
    }

    /**
     * Convert board coordinates to isometric screen coordinates
     * @param {number} row - Board row (0-7)
     * @param {number} col - Board col (0-7)
     * @returns {Object} { x, y } screen coordinates
     */
    boardToScreen(row, col) {
        // Improved isometric projection formula
        const x = (col - row) * (this.tileWidth / 2);
        const y = (col + row) * (this.tileHeight / 2);
        
        return {
            x: this.boardOriginX + x,
            y: this.boardOriginY + y
        };
    }

    /**
     * Convert screen coordinates to board position
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object|null} { row, col } or null if invalid
     */
    screenToBoard(screenX, screenY) {
        // Translate to origin
        const x = screenX - this.boardOriginX;
        const y = screenY - this.boardOriginY;
        
        // Inverse isometric projection
        const col = (x / (this.tileWidth / 2) + y / (this.tileHeight / 2)) / 2;
        const row = (y / (this.tileHeight / 2) - x / (this.tileWidth / 2)) / 2;
        
        // Round to nearest board position
        const boardRow = Math.round(row);
        const boardCol = Math.round(col);
        
        // Validate position
        if (boardRow >= 0 && boardRow < 8 && boardCol >= 0 && boardCol < 8) {
            return { row: boardRow, col: boardCol };
        }
        
        return null;
    }

    /**
     * Get the center point of a board square
     */
    getSquareCenter(row, col) {
        return this.boardToScreen(row, col);
    }

    /**
     * Get the four corner points of an isometric square
     */
    getSquarePoints(row, col) {
        const center = this.getSquareCenter(row, col);
        return [
            { x: center.x, y: center.y - this.tileHeight / 2 }, // top
            { x: center.x + this.tileWidth / 2, y: center.y },   // right
            { x: center.x, y: center.y + this.tileHeight / 2 }, // bottom
            { x: center.x - this.tileWidth / 2, y: center.y }    // left
        ];
    }

    /**
     * Draw the complete board
     */
    draw(board) {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#f5f7fa');
        gradient.addColorStop(1, '#e8eef5');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board squares (back to front for proper layering)
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                this.drawSquare(row, col, board);
            }
        }
        
        // Draw valid moves
        if (this.selectedSquare) {
            this.drawValidMoves();
        }
        
        // Draw pieces (back to front)
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]) {
                    this.drawPiece(board[row][col], row, col);
                }
            }
        }
        
        // Draw selection highlight
        if (this.selectedSquare) {
            this.drawSelectionHighlight(this.selectedSquare.row, this.selectedSquare.col);
        }
        
        // Draw hover highlight
        if (this.highlightedSquare) {
            this.drawHoverHighlight(this.highlightedSquare.row, this.highlightedSquare.col);
        }
    }

    /**
     * Draw a single square with 3D effect
     */
    drawSquare(row, col, board) {
        const points = this.getSquarePoints(row, col);
        
        // Determine color
        const isLight = (row + col) % 2 === 0;
        const isLastMove = (this.lastMovedFrom && this.lastMovedFrom.row === row && this.lastMovedFrom.col === col) ||
                          (this.lastMovedTo && this.lastMovedTo.row === row && this.lastMovedTo.col === col);
        
        let fillColor;
        if (isLastMove) {
            fillColor = '#f4d03f';
        } else {
            fillColor = isLight ? '#f5e6d3' : '#d4a574';
        }
        
        // Draw top face
        this.ctx.fillStyle = fillColor;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.lineTo(points[2].x, points[2].y);
        this.ctx.lineTo(points[3].x, points[3].y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw borders
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Add subtle 3D shading on edges
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(points[2].x, points[2].y);
        this.ctx.lineTo(points[3].x, points[3].y);
        this.ctx.stroke();
    }

    /**
     * Draw a chess piece with improved rendering
     */
    drawPiece(piece, row, col) {
        const center = this.getSquareCenter(row, col);
        const symbol = piece.getSymbol();
        
        // Draw shadow for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.font = 'bold 52px Arial Unicode MS, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbol, center.x + 2, center.y + 6);
        
        // Draw piece with better contrast
        this.ctx.fillStyle = piece.color === 'white' ? '#f5f5f5' : '#0a0a0a';
        this.ctx.strokeStyle = piece.color === 'white' ? '#333' : '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.fillText(symbol, center.x, center.y + 2);
        this.ctx.strokeText(symbol, center.x, center.y + 2);
    }

    /**
     * Draw valid moves with improved styling
     */
    drawValidMoves() {
        this.validMoves.forEach(move => {
            const center = this.getSquareCenter(move.row, move.col);
            
            // Larger, more visible move indicators
            this.ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(center.x, center.y, 16, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = 'rgba(52, 152, 219, 1)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        });
    }

    /**
     * Draw selection highlight with glow effect
     */
    drawSelectionHighlight(row, col) {
        const points = this.getSquarePoints(row, col);
        
        // Glow effect
        this.ctx.shadowColor = '#3498db';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.lineTo(points[2].x, points[2].y);
        this.ctx.lineTo(points[3].x, points[3].y);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw hover highlight
     */
    drawHoverHighlight(row, col) {
        const points = this.getSquarePoints(row, col);
        
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.lineTo(points[2].x, points[2].y);
        this.ctx.lineTo(points[3].x, points[3].y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Select a square
     */
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
    }

    /**
     * Deselect current square
     */
    deselect() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightedSquare = null;
    }

    /**
     * Set valid moves for display
     */
    setValidMoves(moves) {
        this.validMoves = moves;
    }

    /**
     * Highlight a square on hover
     */
    hoverSquare(row, col) {
        this.highlightedSquare = { row, col };
    }

    /**
     * Clear hover
     */
    clearHover() {
        this.highlightedSquare = null;
    }

    /**
     * Resize canvas to fit container properly
     */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const maxWidth = Math.min(900, rect.width - 20);
        const maxHeight = Math.min(900, rect.height - 20);
        
        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;
        
        this.boardOriginX = this.canvas.width / 2;
        this.boardOriginY = this.canvas.height / 2 + 60;
    }

    /**
     * Record last move for highlighting
     */
    recordMove(fromRow, fromCol, toRow, toCol) {
        this.lastMovedFrom = { row: fromRow, col: fromCol };
        this.lastMovedTo = { row: toRow, col: toCol };
    }
}