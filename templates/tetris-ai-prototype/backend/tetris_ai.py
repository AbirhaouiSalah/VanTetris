import numpy as np

# Formes des piÃ¨ces Tetris (I, O, T, L, J, S, Z)
SHAPES = [
    {"shape": [[1, 1, 1, 1]], "color": "cyan"},    # I
    {"shape": [[1, 1], [1, 1]], "color": "yellow"}, # O
    {"shape": [[1, 1, 1], [0, 1, 0]], "color": "purple"}, # T
    {"shape": [[1, 1, 1], [1, 0, 0]], "color": "blue"},  # L
    {"shape": [[1, 1, 1], [0, 0, 1]], "color": "orange"}, # J
    {"shape": [[0, 1, 1], [1, 1, 0]], "color": "green"},  # S
    {"shape": [[1, 1, 0], [0, 1, 1]], "color": "red"},    # Z
]

BOARD_WIDTH = 10
BOARD_HEIGHT = 20

class TetrisAI:
    def __init__(self):
        pass

    @staticmethod
    def rotate_piece(piece):
        """Fait tourner une piÃ¨ce dans le sens horaire."""
        return {"shape": [list(row) for row in zip(*piece["shape"][::-1])], "color": piece["color"]}

    @staticmethod
    def is_valid_move(board, piece, x, y):
        """VÃ©rifie si un dÃ©placement est valide."""
        for i in range(len(piece["shape"])):
            for j in range(len(piece["shape"][i])):
                if piece["shape"][i][j] != 0:
                    new_x = x + j
                    new_y = y + i
                    if (
                        new_x < 0
                        or new_x >= BOARD_WIDTH
                        or new_y >= BOARD_HEIGHT
                        or (new_y >= 0 and board[new_y][new_x] is not None)
                    ):
                        return False
        return True

    @staticmethod
    def place_piece(board, piece, x, y):
        """Place une piÃ¨ce sur le plateau."""
        new_board = [row.copy() for row in board]
        for i in range(len(piece["shape"])):
            for j in range(len(piece["shape"][i])):
                if piece["shape"][i][j] != 0:
                    new_x = x + j
                    new_y = y + i
                    if new_y >= 0:
                        new_board[new_y][new_x] = piece["color"]
        return new_board

    @staticmethod
    def clear_lines(board):
        """Efface les lignes complÃ¨tes et retourne le nouveau plateau et le nombre de lignes effacÃ©es."""
        new_board = [row for row in board if None in row]
        lines_cleared = BOARD_HEIGHT - len(new_board)
        return new_board + [[None] * BOARD_WIDTH for _ in range(lines_cleared)], lines_cleared

    @staticmethod
    def evaluate_board(board, piece, x, y):
        """Ã‰value un plateau aprÃ¨s placement d'une piÃ¨ce."""
        new_board = TetrisAI.place_piece(board, piece, x, y)
        cleared_board, lines_cleared = TetrisAI.clear_lines(new_board)

        # Calculer le score
        score = 0
        score += lines_cleared * 100  # RÃ©compense pour les lignes effacÃ©es

        # PÃ©naliser les trous
        for row in cleared_board:
            for cell in row:
                if cell is None:
                    score -= 1

        # PÃ©naliser la hauteur
        height = 0
        for row in cleared_board:
            if None in row:
                height += 1
            else:
                break
        score -= height * 2

        return score

    @staticmethod
    def find_best_move(board, current_piece):
        """Trouve le meilleur coup pour la piÃ¨ce actuelle."""
        best_score = -float('inf')
        best_move = {"x": 0, "y": 0, "rotation": 0}

        for rotation in range(4):
            rotated_piece = current_piece
            for _ in range(rotation):
                rotated_piece = TetrisAI.rotate_piece(rotated_piece)

            for x in range(BOARD_WIDTH):
                for y in range(BOARD_HEIGHT):
                    if TetrisAI.is_valid_move(board, rotated_piece, x, y):
                        # Simuler la chute de la piÃ¨ce
                        current_y = y
                        while current_y < BOARD_HEIGHT and TetrisAI.is_valid_move(
                            board, rotated_piece, x, current_y
                        ):
                            current_y += 1
                        current_y -= 1

                        if current_y >= 0:
                            score = TetrisAI.evaluate_board(
                                board, rotated_piece, x, current_y
                            )
                            if score > best_score:
                                best_score = score
                                best_move = {"x": x, "y": current_y, "rotation": rotation}

        return best_move
