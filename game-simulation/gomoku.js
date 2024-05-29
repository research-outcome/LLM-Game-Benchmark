import { Move } from "./classes.js";

export class Gomoku {
    static explainGame() {
        return "Gomoku, a classic two-player game, is played on a 15 by 15 grid. The objective is to align five of your stones, black for the first player and white for the second, either horizontally, vertically, or diagonally. Strategic placement is crucial; besides aiming for five in a row, players must also block their opponent's potential alignments to avoid defeat. Players take turns placing their stones on an empty intersection of the grid. You are a skilled strategic Gomoku player, currently engaged in a game. ";
    }
    static formatNextMove() {
        return " Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15. ";
    }
    static systemPrompt() {
        return " Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15. ";
    }
    static promptVersion() {
        return "2024-05-29";
    }

    static listPlayerMoves(player) {
        let movesList = [];
        // Gomoku move retrieval logic here.
        return movesList;
    }

    static listBoard(firstPlayerMoves, secondPlayerMoves) {
        let gameStatus = "";
        gameStatus += " The current state of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by B for black stones): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by W for white stones): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
        return gameStatus;
    }

    static drawBoard() {
        let gameStatus = "";
        gameStatus += " The current state of the game is displayed on a 15 by 15 grid. 'B' represents positions taken by the first player (using black stones) and 'W' represents positions taken by the second player (using white stones), while '.' indicates an available position. The current layout is as follows:\n";
        // Gomoku board drawing logic here.
        return gameStatus;
    }

    static async screenshotBoard() {
        return new Promise((resolve, reject) => {
            html2canvas(document.querySelector("#gomoku-board")).then((canvas) => {
                // Download screenshot of board (for testing purposes).
                //canvas.toBlob(function(blob) {
                //saveAs(blob, "Tic Tac Toe Game Board.png");
                //});

                // Return base64-encoded board screeenshot.
                return canvas.toDataURL("image/png;base64");
            }).then(data => {
                resolve(data);
            }).catch(error => {
                reject(error);
            });
        });
    }

    static processMove() {
        // Gomoku move processing logic here.
    }

    static visualizeBoardState() {
        let boardState = "";
        // Gomoku board visualization logic here.
        return boardState += "\n";
    }

    static checkForWin() {
        // Gomoku win checking logic here.
    }

    static checkForFullBoard() {
        // Gomoku full board checking logic here.
    }

    static async resetBoard() {
        // Gomoku board resetting logic here.
    }
}