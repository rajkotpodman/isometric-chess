/**
 * Isometric Board Renderer
 * Handles conversion between board coordinates and isometric screen coordinates.
 */

class IsometricBoard {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Projection parameters (recomputed on resize)
        this.tileWidth = 70;
        this.tileHeight = 35;
        this.boardOriginX = 0;
        this.boardOriginY = 0;

        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightedSquare = null;
        this.lastMovedFrom = null;
        this.lastMovedTo = null;
        this.checkSquare = null;

        // Light/dark square palette (warm wood tones)
        this.lightTop = '#f0d9b5';
        this.darkTop = '#b58863';
        this.lightEdge = '#e6c89b';
        this.darkEdge = '#a07a52';
        this.boardBorder = '#3a2a1a';
    }

    /**
     * Convert board coordinates to isometric screen coordinates.
     */
    boardToScreen(row, col) {
        const x = (col - row) * (this.tileWidth / 2);
        const y = (col + row) * (this.tileHeight / 2);
        return { x: this.boardOriginX + x, y: this.boardOriginY + y };
    }

    /**
     * Convert screen coordinates to a board position (or null if off-board).
     */
    screenToBoard(screenX, screenY) {
        const x = screenX - this.boardOriginX;
        const y = screenY - this.boardOriginY;

        const col = (x / (this.tileWidth / 2) + y / (this.tileHeight / 2)) / 2;
        const row = (y / (this.tileHeight / 2) - x / (this.tileWidth / 2)) / 2;

        const boardRow = Math.round(row);
        const boardCol = Math.round(col);

        if (boardRow >= 0 && boardRow < 8 && boardCol >= 0 && boardCol < 8) {
            return { row: boardRow, col: boardCol };
        }
        return null;
    }

    getSquareCenter(row, col) {
        return this.boardToScreen(row, col);
    }

    /**
     * Four corner points of an isometric tile.
     */
    getSquarePoints(row, col) {
        const center = this.getSquareCenter(row, col);
        const hw = this.tileWidth / 2;
        const hh = this.tileHeight / 2;
        return [
            { x: center.x, y: center.y - hh },      // top
            { x: center.x + hw, y: center.y },       // right
            { x: center.x, y: center.y + hh },       // bottom
            { x: center.x - hw, y: center.y }        // left
        ];
    }

    /**
     * Draw the full board: tiles, highlights, pieces (back-to-front).
     */
    draw(board) {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background gradient
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, '#1a1d2e');
        bg.addColorStop(1, '#0d0f1a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Subtle ambient glow behind the board
        const glow = ctx.createRadialGradient(
            this.boardOriginX, this.boardOriginY + this.tileHeight * 2, 20,
            this.boardOriginX, this.boardOriginY + this.tileHeight * 2, this.tileWidth * 6
        );
        glow.addColorStop(0, 'rgba(99, 179, 237, 0.18)');
        glow.addColorStop(1, 'rgba(99, 179, 237, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // Board base / "plinth" shadow
        this.drawPlinth();

        // Tiles (back to front: row 7 -> 0, col 0 -> 7)
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                this.drawSquare(row, col, board);
            }
        }

        // Last-move + check highlights (under pieces)
        if (this.lastMovedFrom) this.drawSquareTint(this.lastMovedFrom.row, this.lastMovedFrom.col, 'rgba(244, 208, 63, 0.35)');
        if (this.lastMovedTo) this.drawSquareTint(this.lastMovedTo.row, this.lastMovedTo.col, 'rgba(244, 208, 63, 0.45)');
        if (this.checkSquare) this.drawSquareTint(this.checkSquare.row, this.checkSquare.col, 'rgba(231, 76, 60, 0.55)');

        // Hover highlight
        if (this.highlightedSquare && !this.selectedSquare) {
            this.drawSquareTint(this.highlightedSquare.row, this.highlightedSquare.col, 'rgba(255, 255, 255, 0.10)');
        }

        // Valid move indicators (under pieces so captures still show the piece)
        if (this.selectedSquare) this.drawValidMoves(board);

        // Pieces (back to front)
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]) this.drawPiece(board[row][col], row, col);
            }
        }

        // Selection highlight (on top)
        if (this.selectedSquare) this.drawSelectionHighlight(this.selectedSquare.row, this.selectedSquare.col);
    }

    /**
     * Draw a subtle 3D plinth under the board for depth.
     */
    drawPlinth() {
        const ctx = this.ctx;
        const depth = Math.max(10, this.tileHeight * 0.8);

        // Corners of the full board (top diamond)
        const tl = this.boardToScreen(0, 0);
        const tr = this.boardToScreen(0, 7);
        const bl = this.boardToScreen(7, 0);
        const br = this.boardToScreen(7, 7);

        // Left side face
        ctx.fillStyle = '#2a1d12';
        ctx.beginPath();
        ctx.moveTo(tl.x, tl.y);
        ctx.lineTo(bl.x, bl.y);
        ctx.lineTo(bl.x, bl.y + depth);
        ctx.lineTo(tl.x, tl.y + depth);
        ctx.closePath();
        ctx.fill();

        // Bottom side face
        ctx.fillStyle = '#1f140b';
        ctx.beginPath();
        ctx.moveTo(bl.x, bl.y);
        ctx.lineTo(br.x, br.y);
        ctx.lineTo(br.x, br.y + depth);
        ctx.lineTo(bl.x, bl.y + depth);
        ctx.closePath();
        ctx.fill();

        // Right side face
        ctx.fillStyle = '#2a1d12';
        ctx.beginPath();
        ctx.moveTo(br.x, br.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(tr.x, tr.y + depth);
        ctx.lineTo(br.x, br.y + depth);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw a single tile with soft edge shading.
     */
    drawSquare(row, col, board) {
        const ctx = this.ctx;
        const points = this.getSquarePoints(row, col);
        const isLight = (row + col) % 2 === 0;

        ctx.fillStyle = isLight ? this.lightTop : this.darkTop;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.closePath();
        ctx.fill();

        // Top-left light edge
        ctx.strokeStyle = isLight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[3].x, points[3].y);
        ctx.lineTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.stroke();

        // Bottom-right dark edge
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.moveTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.stroke();
    }

    /**
     * Tint a tile with a translucent fill (for highlights).
     */
    drawSquareTint(row, col, color) {
        const ctx = this.ctx;
        const points = this.getSquarePoints(row, col);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw a chess piece with shadow + outline for readability.
     */
    drawPiece(piece, row, col) {
        const ctx = this.ctx;
        const center = this.getSquareCenter(row, col);
        const symbol = piece.getSymbol();
        const fontSize = Math.floor(this.tileWidth * 0.78);

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${fontSize}px "Segoe UI Symbol", "Arial Unicode MS", Arial, sans-serif`;

        // Soft drop shadow on the tile
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillText(symbol, center.x + 2, center.y + 4);

        // Piece body
        ctx.fillStyle = piece.color === 'white' ? '#fafafa' : '#1a1a1a';
        ctx.fillText(symbol, center.x, center.y);

        // Outline for contrast
        ctx.lineWidth = Math.max(1, fontSize * 0.04);
        ctx.strokeStyle = piece.color === 'white' ? '#2c2c2c' : '#f0f0f0';
        ctx.strokeText(symbol, center.x, center.y);

        ctx.restore();
    }

    /**
     * Draw valid-move dots (ring for captures, dot for empty squares).
     */
    drawValidMoves(board) {
        const ctx = this.ctx;
        this.validMoves.forEach(move => {
            const center = this.getSquareCenter(move.row, move.col);
            const target = board[move.row][move.col];
            const r = this.tileWidth * 0.18;

            if (target) {
                // Capture: ring around the square
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(center.x, center.y, this.tileWidth * 0.42, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Quiet move: filled dot
                ctx.fillStyle = 'rgba(52, 152, 219, 0.55)';
                ctx.beginPath();
                ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(52, 152, 219, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });
    }

    /**
     * Selection highlight with glow.
     */
    drawSelectionHighlight(row, col) {
        const ctx = this.ctx;
        const points = this.getSquarePoints(row, col);

        ctx.save();
        ctx.shadowColor = '#3498db';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.lineTo(points[3].x, points[3].y);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    selectSquare(row, col) { this.selectedSquare = { row, col }; }

    deselect() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightedSquare = null;
    }

    setValidMoves(moves) { this.validMoves = moves; }

    hoverSquare(row, col) { this.highlightedSquare = { row, col }; }

    clearHover() { this.highlightedSquare = null; }

    recordMove(fromRow, fromCol, toRow, toCol) {
        this.lastMovedFrom = { row: fromRow, col: fromCol };
        this.lastMovedTo = { row: toRow, col: toCol };
    }

    setCheckSquare(row, col) { this.checkSquare = (row != null) ? { row, col } : null; }

    /**
     * Resize canvas and recompute tile size + origin so the whole
     * board (with plinth) fits and is centered.
     */
    resize() {
        const parent = this.canvas.parentElement;
        const rect = parent.getBoundingClientRect();

        // Use device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const cssW = Math.max(320, Math.min(900, rect.width - 24));
        const cssH = Math.max(320, Math.min(900, rect.height - 24));

        this.canvas.style.width = cssW + 'px';
        this.canvas.style.height = cssH + 'px';
        this.canvas.width = Math.floor(cssW * dpr);
        this.canvas.height = Math.floor(cssH * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Logical drawing dimensions (CSS pixels)
        const w = cssW;
        const h = cssH;

        // Board spans 8 tiles wide (diamond). Width  = (8+8) * tw/2 = 8*tw
        // Height = (8+8) * th/2 = 8*th. Plus plinth depth.
        const plinthDepth = 28;

        // Fit by width and height, pick the limiting factor.
        const twByWidth = w / 8;
        const thByHeight = (h - plinthDepth - 40) / 8;
        // Maintain 2:1 iso ratio (tw = 2 * th). Choose th from both constraints.
        const thFromWidth = twByWidth / 2;
        const th = Math.max(8, Math.min(thFromWidth, thByHeight));
        const tw = th * 2;

        this.tileWidth = tw;
        this.tileHeight = th;

        // Center the diamond. Diamond spans:
        // x: from (col=0,row=7) -> -7*tw/2  to (col=7,row=0) -> 7*tw/2
        // y: from (col=0,row=0) -> 0       to (col=7,row=7) -> 7*th
        const boardW = 7 * tw;
        const boardH = 7 * th;

        this.boardOriginX = (w - boardW) / 2;
        // Shift up a little to leave room for plinth below the bottom corner.
        this.boardOriginY = (h - boardH - plinthDepth) / 2 + 10;
    }
}
