from flask import Flask, request, jsonify
from flask_cors import CORS
from tetris_ai import TetrisAI, BOARD_WIDTH, BOARD_HEIGHT  # <-- Ajoutez cette ligne

app = Flask(__name__)
CORS(app)

@app.route('/suggest', methods=['POST'])
def suggest():
    data = request.json
    board = data.get('board')
    piece = data.get('piece')

    # Valider que le plateau a bien 20 lignes et 10 colonnes
    python_board = []
    for row in board:
        if len(row) < BOARD_WIDTH:
            row += [None] * (BOARD_WIDTH - len(row))  # Compléter avec des None
        python_board.append(row[:BOARD_WIDTH])  # Tronquer si trop long

    # Ajouter des lignes vides si nécessaire
    while len(python_board) < BOARD_HEIGHT:
        python_board.append([None] * BOARD_WIDTH)

    # Convertir la pièce
    python_piece = {
        "shape": piece["shape"],
        "color": piece["color"]
    }

    # Trouver le meilleur coup
    best_move = TetrisAI.find_best_move(python_board, python_piece)

    return jsonify(best_move)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
