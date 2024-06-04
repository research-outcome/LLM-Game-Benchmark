import { Move } from "./classes.js";

export class TicTacToe {
    static explainGame() {
        return "Tic-Tac-Toe is a two-player game played on a 3 by 3 grid. The first player uses X symbols, and the second player uses O symbols. Players take turns placing their symbols in an empty cell on the grid. The objective is to align three of your symbols either horizontally, vertically, or diagonally. The player who first aligns three of their symbols wins the game. Strategic placement is crucial; besides aiming to align their symbols, players must also block their opponent's potential alignments to avoid defeat. \n";
    }
    static formatNextMove() {
        return "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 3, as the grid is 3 by 3. \n";
    }
    static systemPrompt() {
        return this.formatNextMove();
    }
    static invalidMoveWarning() {
        return "Please note that your move will be considered invalid if your response does not follow the specified format, or if you provide a RowNumber or ColumnNumber that is out of the allowed range, or already occupied by a previous move. Making more than " + this.getMaxInvalidMoves() + " invalid moves will result in disqualification. \n";
    }
    static promptVersion() {
        return "2024-06-04";
    }
    static getMaxMoves() {
        return 20;
    }
    static getMaxInvalidMoves() {
        // Invalid Moves formula: (rows + columns)
        return 6;
    }
    
    static listPlayerMoves(player) {
        let movesList = [];
        let playerSymbol = (player === 1) ? "X" : "O";
        for (let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                if (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === playerSymbol) {
                    movesList.push((i + 1) + "," + (j + 1));
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
        gameStatus += "The current state of the game is illustrated on a 3 by 3 grid. 'X' represents positions taken by the first player and 'O' represents positions taken by the second player, while '.' indicates an available position. \n";
        gameStatus += "The current state of the game is as follows: \n";
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                gameStatus += (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === "") ? "." : document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
            }
            gameStatus += "\n";
        }
        return gameStatus;
    }

    static imagePrompt() {
        return "The current state of the game is depicted in an image showing a 3 by 3 grid, where 'X' represents positions taken by the first player and 'O' represents positions taken by the second player. \n";
    }
    
    static async screenshotBoard() {
        return new Promise((resolve, reject) => {
            html2canvas(document.querySelector("#tic-tac-toe-board")).then((canvas) => {
                // Download screenshot of board (for testing purposes).
                //canvas.toBlob(function(blob) {
                //saveAs(blob, "Tic Tac Toe Game Board.png");
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
        let symbol = (currentPlayer === 1) ? "X" : "O";

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
        if (row >= 1 && row <= 3 && col >= 1 && col <= 3) {
            if (document.getElementById("tic-tac-toe-" + row + "-" + col).innerText === "") {
                // Use 'X' for player 1 and 'O' for player 2.
                document.getElementById("tic-tac-toe-" + row + "-" + col).innerText = symbol;

                // Make X blue and O red.
                if(document.getElementById("tic-tac-toe-" + row + "-" + col).innerText === 'X') {
                    document.getElementById("tic-tac-toe-" + row + "-" + col).style.color = "blue";
                }
                else {
                    document.getElementById("tic-tac-toe-" + row + "-" + col).style.color = "red";
                }

                // Return successful move.
                console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + symbol + ") places at space (" + row + ", " + col + ").");
                return new Move(currentMoveCount, currentPlayer, row, col, "Y", currentStatus, JSON.stringify(jsonResponse));
            }
            else {
                // Return unsuccessful move because AI attempted to play in a space that was already taken.
                console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is already taken.");
                return new Move(currentMoveCount, currentPlayer, row, col, "Already Taken", currentStatus, JSON.stringify(jsonResponse));
            }
        }
        else {
            // Return unsuccessful move because AI attempted to play in a space that was out of bounds.
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is out of bounds.");
            return new Move(currentMoveCount, currentPlayer, row, col, "Out of Bounds", currentStatus, JSON.stringify(jsonResponse));
        }
    }

    static visualizeBoardState() {
        let boardState = "";
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let cellValue = document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
                boardState += (cellValue === "") ? "." : cellValue;
                if (j < 3 - 1) {
                    boardState += "|";
                }
            }
            boardState += "\n";
        }
        return boardState + "\n";
    }

    static checkForWin() {
        let field = new Array(3);
        for (let i = 0; i < 3; i++) {
            field[i] = new Array(3);
        }

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                field[i][j] = document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
            }
        }

        for (let i = 0; i < 3; i++) {
            // Check rows
            if (field[i][0] !== "") {
                let firstMark = field[i][0];
                let allSame = true;
                for (let j = 1; j < 3; j++) {
                    if (firstMark !== field[i][j]) {
                        allSame = false;
                    }
                }
                if (allSame) return true;
            }

            // Check columns
            if (field[0][i] !== "") {
                let firstMark = field[0][i];
                let allSame = true;
                for (let j = 1; j < 3; j++) {
                    if (firstMark !== field[j][i]) {
                        allSame = false;
                    }
                }
                if (allSame) return true;
            }
        }

        // Check top-left to bottom-right diagonal
        if (field[0][0] !== "") {
            let firstMark = field[0][0];
            let allSame = true;
            for (let i = 1; i < 3; i++) {
                if (firstMark !== field[i][i]) {
                    allSame = false;
                }
            }
            if (allSame) return true;
        }

        // Check top-right to bottom-left diagonal
        if (field[0][3 - 1] !== "") {
            let firstMark = field[0][3 - 1];
            let allSame = true;
            for (let i = 1; i < 3; i++) {
                if (firstMark !== field[i][3 - i - 1]) {
                    allSame = false;
                }
            }
            if (allSame) return true;
        }
        return false;
    }

    static checkForFullBoard() {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === "") {
                    return false;
                }
            }
        }
        return true;
    }
    
    static resetBoard() {
        for (let i = 0; i < 3; i++) {
            for(let j = 0; j < 3; j++) {
                document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText = "";
            }
        }
    }
}