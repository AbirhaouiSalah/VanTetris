from flask import Flask, request, jsonify
from flask_cors import CORS
from tetris_ai import TetrisAI

app = Flask(__name__)
CORS(app)  # Autoriser les requÃªtes cross-origin (pour React)

@app.route('/suggest', methods=['POST'])
def suggest():
    data = request.json
    board = data.get('board')
    piece = data.get('piece')

    # Convertir le plateau en format Python
    python_board = []
    for row in board:
        python_row = []
        for cell in row:
            python_row.append(cell if cell is not None else None)
        python_board.append(python_row)

    # Convertir la piÃ¨ce en format Python
    python_piece = {
        "shape": piece["shape"],
        "color": piece["color"]
    }

    # Trouver le meilleur coup
    best_move = TetrisAI.find_best_move(python_board, python_piece)

    return jsonify(best_move)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
