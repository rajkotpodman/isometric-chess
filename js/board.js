/**
 * Isometric Board Renderer
 *
 * Coordinate mapping (origin = top corner of diamond at row=0, col=0):
 *   screen.x = originX + (col - row) * (tileW / 2)
 *   screen.y = originY + (col + row) * (tileH / 2)   where tileH = tileW / 2
 *
 * Full board diamond:
 *   x spans: [originX - 7*tileW/2,  originX + 7*tileW/2]  → width  = 7 * tileW
 *   y spans: [originY,               originY + 7 * tileH]  → height = 7 * tileH
 *   (each tile face adds tileW/2 horizontally and tileH/2 vertically)
 *
 * Sizing to fill canvas:
 *   tileW = min(cssW / 8,  availH / 5)   (availH accounts for piece lift + plinth)
 */
class IsometricBoard {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');

        // Tile geometry (set by resize())
        this.tileW   = 80;
        this.tileH   = 40;   // always tileW / 2
        this.originX = 0;    // top-corner of board diamond in CSS px
        this.originY = 0;

        // Interaction state
        this.selected  = null;   // {row,col}
        this.validMoves= [];
        this.hovered   = null;
        this.lastFrom  = null;
        this.lastTo    = null;
        this.checkSq   = null;
    }

    /* ── geometry ── */

    toScreen(row, col) {
        return {
            x: this.originX + (col - row) * (this.tileW / 2),
            y: this.originY + (col + row) * (this.tileH / 2)
        };
    }

    toBoard(sx, sy) {
        const x  = sx - this.originX;
        const y  = sy - this.originY;
        const hw = this.tileW / 2;
        const hh = this.tileH / 2;
        // Invert the linear system
        const col = (x / hw + y / hh) / 2;
        const row = (y / hh - x / hw) / 2;
        const r = Math.round(row), c = Math.round(col);
        return (r >= 0 && r < 8 && c >= 0 && c < 8) ? {row: r, col: c} : null;
    }

    corners(row, col) {
        const {x, y} = this.toScreen(row, col);
        const hw = this.tileW / 2;
        const hh = this.tileH / 2;
        return [
            {x,      y: y - hh},   // top
            {x: x + hw, y},        // right
            {x,      y: y + hh},   // bottom
            {x: x - hw, y}         // left
        ];
    }

    /* ── resize ── */

    resize() {
        // Use the parent container's CSS size
        const parent = this.canvas.parentElement;
        const W = parent.offsetWidth  || 600;
        const H = parent.offsetHeight || 600;

        // The board diamond is 8 tiles wide and 4 tiles tall (screen height)
        // Plus we need room for:
        //   - pieces rising ABOVE origin: ~ 0.8 * tileH
        //   - plinth below bottom:        ~ 1.2 * tileH
        // Total height budget: 4*tileW + 2*tileH = 4*tileW + tileW = 5*tileW
        // (since tileH = tileW/2, so (0.8+1.2)*tileH = tileW)

        const PAD = 0.88;
        const tileFromW = (W * PAD) / 8;    // 8 tiles span full diamond width
        const tileFromH = (H * PAD) / 5;    // 5 tileW spans full diamond height
        const tileW = Math.floor(Math.max(30, Math.min(tileFromW, tileFromH)));
        const tileH = tileW / 2;

        this.tileW = tileW;
        this.tileH = tileH;

        // Physical canvas pixels = CSS pixels (keep it simple, no DPR scaling)
        this.canvas.width  = W;
        this.canvas.height = H;
        this.canvas.style.width  = W + 'px';
        this.canvas.style.height = H + 'px';

        // Position origin (top corner of diamond) so the whole board is centered
        const boardScreenW = 7 * tileW;          // full diamond width
        const boardScreenH = 7 * tileH;          // full diamond height (top-corner to bottom-corner)
        const pieceLift    = tileH * 0.8;         // pieces rise above their tile
        const plinthDepth  = tileH * 1.2;         // plinth hangs below bottom row

        const totalH = pieceLift + boardScreenH + plinthDepth;
        const topPad = (H - totalH) / 2 + pieceLift;

        this.originX = W / 2;           // board is symmetric L/R around originX
        this.originY = Math.max(pieceLift, topPad);
    }

    /* ── main draw ── */

    draw(board) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        // Background
        ctx.fillStyle = '#0d1018';
        ctx.fillRect(0, 0, W, H);

        // Subtle vignette
        const vg = ctx.createRadialGradient(W/2, H/2, H*0.1, W/2, H/2, H*0.8);
        vg.addColorStop(0, 'rgba(56,130,200,0.06)');
        vg.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);

        // Painter's order: back rows first, front rows last
        // Sort by (row + col) ascending means further from viewer first
        for (let sum = 0; sum <= 14; sum++) {
            for (let row = 0; row <= 7; row++) {
                const col = sum - row;
                if (col < 0 || col > 7) continue;
                this._drawTile(row, col);
            }
        }

        this._drawPlinth();

        // Overlays (must be after tiles, before pieces so dots appear on top of tiles)
        this._drawOverlays(board);

        // Pieces in same painter order
        for (let sum = 0; sum <= 14; sum++) {
            for (let row = 0; row <= 7; row++) {
                const col = sum - row;
                if (col < 0 || col > 7) continue;
                const p = board[row][col];
                if (p) this._drawPiece(p, row, col);
            }
        }
    }

    /* ── tile ── */

    _drawTile(row, col) {
        const ctx  = this.ctx;
        const pts  = this.corners(row, col);
        const lite = (row + col) % 2 === 0;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();

        ctx.fillStyle   = lite ? '#e2c888' : '#8a5430';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth   = 0.7;
        ctx.stroke();

        // Subtle specular on light tiles
        if (lite) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(pts[2].x, pts[2].y);
            ctx.lineTo(pts[3].x, pts[3].y);
            ctx.closePath();
            const grad = ctx.createLinearGradient(pts[3].x, pts[0].y, pts[1].x, pts[2].y);
            grad.addColorStop(0, 'rgba(255,255,255,0.12)');
            grad.addColorStop(1, 'rgba(0,0,0,0.0)');
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    /* ── plinth ── */

    _drawPlinth() {
        const ctx = this.ctx;
        const d   = this.tileH * 1.0;   // visible depth of side faces

        // Four corners of the board's footprint
        const c00 = this.toScreen(0, 0); // top
        const c07 = this.toScreen(0, 7); // right
        const c70 = this.toScreen(7, 0); // left
        const c77 = this.toScreen(7, 7); // bottom

        // Left face: top-left corner (c70) → top-right corner (c00), then down by d
        ctx.beginPath();
        ctx.moveTo(c70.x,     c70.y);
        ctx.lineTo(c00.x,     c00.y);
        ctx.lineTo(c00.x,     c00.y + d);
        ctx.lineTo(c70.x,     c70.y + d);
        ctx.closePath();
        ctx.fillStyle = '#3a2010';
        ctx.fill();
        ctx.strokeStyle = '#2a1508';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Right face: top-right (c07) → bottom (c77), then down by d
        ctx.beginPath();
        ctx.moveTo(c07.x,     c07.y);
        ctx.lineTo(c77.x,     c77.y);
        ctx.lineTo(c77.x,     c77.y + d);
        ctx.lineTo(c07.x,     c07.y + d);
        ctx.closePath();
        ctx.fillStyle = '#4a2a14';
        ctx.fill();
        ctx.strokeStyle = '#2a1508';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Bottom edge highlight
        ctx.beginPath();
        ctx.moveTo(c70.x, c70.y + d);
        ctx.lineTo(c77.x, c77.y + d);
        ctx.strokeStyle = '#5a3420';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
    }

    /* ── overlays ── */

    _drawOverlays(board) {
        // Last move
        if (this.lastFrom) this._tint(this.lastFrom.row, this.lastFrom.col, 'rgba(234,179,8,0.3)');
        if (this.lastTo)   this._tint(this.lastTo.row,   this.lastTo.col,   'rgba(234,179,8,0.45)');

        // Check highlight
        if (this.checkSq)  this._tint(this.checkSq.row,  this.checkSq.col,  'rgba(239,68,68,0.5)');

        // Hover
        if (this.hovered && !this.selected)
            this._tint(this.hovered.row, this.hovered.col, 'rgba(255,255,255,0.14)');

        // Selection
        if (this.selected) {
            this._tint(this.selected.row, this.selected.col, 'rgba(59,130,246,0.5)');

            // Valid move targets
            for (const m of this.validMoves) {
                const hasEnemy = board[m.row][m.col];
                if (hasEnemy) {
                    this._ring(m.row, m.col, 'rgba(249,115,22,0.9)');
                } else {
                    const {x, y} = this.toScreen(m.row, m.col);
                    const r = this.tileW * 0.14;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, r, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(59,130,246,0.8)';
                    this.ctx.fill();
                }
            }
        }
    }

    _tint(row, col, color) {
        const ctx = this.ctx;
        const pts = this.corners(row, col);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    _ring(row, col, color) {
        const ctx = this.ctx;
        const pts = this.corners(row, col);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.lineTo(pts[3].x, pts[3].y);
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = Math.max(2, this.tileW * 0.045);
        ctx.stroke();
    }

    /* ── piece ── */

    _drawPiece(piece, row, col) {
        const ctx    = this.ctx;
        const {x, y} = this.toScreen(row, col);
        const isW    = piece.color === PieceColor.WHITE;

        // Piece is a sphere sitting on the tile
        const lift  = this.tileH * 0.75;   // how far center of sphere is above tile surface
        const R     = this.tileW * 0.20;   // sphere radius (small relative to tile)
        const cx    = x;
        const cy    = y - lift;

        // Drop shadow (ellipse on tile)
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(x, y - this.tileH * 0.05, R * 0.9, R * 0.45, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();

        // Sphere body with radial gradient
        const gx = cx - R * 0.32;
        const gy = cy - R * 0.32;
        const grad = ctx.createRadialGradient(gx, gy, R * 0.05, cx, cy, R);
        if (isW) {
            grad.addColorStop(0, '#fffdf5');
            grad.addColorStop(0.55, '#d8c49a');
            grad.addColorStop(1,   '#a8905c');
        } else {
            grad.addColorStop(0, '#5a5870');
            grad.addColorStop(0.55, '#232230');
            grad.addColorStop(1,   '#0e0d18');
        }

        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border ring
        ctx.strokeStyle = isW ? '#c0a060' : '#806840';
        ctx.lineWidth   = Math.max(1, R * 0.12);
        ctx.stroke();

        // Piece letter
        const fs = Math.max(8, R * 1.05);
        ctx.font         = `900 ${fs}px Inter, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow for depth
        ctx.fillStyle = isW ? 'rgba(60,30,0,0.4)' : 'rgba(200,180,120,0.25)';
        ctx.fillText(this._label(piece.type), cx + 0.8, cy + 0.8);

        ctx.fillStyle = isW ? '#3a200a' : '#d4b87c';
        ctx.fillText(this._label(piece.type), cx, cy);
    }

    _label(t) {
        return {pawn:'P', knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K'}[t] || '?';
    }

    /* ── interaction API ── */

    selectSquare(row, col)    { this.selected   = {row, col}; }
    deselect()                { this.selected   = null; this.validMoves = []; this.hovered = null; }
    setValidMoves(moves)      { this.validMoves = moves; }
    hoverSquare(row, col)     { this.hovered    = {row, col}; }
    clearHover()              { this.hovered    = null; }
    recordMove(fr,fc,tr,tc)   { this.lastFrom   = {row:fr,col:fc}; this.lastTo = {row:tr,col:tc}; }
    setCheckSquare(sq)        { this.checkSq    = sq; }

    screenToBoard(sx, sy)     { return this.toBoard(sx, sy); }
    get selectedSquare()      { return this.selected; }
    get highlightedSquare()   { return this.hovered; }
}
