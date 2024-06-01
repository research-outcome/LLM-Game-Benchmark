import { Move } from "./classes.js";

export class ConnectFour {
    static explainGame() {
        return "Connect-Four, a classic two-player game, is played on a 6 by 7 grid. The objective is to connect four of your discs in a row, either horizontally, vertically, or diagonally. The first player uses red (R) discs and the second player uses yellow (Y) discs. Strategic placement is crucial; besides aiming for four in a row, players must also block their opponent's potential connections to avoid defeat. Players take turns dropping their discs into an empty column, where the disc occupies the lowest available space. You are a skilled strategic Connect-Four player, currently engaged in a game. ";
    }
    static formatNextMove() {
        return " Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response. "
    }
    static systemPrompt() {
        return " Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response. "
    }
    static promptVersion() {
        return "2024-05-29";
    }
    static getMaxMoves() {
        return 80;
    }
    static getMaxInvalidMoves() {
        // Invalid Moves formula: (rows + columns)
        return 13;
    }

    static boardInitialized = false;

    static listPlayerMoves(player) {
        let movesList = [];
        let playerColor = (player === 1) ? 'red' : 'yellow'; 
        // Loop through each row and column
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                let cell = document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space');
                if (cell.style.backgroundColor === playerColor) {
                    movesList.push((i + 1) + "," + (j + 1));
                }
            }
        }
    
        return movesList;
    }

    static listBoard(firstPlayerMoves, secondPlayerMoves) {
        let gameStatus = "";
        gameStatus += " The current status of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by R for red discs): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by Y for yellow discs): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
        return gameStatus;
    }

    static drawBoard() {
        let gameStatus = "";
        gameStatus += " The current state of the game is displayed on a 6 by 7 grid. 'R' represents positions taken by the first player and 'Y' represents positions taken by the second player, while '.' indicates an available position. The current layout is as follows:\n";
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                let cellColor = document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space').style.backgroundColor;
                switch (cellColor) {
                    case "red":
                        gameStatus += "R";
                        break;
                    case "yellow":
                        gameStatus += "Y";
                        break;
                    default:
                        gameStatus += ".";
                        break;
                }
            }
            gameStatus += "\n";
        }
        return gameStatus;
    }

    static async screenshotBoard() {
        return new Promise((resolve, reject) => {
            html2canvas(document.querySelector("#connect-four-board")).then((canvas) => {
                // Download screenshot of board (for testing purposes).
                //canvas.toBlob(function(blob) {
                //saveAs(blob, "Connect Four Game Board.png");
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

    static processMove(currentMoveCount, currentPlayer, jsonResponse, model, currentStatus) {
        let col;
        let color = (currentPlayer === 1) ? "red" : "yellow";
        console.log("RESPONSE: " + JSON.stringify(jsonResponse));


        // Initialize the board if not already done
        if (!ConnectFour.boardInitialized) {
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                    //document.getElementById(`connect-four-${i}-${j}`).querySelector('.connect-four-space').style.backgroundColor = "white";
                    document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space').style.backgroundColor = "white";
                }
            }
            ConnectFour.boardInitialized = true; // Set the flag to true after initialization
        }

        if (jsonResponse.column !== undefined && typeof jsonResponse.column === "number") {
            col = jsonResponse.column;
        } else {
            throw new Error();
        }

        // Validate the column
        if (col >= 1 && col <= 7) {
            // Check from the bottom of the column up to find the first empty space
            for (let row = 6; row > 0; row--) {
                //console.log("connect-four-" + row + "-" + col)
                //console.log(document.getElementById("connect-four-" + row + "-" + col).querySelector('.connect-four-space').style);
                if (document.getElementById("connect-four-" + row + "-" + col).querySelector('.connect-four-space').style.backgroundColor === "white") {
                    // Update the background color to red or yellow.
                    document.getElementById("connect-four-" + row + "-" + col).querySelector('.connect-four-space').style.backgroundColor = color;
    
                    // Return successful move.
                    console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") places at column " + col + ".");
                    return new Move(currentMoveCount, currentPlayer, row, col, "Y", currentStatus, JSON.stringify(jsonResponse));
                }
            }
    
            // Return unsuccessful move because the column is full
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place in full column " + col + ".");
            return new Move(currentMoveCount, currentPlayer, 0, col, "Column Full", currentStatus, JSON.stringify(jsonResponse));
        }
        else {
            // Return unsuccessful move because AI attempted to play in a column that was out of bounds.
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place at column " + col + " which is out of bounds.");
            return new Move(currentMoveCount, currentPlayer, 0, col, "Out of Bounds", currentStatus, JSON.stringify(jsonResponse));
        }
    }

    static visualizeBoardState() {
        let boardState = "";
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                let cell = document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space');
                let cellColor = cell.style.backgroundColor;
                // Assign symbols based on color
                let symbol = '.';
                if (cellColor === "red") {
                    symbol = 'R';
                } else if (cellColor === "yellow") {
                    symbol = 'Y';
                }
                boardState += symbol;
                if (j < 7 - 1) {
                    boardState += "|";
                }
            }
            boardState += "\n";
        }
        return boardState + "\n";
    }

    static checkForWin() {
        let rows = 6;
        let cols = 7;
        let field = new Array(rows);
        for (let i = 0; i < rows; i++) {
            field[i] = new Array(cols);
        }
    
        // Populate the field array with the background colors of the cells
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let cell = document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space');
                field[i][j] = cell.style.backgroundColor;  // Get the background color
            }
        }
    
        // Check horizontal lines
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols - 3; j++) {
                if (field[i][j] !== "white" && field[i][j] === field[i][j + 1] && field[i][j] === field[i][j + 2] && field[i][j] === field[i][j + 3]) {
                    return true; // Found a win
                }
            }
        }
    
        // Check vertical lines
        for (let j = 0; j < cols; j++) {
            for (let i = 0; i < rows - 3; i++) {
                if (field[i][j] !== "white" && field[i][j] === field[i + 1][j] && field[i][j] === field[i + 2][j] && field[i][j] === field[i + 3][j]) {
                    return true; // Found a win
                }
            }
        }
    
        // Check diagonal (top-left to bottom-right)
        for (let i = 0; i < rows - 3; i++) {
            for (let j = 0; j < cols - 3; j++) {
                if (field[i][j] !== "white" && field[i][j] === field[i + 1][j + 1] && field[i][j] === field[i + 2][j + 2] && field[i][j] === field[i + 3][j + 3]) {
                    return true; // Found a win
                }
            }
        }
    
        // Check diagonal (bottom-left to top-right)
        for (let i = 3; i < rows; i++) {
            for (let j = 0; j < cols - 3; j++) {
                if (field[i][j] !== "white" && field[i][j] === field[i - 1][j + 1] && field[i][j] === field[i - 2][j + 2] && field[i][j] === field[i - 3][j + 3]) {
                    return true; // Found a win
                }
            }
        }
    
        return false; // No win found
    }

    static checkForFullBoard() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                let cellColor = document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space').style.backgroundColor;
                if (cellColor === "white") {
                    return false;  // Board is not full
                }
            }
        }
        return true;  // Board is full
    }
    
    static resetBoard() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space').style.backgroundColor = "white";
            }
        }
    }
}