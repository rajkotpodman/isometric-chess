/**
 * Isometric Board Renderer
 *
 * Coordinate system:
 *   boardToScreen(row, col) maps (0,0)=a8 (top) to the diamond center at boardOriginX/Y.
 *
 *   The full board diamond spans:
 *     width  = 8 * tileW   (left corner row7,col0 to right corner row0,col7)
 *     height = 8 * tileH   (top corner row0,col0 to bottom corner row7,col7)
 *
 *   Origin is placed at the TOP corner (row0,col0).
 *   boardOriginX = centerX  (diamond is symmetric)
 *   boardOriginY = topPad   (leave room above for the top corner)
 */
class IsometricBoard {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.tileW = 80;
        this.tileH = 40;
        this.boardOriginX = 0;
        this.boardOriginY = 0;

        this.selectedSquare = null;
        this.validMoves = [];
        this.highlightedSquare = null;
        this.lastMovedFrom = null;
        this.lastMovedTo = null;
        this.checkSquare = null;
    }

    /* ── Coordinate helpers ── */

    boardToScreen(row, col) {
        return {
            x: this.boardOriginX + (col - row) * (this.tileW / 2),
            y: this.boardOriginY + (col + row) * (this.tileH / 2)
        };
    }

    screenToBoard(sx, sy) {
        const x = sx - this.boardOriginX;
        const y = sy - this.boardOriginY;
        const col = (x / (this.tileW / 2) + y / (this.tileH / 2)) / 2;
        const row = (y / (this.tileH / 2) - x / (this.tileW / 2)) / 2;
        const r = Math.round(row);
        const c = Math.round(col);
        return (r >= 0 && r < 8 && c >= 0 && c < 8) ? { row: r, col: c } : null;
    }

    tileCorners(row, col) {
        const { x, y } = this.boardToScreen(row, col);
        const hw = this.tileW / 2;
        const hh = this.tileH / 2;
        return [
            { x, y: y - hh },      // top
            { x: x + hw, y },      // right
            { x, y: y + hh },      // bottom
            { x: x - hw, y }       // left
        ];
    }

    /* ── Resize ── */

    resize() {
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const cssW = parent.clientWidth  || 600;
        const cssH = parent.clientHeight || 600;

        this.canvas.style.width  = cssW + 'px';
        this.canvas.style.height = cssH + 'px';
        this.canvas.width  = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssH * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /*
         * Tile sizing:
         *   Board diamond width  = 8 * tileW
         *   Board diamond height = 8 * tileH   (tileH = tileW / 2)
         *   Plinth adds ~20% extra height below.
         *
         * We want the board to fill ~90% of the smaller dimension.
         */
        const plinthFrac = 0.18;  // fraction of board height
        const margin = 0.90;      // use 90% of available space

        // From width constraint: 8 * tileW = cssW * margin  → tileW = cssW*margin/8
        const twFromW = (cssW * margin) / 8;
        // From height constraint: 8*tileH * (1+plinthFrac) + tileH = cssH*margin
        //   tileH = tileW/2, so 4*tileW*(1+plinthFrac)+tileW/2 = cssH*margin
        //   tileW*(4*(1+plinthFrac)+0.5) = cssH*margin
        const twFromH = (cssH * margin) / (4 * (1 + plinthFrac) + 0.5);

        const tileW = Math.max(30, Math.min(twFromW, twFromH));
        const tileH = tileW / 2;

        this.tileW = tileW;
        this.tileH = tileH;

        // Origin = top corner of board diamond, centered horizontally.
        // Board diamond: x ranges from -4*tileW to +4*tileW around originX
        //                y ranges from 0 to 8*tileH below originY
        const boardDiamondH = 8 * tileH;
        const plinthH = boardDiamondH * plinthFrac;
        const totalH = boardDiamondH + plinthH;

        this.boardOriginX = cssW / 2;
        this.boardOriginY = (cssH - totalH) / 2 + tileH * 0.5;
    }

    /* ── Draw ── */

    draw(board) {
        const ctx = this.ctx;
        const cssW = parseFloat(this.canvas.style.width)  || this.canvas.width;
        const cssH = parseFloat(this.canvas.style.height) || this.canvas.height;

        // Background
        ctx.clearRect(0, 0, cssW, cssH);
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#0f1117');
        bg.addColorStop(1, '#181c28');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cssW, cssH);

        // Subtle center glow
        const glow = ctx.createRadialGradient(this.boardOriginX, this.boardOriginY + this.tileH * 3.5, 0,
            this.boardOriginX, this.boardOriginY + this.tileH * 3.5, this.tileW * 5);
        glow.addColorStop(0, 'rgba(56,189,248,0.07)');
        glow.addColorStop(1, 'rgba(56,189,248,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, cssW, cssH);

        // Draw back-to-front (painter's algorithm): row 7→0, col 0→7
        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                this.drawTile(row, col);
            }
        }

        this.drawPlinth();
        this.drawOverlays(board);

        for (let row = 7; row >= 0; row--) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col]) {
                    this.drawPiece(board[row][col], row, col);
                }
            }
        }
    }

    drawTile(row, col) {
        const ctx = this.ctx;
        const pts = this.tileCorners(row, col);
        const light = (row + col) % 2 === 0;

        // Top face
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        ctx.fillStyle = light ? '#e8c888' : '#9a6b3c';
        ctx.fill();

        // Subtle inner border
        ctx.strokeStyle = light ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.22)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Row/col coordinate labels on edge tiles
        if (col === 0 || row === 7) {
            const label = col === 0 ? (8 - row).toString() : String.fromCharCode(96 + col + 1);
            const { x, y } = this.boardToScreen(row, col);
            ctx.save();
            ctx.font = `bold ${Math.max(9, this.tileW * 0.15)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = light ? 'rgba(154,107,60,0.7)' : 'rgba(232,200,136,0.7)';
            ctx.fillText(col === 0 ? (8 - row) : String.fromCharCode(97 + col), x - this.tileW * 0.32, y + this.tileH * 0.25);
            ctx.restore();
        }
    }

    drawPlinth() {
        const ctx = this.ctx;
        const d = this.tileH * 1.1; // depth of plinth face

        // The four corners of the board (bottom face of diamond)
        const tl = this.boardToScreen(0, 0); // top of diamond
        const tr = this.boardToScreen(0, 7); // right
        const bl = this.boardToScreen(7, 0); // left
        const br = this.boardToScreen(7, 7); // bottom of diamond

        // Left face (bl to tl)
        ctx.beginPath();
        ctx.moveTo(bl.x, bl.y);
        ctx.lineTo(tl.x, tl.y);
        ctx.lineTo(tl.x, tl.y + d);
        ctx.lineTo(bl.x, bl.y + d);
        ctx.closePath();
        ctx.fillStyle = '#3a2510';
        ctx.fill();

        // Right face (br to tr)
        ctx.beginPath();
        ctx.moveTo(br.x, br.y);
        ctx.lineTo(tr.x, tr.y);
        ctx.lineTo(tr.x, tr.y + d);
        ctx.lineTo(br.x, br.y + d);
        ctx.closePath();
        ctx.fillStyle = '#4a2f14';
        ctx.fill();

        // Bottom face
        ctx.beginPath();
        ctx.moveTo(bl.x, bl.y + d);
        ctx.lineTo(br.x, br.y + d);
        ctx.lineTo(br.x, br.y + d);
        ctx.lineTo(bl.x, bl.y + d);
        ctx.closePath();
        ctx.strokeStyle = '#2a1a08';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    drawOverlays(board) {
        // Last move
        if (this.lastMovedFrom) this.tintTile(this.lastMovedFrom.row, this.lastMovedFrom.col, 'rgba(244,208,63,0.28)');
        if (this.lastMovedTo)   this.tintTile(this.lastMovedTo.row,   this.lastMovedTo.col,   'rgba(244,208,63,0.38)');
        // Check
        if (this.checkSquare)   this.tintTile(this.checkSquare.row,   this.checkSquare.col,   'rgba(239,68,68,0.55)');
        // Hover
        if (this.highlightedSquare && !this.selectedSquare) {
            this.tintTile(this.highlightedSquare.row, this.highlightedSquare.col, 'rgba(255,255,255,0.12)');
        }
        // Selection + valid moves
        if (this.selectedSquare) {
            this.tintTile(this.selectedSquare.row, this.selectedSquare.col, 'rgba(59,130,246,0.45)');
            this.drawValidMovesDots(board);
        }
    }

    tintTile(row, col, color) {
        const ctx = this.ctx;
        const pts = this.tileCorners(row, col);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    drawValidMovesDots(board) {
        const ctx = this.ctx;
        this.validMoves.forEach(m => {
            const { x, y } = this.boardToScreen(m.row, m.col);
            const hasTarget = board[m.row][m.col];
            const r = this.tileW * 0.17;

            if (hasTarget) {
                // Capture: orange ring around tile
                const pts = this.tileCorners(m.row, m.col);
                ctx.save();
                ctx.strokeStyle = 'rgba(249,115,22,0.95)';
                ctx.lineWidth = Math.max(2, this.tileW * 0.05);
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                ctx.lineTo(pts[1].x, pts[1].y);
                ctx.lineTo(pts[2].x, pts[2].y);
                ctx.lineTo(pts[3].x, pts[3].y);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            } else {
                // Quiet: dot
                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59,130,246,0.75)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(147,197,253,0.9)';
                ctx.lineWidth = Math.max(1, this.tileW * 0.025);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    /* ── Piece drawing ── */

    drawPiece(piece, row, col) {
        const ctx = this.ctx;
        const { x, y } = this.boardToScreen(row, col);
        const isWhite = piece.color === 'white';

        // Piece dimensions relative to tile
        const baseRx = this.tileW * 0.42;    // base ellipse x-radius
        const baseRy = this.tileH * 0.38;    // base ellipse y-radius
        const lift   = this.tileH * 0.55;    // how far piece rises above tile
        const bodyR  = this.tileW * 0.30;    // body circle radius

        const pieceY = y - lift;

        // Drop shadow on tile
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, baseRx * 0.8, baseRy * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fill();
        ctx.restore();

        // Colors
        const fillColor    = isWhite ? '#f0ece4' : '#1e1e28';
        const strokeColor  = isWhite ? '#7a6a50' : '#a89060';
        const glintColor   = isWhite ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.15)';
        const textColor    = isWhite ? '#3a2a10' : '#e8c888';
        const textStroke   = isWhite ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)';

        ctx.save();

        // Piece body – filled circle
        const grad = ctx.createRadialGradient(x - bodyR * 0.3, pieceY - bodyR * 0.3, bodyR * 0.05,
                                              x, pieceY, bodyR);
        if (isWhite) {
            grad.addColorStop(0, '#fff9f0');
            grad.addColorStop(0.6, '#e8dcc8');
            grad.addColorStop(1, '#c8b090');
        } else {
            grad.addColorStop(0, '#3a3a4e');
            grad.addColorStop(0.6, '#1e1e2c');
            grad.addColorStop(1, '#0a0a14');
        }

        ctx.beginPath();
        ctx.arc(x, pieceY, bodyR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1.5, this.tileW * 0.03);
        ctx.stroke();

        // Glint
        ctx.beginPath();
        ctx.arc(x - bodyR * 0.28, pieceY - bodyR * 0.28, bodyR * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = glintColor;
        ctx.fill();

        // Piece label
        const label = this.getPieceLabel(piece.type);
        const fontSize = Math.max(10, bodyR * 1.1);
        ctx.font = `900 ${fontSize}px Inter, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = textStroke;
        ctx.lineWidth = Math.max(1, fontSize * 0.08);
        ctx.strokeText(label, x, pieceY + fontSize * 0.05);
        ctx.fillStyle = textColor;
        ctx.fillText(label, x, pieceY + fontSize * 0.05);

        ctx.restore();
    }

    getPieceLabel(type) {
        const labels = { king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: 'P' };
        return labels[type] || '?';
    }

    /* ── Selection API ── */

    selectSquare(row, col)     { this.selectedSquare = { row, col }; }
    deselect()                 { this.selectedSquare = null; this.validMoves = []; this.highlightedSquare = null; }
    setValidMoves(moves)       { this.validMoves = moves; }
    hoverSquare(row, col)      { this.highlightedSquare = { row, col }; }
    clearHover()               { this.highlightedSquare = null; }
    recordMove(fr, fc, tr, tc) { this.lastMovedFrom = { row: fr, col: fc }; this.lastMovedTo = { row: tr, col: tc }; }
    setCheckSquare(row, col)   { this.checkSquare = (row != null) ? { row, col } : null; }
}
