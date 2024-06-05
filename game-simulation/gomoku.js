import { Move } from "./classes.js";

export class Gomoku {
    static explainGame() {
        return "Gomoku is a two-player game played on a 15 by 15 grid. The first player uses black (B) dots, and the second player uses white (W) dots. Players take turns placing their dots on an empty intersection of the grid. The objective is to align five of your dots either horizontally, vertically, or diagonally. The player who first aligns five of their dots wins the game. Strategic placement is crucial; besides aiming to align their dots, players must also block their opponent's potential alignments to avoid defeat. \n";
    }
    static formatNextMove() {
        return "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15. \n";
    }
    static systemPrompt() {
        return this.formatNextMove();
    }
    static invalidMoveWarning() {
        return "Please note that your move will be considered invalid if your response does not follow the specified format, or if you provide a RowNumber or ColumnNumber that is out of the allowed range, or already occupied by a previous move. Making more than " + this.getMaxInvalidMoves() + " invalid moves will result in disqualification. \n"
    }
    static promptVersion() {
        return "2024-06-04";
    }
    static getMaxMoves() {
        return 400;
    }
    static getMaxInvalidMoves() {
        // Invalid Moves formula: (rows + columns)
        return 30;
    }

    static listPlayerMoves(player) {
        let movesList = [];
        let playerStoneColor = (player === 1) ? 'black' : 'white';
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 15; col++) {
                if(document.getElementById("gomoku-" + row + "-" + col).innerHTML.indexOf(playerStoneColor) !== -1) {
                    movesList.push(row + "," + col);
                }
            }
        }
        return movesList;
    }

    static listBoard(firstPlayerMoves, secondPlayerMoves) {
        let gameStatus = "";
        gameStatus += "The current state of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. \n";
        gameStatus += "The current state of the game is as follows: \n";
        gameStatus += "The locations occupied by the first player: ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + " \n";
        gameStatus += "The locations occupied by the second player: ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + " \n";
        return gameStatus;
    }

    static drawBoard() {
        let gameStatus = "";
        gameStatus += "The current state of the game is illustrated on a 15 by 15 grid. 'B' represents positions taken by the first player and 'W' represents positions taken by the second player, while '.' indicates an available position. \n";
        gameStatus += "The current state of the game is as follows: \n";
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 15; col++) {
                if(document.getElementById("gomoku-" + row + "-" + col).innerHTML.indexOf("black") !== -1) {
                    gameStatus += "B";
                }
                else if (document.getElementById("gomoku-" + row + "-" + col).innerHTML.indexOf("white") !== -1) {
                    gameStatus += "W";
                }
                else {
                    gameStatus += ".";
                }
            }
            gameStatus += "\n";
        }
        return gameStatus;
    }

    static imagePrompt() {
        return "The current state of the game is depicted in an image showing a 15 by 15 grid, where black dots represent positions taken by the first player and white dots represent positions taken by the second player. \n";
    }

    static async screenshotBoard() {
        return new Promise((resolve, reject) => {
            html2canvas(document.querySelector("#gomoku-board")).then((canvas) => {
                // Download screenshot of board (for testing purposes).
                //canvas.toBlob(function(blob) {
                //saveAs(blob, "Gomoku Game Board.png");
                //});

                // Return base64-encoded board screenshot.
                return canvas.toDataURL("image/png;base64");
            }).then(data => {
                resolve(data);
            }).catch(error => {
                reject(error);
            });
        });
    }

    static processMove(currentMoveCount, currentPlayer, jsonResponse, model, currentStatus) {
        let row;
        let col;
        let color = (currentPlayer === 1) ? "black" : "white";

        if (jsonResponse.row !== undefined && typeof jsonResponse.row === "number") {
            row = jsonResponse.row;

        } else {
            throw new Error();
        }

        if (jsonResponse.column !== undefined && typeof jsonResponse.column === "number") {
            col = jsonResponse.column;
        } else {
            throw new Error();
        }

        // Validate row and column
        if (row >= 1 && row <= 15 && col >= 1 && col <= 15) {
            if (document.getElementById("gomoku-" + row + "-" + col).innerHTML === "") {
                // Display move on board.
                document.getElementById("gomoku-" + row + "-" + col).innerHTML = "<div class=\"" + color + "-stone\"></div>";

                // Return successful move.
                console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") places at space (" + row + ", " + col + ").");
                return new Move(currentMoveCount, currentPlayer, row, col, "Y", currentStatus, JSON.stringify(jsonResponse));
            }
            else {
                // Return unsuccessful move because AI attempted to play in a space that was already taken.
                console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place at space (" + row + ", " + col + ") which is already taken.");
                return new Move(currentMoveCount, currentPlayer, row, col, "Already Taken", currentStatus, JSON.stringify(jsonResponse));
            }
        }
        else {
            // Return unsuccessful move because AI attempted to play in a column that was out of bounds.
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place at space (" + row + ", " + col + ") which is out of bounds");
            return new Move(currentMoveCount, currentPlayer, row, col, "Out of Bounds", currentStatus, JSON.stringify(jsonResponse));
        }
    }

    static visualizeBoardState() {
        let boardState = "";
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 15; col++) {
                if(document.getElementById("gomoku-" + row + "-" + col).innerHTML.indexOf("black") !== -1) {
                    boardState += "B";
                }
                else if (document.getElementById("gomoku-" + row + "-" + col).innerHTML.indexOf("white") !== -1) {
                    boardState += "W";
                }
                else {
                    boardState += ".";
                }

                if (col < 15) {
                    boardState += "|";
                }
            }
            boardState += "\n";
        }
        return boardState + "\n";
    }

    static checkForWin() {
        let rows = 15;
        let cols = 15;
        let field = new Array(rows);
        for (let i = 0; i < rows; i++) {
            field[i] = new Array(cols);
        }

        // Populate the field array with the colors of the stones placed on the board.
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if(document.getElementById("gomoku-" + (row + 1) + "-" + (col + 1)).innerHTML.indexOf("black") !== -1) {
                    field[row][col] = "B";
                }
                else if (document.getElementById("gomoku-" + (row + 1) + "-" + (col + 1)).innerHTML.indexOf("white") !== -1) {
                    field[row][col] = "W";
                }
                else {
                    field[row][col] = "";
                }
            }
        }

        for (let i = 0; i < rows; i++) {
            let concatenatedString = "";
            for (let j = 0; j < cols; j++) {
                if (field[i][j] !== "") {
                    concatenatedString += " " + field[i][j];
                }
                else {
                    concatenatedString += " .";
                }
            }
            console.log(concatenatedString)
        }

        // Check horizontal lines
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols - 4; j++) {
                if (field[i][j] !== "" && field[i][j] === field[i][j + 1] && field[i][j] === field[i][j + 2] && field[i][j] === field[i][j + 3] && field[i][j] === field[i][j + 4]) {
                    return true; // Found a win
                }
            }
        }

        // Check vertical lines
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows - 4; i++) {
                if (field[i][j] !== "" && field[i][j] === field[i + 1][j] && field[i][j] === field[i + 2][j] && field[i][j] === field[i + 3][j] && field[i][j] === field[i + 4][j]) {
                    return true; // Found a win
                }
            }
        }

        // Check diagonal (top-left to bottom-right)
        for (let i = 0; i < rows - 4; i++) {
            for (let j = 0; j < cols - 4; j++) {
                if (field[i][j] !== "" && field[i][j] === field[i + 1][j + 1] && field[i][j] === field[i + 2][j + 2] && field[i][j] === field[i + 3][j + 3] && field[i][j] === field[i + 4][i + 4]) {
                    return true; // Found a win
                }
            }
        }

        // Check diagonal (bottom-left to top-right)
        for (let i = 4; i < rows; i++) {
            for (let j = 0; j < cols - 4; j++) {
                if (field[i][j] !== "" && field[i][j] === field[i - 1][j + 1] && field[i][j] === field[i - 2][j + 2] && field[i][j] === field[i - 3][j + 3] && field[i][j] === field[i - 4][j + 4]) {
                    return true; // Found a win
                }
            }
        }

        return false; // No win found
    }

    static checkForFullBoard() {
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 15; col++) {
                if (document.getElementById("gomoku-" + row + "-" + col).innerHTML !== "") {
                    return false; // Board is not full
                }
            }
        }

        return true; // Board is full
    }

    static resetBoard() {
        for (let row = 1; row <= 15; row++) {
            for (let col = 1; col <= 15; col++) {
                document.getElementById("gomoku-" + row + "-" + col).innerHTML = "";
            }
        }
    }
}