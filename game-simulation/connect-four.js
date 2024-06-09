import { Move } from "./classes.js";

export class ConnectFour {
    // Return the game explanation prompt.
    static explainGame() {
        return "Connect-Four is a two-player game played on a 6 by 7 grid. The first player uses red (R) discs, and the second player uses yellow (Y) discs. Players take turns dropping their discs into a column from the top row where there is still at least one empty space. The dropped disc falls straight down, occupying the lowest available row within the column. The objective is to align four of your discs either horizontally, vertically, or diagonally. The player who first aligns four of their discs wins the game. Strategic placement is crucial; besides aiming to align their discs, players must also block their opponent's potential alignments to avoid defeat. \n";
    }
    // Return the prompt instructing the LLM on how to format its next move.
    static formatNextMove() {
        return " Suggest your next move in the following JSON format: {'column': ColumnNumber}. Do not include any additional commentary in your response. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. \n";
    }
    // Return the system prompt for the LLM.
    static systemPrompt() {
        return this.formatNextMove();
    }
    // Return a prompt that warns the LLM about the disqualification policy.
    static invalidMoveWarning() {
        return " Please note that your move will be considered invalid if your response does not follow the specified format, if you provide a ColumnNumber that is out of the allowed range, or if the column is already full (i.e., all rows in the column are occupied). Making more than " + this.getMaxInvalidMoves() + " invalid moves will result in disqualification. \n";
    }
    // Return the prompt version in YYYY-MM-DD format.
    static promptVersion() {
        return "2024-06-04";
    }
    // Return the maximum total allowed moves for the game.
    static getMaxMoves() {
        return 80;
    }
    // Return the maximum allowed invalid moves for a player. If a player exceeds this amount of invalid moves in a game, they will be disqualified in that match.
    static getMaxInvalidMoves() {
        // Invalid Moves formula: (rows + columns)
        return 13;
    }

    static boardInitialized = false; // Flag indicating whether the board has been initialized.

    // Return a list of coordinates of moves for a given player.
    static listPlayerMoves(player) {
        let movesList = [];
        let playerColor = (player === 1) ? "red" : "yellow";
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

    // Convey the board state using move coordinates.
    static listBoard() {
        let gameStatus = "";
        let firstPlayerMoves = this.listPlayerMoves(1);
        let secondPlayerMoves = this.listPlayerMoves(2);
        gameStatus += " The current state of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. \n";
        gameStatus += " The current state of the game is as follows: \n";
        gameStatus += " The locations occupied by the first player: ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + " \n";
        gameStatus += " The locations occupied by the second player: ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + " \n";
        return gameStatus;
    }

    // Draw the board in text format.
    static drawBoard() {
        let gameStatus = "";
        gameStatus += " The current state of the game is displayed on a 6 by 7 grid. 'R' represents positions taken by the first player and 'Y' represents positions taken by the second player, while '.' indicates an available position. \n";
        gameStatus += " The current state of the game is as follows: \n";
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
            gameStatus += " \n";
        }
        return gameStatus;
    }

    // Return the prompt describing the board screenshot.
    static imagePrompt() {
        return " The current state of the game is depicted in an image showing a 6 by 7 grid, where red discs represent positions taken by the first player and yellow discs represent positions taken by the second player. \n";
    }

    // Take a screenshot of the board and encode it using base64.
    static async screenshotBoard() {
        return new Promise((resolve, reject) => {
            // Screenshot size is standardized at 512px * 512px, regardless of user's window dimensions.
            html2canvas(document.querySelector("#connect-four-board"), { width: 512, height: 512, windowWidth: 1677, windowHeight: 854, scale: 1, logging: false }).then((canvas) => {
                // Download screenshot of board (for testing purposes).
                //canvas.toBlob(function(blob) {
                    //saveAs(blob, "Connect Four Game Board.png");
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

    // Construct a Move object given the model's response and display the move if it is valid.
    static processMove(response, currentPlayer, model, currentMoveCount, currentStatus) {
        let col;
        let color = (currentPlayer === 1) ? "red" : "yellow";

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

        if (response.column !== undefined && typeof response.column === "number") {
            col = response.column;
        } else {
            throw new Error();
        }

        // Validate the column
        if (col >= 1 && col <= 7) {
            // Check from the bottom of the column up to find the first empty space
            for (let row = 6; row > 0; row--) {
                if (document.getElementById("connect-four-" + row + "-" + col).querySelector('.connect-four-space').style.backgroundColor === "white") {
                    // Update the background color to red or yellow.
                    document.getElementById("connect-four-" + row + "-" + col).querySelector('.connect-four-space').style.backgroundColor = color;
    
                    // Return successful move.
                    console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") places at column " + col + ".");
                    return new Move(currentMoveCount, currentPlayer, row, col, "Valid", currentStatus, JSON.stringify(response));
                }
            }
    
            // Return unsuccessful move because the column is full
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place in full column " + col + ".");
            return new Move(currentMoveCount, currentPlayer, -1, col, "Already Taken", currentStatus, JSON.stringify(response));
        }
        else {
            // Return unsuccessful move because AI attempted to play in a column that was out of bounds.
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + color + ") tried to place at column " + col + " which is out of bounds.");
            return new Move(currentMoveCount, currentPlayer, -1, col, "Out of Bounds", currentStatus, JSON.stringify(response));
        }
    }

    // Visualize the board state in a text-based format to be used for the visual game logs in the text files.
    // Note that this format is different from the output given from the "drawBoard()" function, adding extra separators |.
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

    // Check to see if a player has won. If so, return true.
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

    // Check to see if the board is full. If so, return true.
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

    // Delete all moves from the board.
    static resetBoard() {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 7; j++) {
                document.getElementById("connect-four-" + (i + 1) + "-" + (j + 1)).querySelector('.connect-four-space').style.backgroundColor = "white";
            }
        }
    }
}