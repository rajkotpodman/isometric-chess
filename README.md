# ♟️ Isometric Chess

A modern, interactive chess game with isometric 3D board rendering. Built with vanilla JavaScript and HTML5 Canvas.

## Features

✨ **Core Features**
- Fully playable chess game with all standard rules
- Beautiful isometric 3D board visualization
- Responsive design (desktop and mobile)
- Real-time move validation
- Move history tracking
- Check and checkmate detection
- Smooth piece animations and hover effects

🎮 **Gameplay**
- Click to select a piece
- Click on highlighted squares to move
- Right-click to deselect
- Touch support for mobile devices
- Current player indicator
- Game status (normal/check/checkmate/stalemate)

## How to Play

1. **Starting**: The game begins with White. Click on a piece to select it.
2. **Valid Moves**: Highlighted squares show where your selected piece can move.
3. **Moving**: Click on a highlighted square to move your piece there.
4. **Deselecting**: Right-click or click elsewhere to deselect a piece.
5. **Winning**: Achieve checkmate to win, or reach stalemate for a draw.

## Game Rules

The game implements full chess rules including:
- ♟️ **Pawns**: Move forward 1 square (or 2 from starting position), capture diagonally
- ♞ **Knights**: Move in L-shape (2 squares in one direction, 1 perpendicular)
- ♗ **Bishops**: Move diagonally any number of squares
- ♖ **Rooks**: Move horizontally or vertically any number of squares
- ♕ **Queens**: Combine rook and bishop moves
- ♔ **Kings**: Move 1 square in any direction
- **Check/Checkmate**: Detected automatically
- **Stalemate**: Detected when a player has no legal moves but is not in check

## Project Structure

```
isometric-chess/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Styling and layout
├── js/
│   ├── pieces.js       # Piece definitions and move logic
│   ├── board.js        # Isometric rendering system
│   ├── game.js         # Game state and rules
│   ├── input.js        # Mouse and touch input handling
│   └── app.js          # Main application controller
└── README.md           # This file
```

## Technical Details

### Isometric Projection

The game uses a mathematical coordinate transformation to convert between:
- **Board coordinates** (8x8 grid): Where pieces actually are
- **Screen coordinates** (2D canvas): How they're displayed

**Conversion formulas:**
```javascript
// Board to Screen
x = (col - row) * (tileWidth / 2)
y = (col + row) * (tileHeight / 2)

// Screen to Board
col = (screenX / (tileWidth / 2) + screenY / (tileHeight / 2)) / 2
row = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2
```

### Game Logic

- **Piece validation**: Each piece calculates its legal moves based on chess rules
- **Check detection**: System verifies if a move would leave the king in check
- **Move validation**: Ensures moves don't create invalid game states

### Rendering

- Canvas-based 2D rendering for performance
- Isometric tiles rendered as diamond shapes
- Real-time board updates (60 FPS)
- Dynamic piece positioning

## Browser Support

- Chrome/Chromium: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Edge: ✅ Full support
- Mobile browsers: ✅ Touch support included

## Future Enhancements

🚀 Potential features to add:
- AI opponent (minimax algorithm)
- Online multiplayer (WebSocket)
- Game replay and analysis
- Special moves (castling, en passant, pawn promotion)
- Sound effects
- Themes and customization
- Puzzle mode
- Tournament mode

## Installation

1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start playing!

No dependencies required - pure vanilla JavaScript!

## Performance

The game is optimized for performance:
- 60 FPS render loop
- Efficient canvas drawing
- Minimal DOM manipulation
- Touch event debouncing

Typically runs at 60 FPS on modern devices (desktop and mobile).

## License

MIT License - Feel free to use, modify, and distribute!

## Contributing

Contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests with improvements
- Improve documentation

## Credits

Built with:
- Vanilla JavaScript (ES6+)
- HTML5 Canvas
- CSS3

---

Enjoy playing! ♚♛♜♞♝♙