import unittest
from tetris_ai import TetrisAI


    # ... reste du code
class TestTetrisAI(unittest.TestCase):
    def setUp(self):
        self.ai = TetrisAI()

    def test_rotate_piece(self):
        piece = {"shape": [[1, 1], [1, 0]], "color": "blue"}  # L
        rotated = self.ai.rotate_piece(piece)
        expected_shape = [[0, 1], [1, 1]]
        self.assertEqual(rotated["shape"], expected_shape)

    def test_is_valid_move(self):
        board = [[None for _ in range(10)] for _ in range(20)]
        piece = {"shape": [[1, 1]], "color": "yellow"}  # O
        self.assertTrue(self.ai.is_valid_move(board, piece, 0, 0))
        self.assertFalse(self.ai.is_valid_move(board, piece, -1, 0))  # Hors limites

    def test_place_piece(self):
        board = [[None for _ in range(10)] for _ in range(20)]
        piece = {"shape": [[1, 1]], "color": "yellow"}
        new_board = self.ai.place_piece(board, piece, 0, 0)
        self.assertEqual(new_board[0][0], "yellow")
        self.assertEqual(new_board[0][1], "yellow")

    def test_clear_lines(self):
        board = [
            ["cyan", "cyan", "cyan", "cyan", None, None, None, None, None, None],
            [None, None, None, None, None, None, None, None, None, None]
        ]
        new_board, lines_cleared = self.ai.clear_lines(board)
        self.assertEqual(lines_cleared, 0)  # Aucune ligne complÃ¨te

        board_full = [["cyan" for _ in range(10)]]
        new_board, lines_cleared = self.ai.clear_lines(board_full)
        self.assertEqual(lines_cleared, 1)

    def test_evaluate_board(self):
        board = [[None for _ in range(10)] for _ in range(20)]
        piece = {"shape": [[1, 1], [1, 1]], "color": "yellow"}
        score = self.ai.evaluate_board(board, piece, 0, 0)
        self.assertGreater(score, 0)  # Score positif pour un placement valide

    def test_find_best_move(self):
        board = [[None for _ in range(10)] for _ in range(20)]
        piece = {"shape": [[1, 1, 1, 1]], "color": "cyan"}  # I
        best_move = self.ai.find_best_move(board, piece)
        self.assertIsNotNone(best_move)
        self.assertTrue(0 <= best_move["x"] < 10)
        self.assertTrue(0 <= best_move["y"] < 20)

if __name__ == '__main__':
    unittest.main()
