import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize variables
let GAME_RESET_DELAY = 5000; // Time to wait (in milliseconds) before resetting the board after a game ends.
let INVALID_MOVE_THRESHOLD = 10; // Number of invalid moves a player can make before the win is given to the other player.

let OPENAI_API_KEY = "sk-proj-AI4ZtKkTSmFvG37WBuevT3BlbkFJnhRKpeh2YyfqTctRQ8il";
let OPENAI_URL = "https://api.openai.com/v1/chat/completions";
let GOOGLE_API_KEY = "AIzaSyC-xij8Mk7bdlh0HDQUbNaSseqkqY4nTBE";

let PROMPT_EXPLAIN_TIC_TAC_TOE = "Tic-Tac-Toe, a classic two-player game, is played on a 3 by 3 grid. The objective is to align three of your symbols, Xs for the first player and Os for the second, either horizontally, vertically, or diagonally. Strategic placement is crucial; besides aiming for three in a row, players must also block their opponent's potential alignments to avoid defeat. Players take turns placing their symbols in an empty cell on the grid. You are an adept strategic Tic-Tac-Toe player, currently playing the game.";
let PROMPT_RESPONSE_FORMAT_NEXT_MOVE_TIC_TAC_TOE = "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 3, as the grid is 3 by 3. ";
let SYSTEM_PROMPT_TIC_TAC_TOE = "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 3, as the grid is 3 by 3. "

let PROMPT_EXPLAIN_CONNECT_FOUR = "Connect-Four, a classic two-player game, is played on a 7 by 6 grid. The objective is to connect four of your discs in a row, either horizontally, vertically, or diagonally. The first player uses red (R) discs and the second player uses yellow (Y) discs. Strategic placement is crucial; besides aiming for four in a row, players must also block their opponent's potential connections to avoid defeat. Players take turns dropping their discs into an empty column, where the disc occupies the lowest available space. You are a skilled strategic Connect-Four player, currently engaged in a game.";
let PROMPT_RESPONSE_FORMAT_NEXT_MOVE_CONNECT_FOUR = "Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response."
let SYSTEM_PROMPT_CONNECT_FOUR = "Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response."

let PROMPT_EXPLAIN_GOMOKU = "Gomoku, a classic two-player game, is played on a 15 by 15 grid. The objective is to align five of your stones, black for the first player and white for the second, either horizontally, vertically, or diagonally. Strategic placement is crucial; besides aiming for five in a row, players must also block their opponent's potential alignments to avoid defeat. Players take turns placing their stones on an empty intersection of the grid. You are a skilled strategic Gomoku player, currently engaged in a game.";
let PROMPT_RESPONSE_FORMAT_NEXT_MOVE_GOMOKU = "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15.";
let SYSTEM_PROMPT_GOMOKU = "Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15.";

let TIC_TAC_TOE_BOARD_SIZE = 3;
let TIC_TAC_TOE_MAX_ALLOWED_MOVES = 20;

let models = [];
let gameStopped = false;
let resetStats = true;

// Event Handlers
document.getElementById("game-type").addEventListener("change", (event) => {
    resetStats = true;
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    if (event.target.value === "tic-tac-toe") {
        document.getElementById("tic-tac-toe-board").style.display = "table";
        document.getElementById("connect-four-board").style.display = "none";
        document.getElementById("gomoku-board").style.display = "none";
    }
    else if (event.target.value === "connect-four") {
        document.getElementById("tic-tac-toe-board").style.display = "none";
        document.getElementById("connect-four-board").style.display = "table";
        document.getElementById("gomoku-board").style.display = "none";
    }
    else if (event.target.value === "gomoku") {
        document.getElementById("tic-tac-toe-board").style.display = "none";
        document.getElementById("connect-four-board").style.display = "none";
        document.getElementById("gomoku-board").style.display = "table";
    }
});

document.getElementById("start-btn").addEventListener("click", (event) => {
    playGame();
});

document.getElementById("reset-btn").addEventListener("click", () => {
    resetStats = true;
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
});

document.getElementById("stop-btn").addEventListener("click", (event) => {
    console.log("Stopping gameplay...");
    gameStopped = true;
});

document.getElementById("prompt-info-btn").addEventListener("click", () => {
    if (document.getElementById("prompt-info").style.display === "none") {
        document.getElementById("prompt-info").style.display = "flex";
    }
    else {
        document.getElementById("prompt-info").style.display = "none";
    }
});

document.getElementById("edit-llms-btn").addEventListener("click", () => {
    document.getElementById("edit-llms").style.display = "inline-block";
});

document.getElementById("first-player").addEventListener("change", () => {
    checkImageCompatibility();
});

document.getElementById("second-player").addEventListener("change", () => {
    checkImageCompatibility();
});


async function playGame() {
    // Obtain existing user selections and initialize current game count to 0.
    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;
    let currentGameCount = 0;

    // Obtain existing statistics from the "stats" box.
    let firstPlayerWins = parseInt(document.getElementById("first-player-wins").innerText.split(': ')[1]);
    let secondPlayerWins = parseInt(document.getElementById("second-player-wins").innerText.split(': ')[1]);
    let draws = parseInt(document.getElementById("draws").innerText.split(': ')[1]);
    let firstPlayerTotalMoveCount = parseInt(document.getElementById("first-player-moves").innerText.split(': ')[1]);
    let secondPlayerTotalMoveCount= parseInt(document.getElementById("second-player-moves").innerText.split(': ')[1]);
    let firstPlayerDisqualifications= parseInt(document.getElementById("first-player-disqualifications").innerText.split(': ')[1]);
    let secondPlayerDisqualifications= parseInt(document.getElementById("second-player-disqualifications").innerText.split(': ')[1]);
    let firstPlayerTotalInvalidMoves = parseInt(document.getElementById("first-player-invalid-moves").innerText.split(': ')[1]);
    let secondPlayerTotalInvalidMoves = parseInt(document.getElementById("second-player-invalid-moves").innerText.split(': ')[1]);
    let firstPlayerMovesPerWin = parseFloat(document.getElementById("first-player-moves-per-win").innerText.split(': ')[1]);
    let secondPlayerMovesPerWin = parseFloat(document.getElementById("second-player-moves-per-win").innerText.split(': ')[1]);

    // If the user has pressed the "reset stats" button, reset the stats.
    if (resetStats) {
        firstPlayerWins = 0;
        secondPlayerWins = 0;
        firstPlayerDisqualifications = 0;
        secondPlayerDisqualifications = 0;
        draws = 0;
        firstPlayerTotalMoveCount = 0;
        secondPlayerTotalMoveCount = 0;
        firstPlayerTotalInvalidMoves = 0;
        secondPlayerTotalInvalidMoves = 0;
        firstPlayerMovesPerWin = 0;
        secondPlayerMovesPerWin = 0;
        resetStats = false;
    }

    document.getElementById("start-btn").style.display = "none";  // Hide start button
    document.getElementById("stop-btn").style.display = "block";  // Show stop button
    updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount); // Initialize game information field.
    updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin); // Update statistics field.
    disableInputs(true); // Disable selection input fields.

    while(currentGameCount < gameCount) {
        let isGameActive = true;
        gameStopped = false;
        let currentMoveCount = 1;
        let currentPlayer = 1;
        let moves = [];
        let firstPlayerCurrentInvalidMoves = 0;
        let secondPlayerCurrentInvalidMoves = 0;
        let gameLog = "";
        let gameStartTime = Date.now();

        while(isGameActive) {
            // If gameplay was stopped, exit before attempting to fetch move.
            if (gameStopped) {
                currentGameCount = gameCount;
                break;
            }

            // Get the current model object from the 'models' list.
            let model = (currentPlayer === 1) ? models[document.getElementById("first-player").selectedIndex] : models[document.getElementById("second-player").selectedIndex];

            // Get initial response from the corresponding API for the model.
            let initialContent = await getMove(promptType, gameType, currentPlayer, model);

            // If gameplay was stopped, exit before attempting to process move.
            if (gameStopped) {
                currentGameCount = gameCount;
                break;
            }

            // Get move object, which includes LLM and outcome ('Y' for valid move, or a description of how the move was invalid).
            let move = await processMove(gameType, initialContent, currentPlayer, model, currentMoveCount);
            moves.push(move);

            // If a valid move was made, process it.
            if(move.getOutcome() === "Y") {
                gameLog += updateGameLog(gameType); // Append new move to visual game log.

                // If a player has won the game, process it accordingly.
                if (checkForWin(gameType)) {
                    let winner;
                    if (currentPlayer === 1) {
                        winner = "1st";
                        firstPlayerWins++;
                        firstPlayerMovesPerWin = firstPlayerTotalMoveCount / firstPlayerWins;
                    } else {
                        winner = "2nd";
                        secondPlayerWins++;
                        secondPlayerMovesPerWin = secondPlayerTotalMoveCount / secondPlayerWins;
                    }

                    // Log the current game to output files and set gameplay as inactive because game has concluded.
                    writeGameLogToFile(firstPlayer, secondPlayer, "winner" + winner, gameStartTime, gameType, promptType, gameCount, currentGameCount, currentMoveCount, gameLog, moves);
                    console.log(winner + " player wins!");
                    isGameActive = false;
                }
                // If a draw has taken place, process it accordingly.
                else if (isBoardFull(gameType)) {
                    draws++;
                    writeGameLogToFile(firstPlayer, secondPlayer, "draw", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves);
                    console.log("Draw");
                    isGameActive = false;
                }

                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players since the move was valid.
            }
            // An invalid move was made, process it accordingly.
            else {
                if (currentPlayer === 1) {
                    firstPlayerCurrentInvalidMoves++;
                }
                else {
                    secondPlayerCurrentInvalidMoves++;
                }

                // If a player's invalid move count is above the threshold, disqualify the player.
                if (firstPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    writeGameLogToFile(firstPlayer, secondPlayer, "disqualified1st", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves);
                    console.log("Player 1 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    writeGameLogToFile(firstPlayer, secondPlayer, "disqualified2nd", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves);
                    console.log("Player 2 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
            }

            if (currentPlayer === 1) {
                firstPlayerTotalMoveCount++;
            }
            else {
                secondPlayerTotalMoveCount++;
            }

            // If gameplay was stopped, exit prior to updating game statistics.
            if (gameStopped) {
                currentGameCount = gameCount;
                break;
            }

            // Update statistics information and increment move count, because a move has taken place.
            updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin);
            currentMoveCount++;

            // If the number of moves has exceeded the maximum allowed, cancel the game.
            if (currentMoveCount >= TIC_TAC_TOE_MAX_ALLOWED_MOVES) {
                writeGameLogToFile(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves);
                console.log("Game Cancelled");
                isGameActive = false;
            }
        }
        // Add invalid moves that took place in the last game to the total.
        firstPlayerTotalInvalidMoves += firstPlayerCurrentInvalidMoves;
        secondPlayerTotalInvalidMoves += secondPlayerCurrentInvalidMoves;

        // Pause game to allow user to view results. Then, reset the board and update game information.
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        resetBoard(gameType);
        currentGameCount++;
        updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount, gameType, promptType, currentGameCount, currentMoveCount, gameLog);
    }

    // Once all games have finished, write a submission JSON file, re-enable inputs, and show the start button again.
    writeSubmissionJson(gameType, promptType, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, "cedell@floridapoly.edu");
    disableInputs(false);
    document.getElementById("start-btn").style.display = "block";  // Show start button
    document.getElementById("stop-btn").style.display = "none";  // Hide stop button
}

// Enable or disable option input fields.
function disableInputs(disableFlag) {
    document.getElementById("game-type").disabled = disableFlag;
    document.getElementById("game-count").disabled = disableFlag;
    document.getElementById("first-player").disabled = disableFlag;
    document.getElementById("second-player").disabled = disableFlag;
    document.getElementById("prompt-type").disabled = disableFlag;
    document.getElementById("reset-btn").disabled = disableFlag;
}

// Display selected gameplay options, as well as current game count, to the user.
function updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount) {
    let adjustedGameCount;

    // Do not increment game count after last game has finished.
    if (currentGameCount >= gameCount) {
        adjustedGameCount = currentGameCount;
    }
    else {
        adjustedGameCount = currentGameCount + 1;
    }

    document.getElementById("game-info").innerHTML =
        "<div><strong><em>Current Selections:</em></strong></div>" +
        "<div class='info'><strong>Game Type: </strong>" + gameType + "</div>" +
        "<div class='info'><strong>1st Player: </strong>" + firstPlayer + "</div>" +
        "<div class='info'><strong>2nd Player: </strong>" + secondPlayer + "</div>" +
        "<div class='info'><strong>Prompt Type: </strong>" + promptType + "</div>" +
        "<div class='info'><strong>Number of Games: </strong>" + gameCount + "</div>" +
        "<div class='info'><strong>Current Game: </strong>" + adjustedGameCount + "</div>";
}

// Display game statistics to the user.
function updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin) {
    document.getElementById("first-player-wins").innerHTML = "<div class='info' id='first-player-wins'><strong>1st Player Wins: </strong>" + firstPlayerWins + "</div>";
    document.getElementById("second-player-wins").innerHTML = "<div class='info' id='second-player-wins'><strong>2nd Player Wins: </strong>" + secondPlayerWins + "</div>";
    document.getElementById("draws").innerHTML = "<div class='info' id='draws'><strong>Draws: </strong>" + draws + "</div>";
    document.getElementById("first-player-moves").innerHTML = "<div class='info' id='first-player-moves'><strong>1st Player Moves: </strong>" + firstPlayerTotalMoveCount + "</div>";
    document.getElementById("second-player-moves").innerHTML = "<div class='info' id='second-player-moves'><strong>2nd Player Moves: </strong>" + secondPlayerTotalMoveCount + "</div>";
    document.getElementById("first-player-disqualifications").innerHTML = "<div class='info' id='first-player-disqualifications'><strong>1st Player Disqual.: </strong>" + firstPlayerDisqualifications + "</div>";
    document.getElementById("second-player-disqualifications").innerHTML = "<div class='info' id='second-player-disqualifications'><strong>2nd Player Disqual.: </strong>" + secondPlayerDisqualifications + "</div>";
    document.getElementById("first-player-invalid-moves").innerHTML = "<div class='info' id='first-player-invalid-moves'><strong>1st Player Invalid Moves: </strong>" + firstPlayerTotalInvalidMoves + "</div>";
    document.getElementById("second-player-invalid-moves").innerHTML = "<div class='info' id='second-player-invalid-moves'><strong>2nd Player Invalid Moves: </strong>" + secondPlayerTotalInvalidMoves + "</div>";
    document.getElementById("first-player-moves-per-win").innerHTML = "<div class='info' id='first-player-moves-per-win'><strong>1st Player Moves per Win: </strong>" + firstPlayerMovesPerWin + "</div>";
    document.getElementById("second-player-moves-per-win").innerHTML = "<div class='info' id='second-player-moves-per-win'><strong>2nd Player Moves per Win: </strong>" + secondPlayerMovesPerWin + "</div>";
}

// Check if a win has taken place in the given game type.
function checkForWin(gameType) {
    if (gameType === "tic-tac-toe") {
        return checkForWinTicTacToe(TIC_TAC_TOE_BOARD_SIZE);
    }
}

// Check if a win has taken place in tic-tac-toe.
function checkForWinTicTacToe() {
    let field = [TIC_TAC_TOE_BOARD_SIZE];
    for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
        field[i] = [];
    }

    for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
        for (let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
            field[i][j] = document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
        }
    }

    for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
        // Check rows
        if (field[i][0] !== "") {
            let firstMark = field[i][0];
            let allSame = true;
            for (let j = 1; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
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
            for (let j = 1; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
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
        for (let i = 1; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            if (firstMark !== field[i][i]) {
                allSame = false;
            }
        }
        if (allSame) return true;
    }

    // Check top-right to bottom-left diagonal
    if (field[0][TIC_TAC_TOE_BOARD_SIZE - 1] !== "") {
        let firstMark = field[0][TIC_TAC_TOE_BOARD_SIZE - 1];
        let allSame = true;
        for (let i = 1; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            if (firstMark !== field[i][TIC_TAC_TOE_BOARD_SIZE - i - 1]) {
                allSame = false;
            }
        }
        if (allSame) return true;
    }
    return false;
}

// Check if the board is full for a given game.
function isBoardFull(gameType) {
    if (gameType === "tic-tac-toe") {
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for (let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                if (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === "") {
                    return false;
                }
            }
        }
        return true;
    }
}

// Reformat special characters for use in prompts.
function escapeStringForJson(input) {
    input = input.replace("\n", "\\n");
    return input.replace("\"", "\\\"");
}

// Generate a prompt given the game type, prompt type, and player number.
function createPrompt(promptType, gameType, currentPlayer) {
    let prompt = "";
    if (gameType === "tic-tac-toe") {
        prompt += PROMPT_EXPLAIN_TIC_TAC_TOE; // Prepend tic-tac-toe explanation.
        prompt += PROMPT_RESPONSE_FORMAT_NEXT_MOVE_TIC_TAC_TOE;
    }
    else if (gameType === "connect-four") {
        prompt += PROMPT_EXPLAIN_CONNECT_FOUR;
        prompt += PROMPT_RESPONSE_FORMAT_NEXT_MOVE_CONNECT_FOUR;
    }
    else if (gameType === "gomoku") {
        prompt += PROMPT_EXPLAIN_GOMOKU;
        prompt += PROMPT_RESPONSE_FORMAT_NEXT_MOVE_GOMOKU;
    }

    if (promptType === "list") {
        prompt += listBoard(gameType);
    }
    else if (promptType === "illustration") {
        prompt += drawBoard(gameType);
    }

    if (currentPlayer === 1) {
        prompt += "You are the first player. What would be your next move?";
    }
    else {
        prompt += "You are the second player. What would be your next move?";
    }

    return escapeStringForJson(prompt);
}

// Create a system prompt given a model.
function createSystemPrompt(currentModel) {
    let systemPrompt = "";
    return escapeStringForJson(systemPrompt);
}

// List the board state for a given game type.
function listBoard(gameType) {
    let gameStatus = '';
    let firstPlayerMoves = getMovesForPlayer(gameType, 1);
    let secondPlayerMoves = getMovesForPlayer(gameType, 2);

    if (gameType === "tic-tac-toe") {
        gameStatus += "The current status of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by X): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by O): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
    }
    else if (gameType === "connect-four") {
        gameStatus += "The game's progress is noted by recording each move in a specific format: moves are delineated with a semicolon (';'), and within each move, the column is indicated by a number. If no moves were taken by the player, 'None' is noted. The current state of the game as indicated by the previous moves is as follows:\n";
        gameStatus += "The moves by the first player (using red discs): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The moves by the second player (using yellow discs): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
    }
    else if (gameType === "gomoku") {
        gameStatus += "The current state of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by B for black stones): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by W for white stones): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
    }
    return gameStatus;
}

// Draw the board for a given game type.
function drawBoard(gameType) {
    let gameStatus = '';
    if (gameType === "tic-tac-toe") {
        gameStatus += "The current state of the game is displayed on a 3 by 3 grid. 'X' represents positions taken by the first player and 'O' represents positions taken by the second player, while '.' indicates an available position. The current layout is as follows:\n";
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for (let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                gameStatus += (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === "") ? "." : document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
            }
            gameStatus += "\n";
        }
    }
    else if (gameType === "connect-four") {
        gameStatus += "The previous moves are presented on a grid layout. 'R' and 'Y' indicate positions taken by the first player (using red discs) and the second player (using yellow discs), respectively, while '.' indicates an available position in the 7 by 6 grid.\n";
        gameStatus += "The current state of the game, showing previously taken and available positions, is as follows:\n";
        // Connect four game drawing logic here
    }
    else if (gameType === "gomoku") {
        gameStatus += "The current state of the game is displayed on a 15 by 15 grid. 'B' represents positions taken by the first player (using black stones) and 'W' represents positions taken by the second player (using white stones), while '.' indicates an available position. The current layout is as follows:\n";
        // Gomoku game drawing logic here
    }
    return gameStatus;
}

// Reset the board for a given game type.
function resetBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for(let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText = "";
            }
        }
    }
}

// Generate a prompt, call the LLM, and return its response.
async function getMove(promptType, gameType, currentPlayer, model) {
    let prompt = createPrompt(promptType, gameType, currentPlayer);
    let systemPrompt = createSystemPrompt();
    return await asynchronousWebServiceCall(prompt, systemPrompt, model);
}

// Determine if the LLM's move was valid. Return a "Move" object which contains the model name and move outcome ("Y" for valid moves, explanations for invalid moves)
async function processMove(gameType, initialContent, currentPlayer, model, currentMoveCount) {
    if (gameType === "tic-tac-toe") {
        let row;
        let col;
        let jsonResponse = cleanResponse(initialContent);
        let modelType = model.getType();
        let symbol = (currentPlayer === 1) ? "X" : "O";
        try {
            if (modelType === "Google") {
                if (jsonResponse.candidates !== undefined) {
                    jsonResponse = jsonResponse.candidates[0].content.parts[0].text;
                }
                if (jsonResponse.row !== undefined) {
                    row = jsonResponse.row;
                }
                if (jsonResponse.column !== undefined) {
                    col = jsonResponse.column;
                }
            }
            else if (modelType === "OpenAI") {
                if (jsonResponse.choices !== undefined) {
                    jsonResponse = jsonResponse.choices[0].message.content;
                }
                if (jsonResponse.row !== undefined) {
                    row = jsonResponse.row;
                }
                if (jsonResponse.column !== undefined) {
                    col = jsonResponse.column;
                }
            }
        }
        catch (e) {
            console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + model.getName() + " (" + symbol + ")'s given move had an invalid format.");
            return "Invalid Format";
        }

        // Validate row and column
        if (row >= 1 && row <= TIC_TAC_TOE_BOARD_SIZE && col >= 1 && col <= TIC_TAC_TOE_BOARD_SIZE) {
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
                console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + model.getName() + " (" + symbol + ") places at space (" + row + ", " + col + ").");
                return new Move(currentPlayer, "Y");
            }
            else {
                // Return unsuccessful move because AI attempted to play in a space that was already taken.
                console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + model.getName() + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is already taken.");
                return new Move(currentPlayer, "Already Taken");
            }
        }
        else {
            // Return unsuccessful move because AI attempted to play in a space that was out of bounds.
            console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + model.getName() + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is out of bounds.");
            return new Move(currentPlayer, "Out of Bounds");
        }
    }
    else if (gameType === "connect-four") {
        // Connect Four move processing logic here
    }
    else if (gameType === "gomoku") {
        // Gomoku move processing logic here
    }
}

// Clean the LLM's response by reformatting certain characters and parsing it into a JSON object.
function cleanResponse(content) {
    content = content.replace("\\\"", "'");
    content = content.replace("'row'", "\"row\"");
    content = content.replace("'column'", "\"column\"");
    content = content.replace("\"{", "{");
    content = content.replace("}\"", "}");
    content = content.replace("'}", "}");
    if (content.indexOf("{") !== -1) {
        content = content.substring(content.indexOf("{"));
        if (content.lastIndexOf("}") !== -1) {
            content = content.substring(0, content.lastIndexOf("}") + 1);
        }
    }
    return JSON.parse(content);
}

// Call an LLM with a given prompt, and return its response.
async function asynchronousWebServiceCall(prompt, systemPrompt, model) {
    let modelType = model.getType();
    let modelName = model.getName();
    let apiKey = model.getApiKey();

    if (modelType === "Google") {
        let genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: modelName });
        let result = await model.generateContent(prompt);
        let response = await result.response;
        return JSON.stringify(response);
    }
    return new Promise((resolve, reject) => {
        let url = new URL(model.getUrl());
        let secret = "LLM-GameOn";
        let requestBody;

        if (modelType === "OpenAI") {
            requestBody = JSON.stringify({
                "model": modelName,
                "messages": [{
                    "role": "user",
                    "content": prompt
                }]
            });
        }

        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: requestBody
        }).then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Error: Unexpected response code: " + response.status);
            }
        }).then(data => {
            resolve(JSON.stringify(data));
        }).catch(error => {
            reject(error)
        });
    });
}

// Return a list of moves in (row, column) format for a given game type and player.
function getMovesForPlayer(gameType, player) {
    let movesList = [];
    if (gameType === "tic-tac-toe") {
        let playerSymbol = (player === 1) ? "X" : "O";
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for(let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                if (document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText === playerSymbol) {
                    movesList.push((i + 1) + "," + (j + 1));
                }
            }
        }
    }
    else if (gameType === "connect-four") {
        // Connect four move retrieval logic here
    }
    else if (gameType === "gomoku") {
        // Gomoku move retrieval logic here
    }
    return movesList;
}

// Format a game duration (given in milliseconds) in min:sec format.
function formatGameDuration(durationInMillis) {
    let seconds = Math.round(durationInMillis / 1000);
    let minutes = Math.round(seconds / 60);
    minutes = String((minutes < 10) ? '0' + minutes : minutes).padStart(2, "0"); // Pad with 0s to at least 2 decimal places.
    seconds = seconds % 60;
    seconds = String((seconds < 10) ? '0' + seconds : seconds).padStart(2, "0");
    return (minutes + ":" + seconds);
}

// Format a timestamp in yyMMdd-HHmmss format.
function formatTimestamp(gameEndTime) {
    let year = String(gameEndTime.getFullYear()).slice(-2); // Get last 2 digits of year.
    let month = String(gameEndTime.getMonth() + 1).padStart(2, "0"); // Get month and pad to 2 digits.
    let day = String(gameEndTime.getDate()).padStart(2, "0"); // Get day and pad to 2 digits.
    let hours = String(gameEndTime.getHours()).padStart(2, "0"); // Get hour and pad to 2 digits.
    let minutes = String(gameEndTime.getMinutes()).padStart(2, "0"); // Get minute and pad to 2 digits.
    let seconds = String(gameEndTime.getSeconds()).padStart(2, "0"); // Get seconds and pad to 2 digits.

    // Return timestamp in yyMMdd-HHmmss format.
    return year + month + day + "-" + hours + minutes + seconds;
}

// Return a visualized board state to be appended to the game log, which is used in .txt log files.
function updateGameLog(gameType) {
    let boardState = "";
    if (gameType === "tic-tac-toe") {
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for (let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                let cellValue = document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText;
                boardState += (cellValue === "") ? "." : cellValue;
                if (j < TIC_TAC_TOE_BOARD_SIZE - 1) {
                    boardState += "|";
                }
            }
            boardState += "\n";
        }
    }
    return boardState + "\n";
}

// Write information about the current game to .txt, .json, and .csv formats.
function writeGameLogToFile(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves) {
    let gameDuration = formatGameDuration(Date.now() - gameStartTime);
    let sanitizedFirstPlayer = firstPlayer.replace("/", "_");
    let sanitizedSecondPlayer = secondPlayer.replace("/", "_");
    result = result.replace("/", "_");

    // Count the number of invalid moves and their types.
    let invalidMovesFirstPlayerAlreadyTaken = 0;
    let invalidMovesSecondPlayerAlreadyTaken = 0;
    let invalidMovesFirstPlayerInvalidFormat = 0;
    let invalidMovesSecondPlayerInvalidFormat = 0;
    let invalidMovesFirstPlayerOutOfBounds = 0;
    let invalidMovesSecondPlayerOutOfBounds = 0;

    for (let move of moves) {
        if (move.getPlayer() === 1) {
            if (move.getOutcome() === "Already Taken") {
                invalidMovesFirstPlayerAlreadyTaken++;
            }
            if (move.getOutcome() === "Out of Bounds") {
                invalidMovesFirstPlayerOutOfBounds++;
            }
            if (move.getOutcome() === "Invalid Format") {
                invalidMovesFirstPlayerInvalidFormat++;
            }
        }
        else {
            if (move.getOutcome() === "Already Taken") {
                invalidMovesSecondPlayerAlreadyTaken++;
            }
            if (move.getOutcome() === "Out of Bounds") {
                invalidMovesSecondPlayerOutOfBounds++;
            }
            if (move.getOutcome() === "Invalid Format") {
                invalidMovesSecondPlayerInvalidFormat++;
            }
        }
    }

    // Name the output files.
    let timestamp = formatTimestamp(new Date());
    let fileName = gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + result + "_" + timestamp;
    let textFileName = fileName + ".txt";
    let jsonFileName = fileName + ".json";
    let csvFileName = fileName + ".csv";

    // Generate the text file content.
    let textFileContent = "Game Type: " + gameType + "\n" +
        "Game #: " + (currentGameCount + 1) + "\n" +
        "Prompt Type: " + promptType + "\n" +
        "Player 1: " + sanitizedFirstPlayer + "\n" +
        "Player 2: " + sanitizedSecondPlayer + "\n" +
        "Date and time (yyMMdd-HHmmss): " + timestamp + "\n" +
        "Game Duration: " + gameDuration + "\n" +
        "Total Moves: " + currentMoveCount + "\n" +
        "Player 1 Invalid Format Moves: " + invalidMovesFirstPlayerInvalidFormat + "\n" +
        "Player 2 Invalid Format Moves: " + invalidMovesSecondPlayerInvalidFormat + "\n" +
        "Player 1 Already Taken Moves: " + invalidMovesFirstPlayerAlreadyTaken + "\n" +
        "Player 2 Already Taken Moves: " + invalidMovesSecondPlayerOutOfBounds + "\n" +
        "Player 1 Out of Bounds Moves: " + invalidMovesFirstPlayerOutOfBounds + "\n" +
        "Player 2 Out of Bounds Moves: " + invalidMovesSecondPlayerOutOfBounds + "\n" +
        "Result: " + result + "\n" +
        "Game Progress: \n" +
        gameLog;

    // Generate the JSON file content.
    let jsonFileContent = "{\"GameType\": \"" + gameType + "\", \"Prompt\": \"" + promptType + "\", \"LLM1stPlayer\": \"" + firstPlayer + "\", \"LLM2ndPlayer\": \"" + secondPlayer + "\"}";

    // Generate the CSV file content.
    let csvFileContent = "Timestamp,GameType,PromptType,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds\n" +
        timestamp + "," + gameType + "," + promptType + "," + firstPlayer + "," + secondPlayer + "," + result + "," + gameDuration + "," + currentMoveCount + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds;

    // Download each of the generated files.
    downloadFile(textFileContent, 'txt', textFileName);
    downloadFile(jsonFileContent, 'json', jsonFileName);
    downloadFile(csvFileContent, 'csv', csvFileName);
}

// Generate a JSON file containing aggregated information about a number of games to be submitted to the leaderboard.
function writeSubmissionJson(gameType, promptType, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, providerEmail) {
    let sanitizedFirstPlayer = firstPlayer.replace("/", "_");
    let sanitizedSecondPlayer = secondPlayer.replace("/", "_");

    // Name the submission file.
    let timestamp = formatTimestamp(new Date());
    let fileName = "submission_" + gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + timestamp + ".json";

    // Generate the submission file content.
    let submissionFileContent = "{\"GameType\": \"" + gameType +
        "\", \"Prompt\": \"" + promptType +
        "\", \"LLM1stPlayer\": \"" + firstPlayer +
        "\", \"LLM2ndPlayer\": \"" + secondPlayer +
        "\", \"WinRatio-1st\": \"" + firstPlayerWins/gameCount +
        "\", \"WinRatio-2nd\": \"" + secondPlayerWins/gameCount +
        "\", \"Wins-1st\": \"" + firstPlayerWins +
        "\", \"Wins-2nd\": \"" + secondPlayerWins +
        "\", \"Disqualifications-1st\": \"" + firstPlayerDisqualifications +
        "\", \"Disqualifications-2nd\": \"" + secondPlayerDisqualifications +
        "\", \"Draws\": \"" + draws +
        "\", \"InvalidMovesRatio-1st\": \"" + firstPlayerTotalInvalidMoves/firstPlayerTotalMoveCount +
        "\", \"InvalidMovesRatio-2nd\": \"" + secondPlayerTotalInvalidMoves/secondPlayerTotalMoveCount +
        "\", \"TotalMoves-1st\": \"" + firstPlayerTotalMoveCount +
        "\", \"TotalMoves-2nd\": \"" + secondPlayerTotalMoveCount +
        "\", \"ProviderEmail\": \"" + providerEmail +
        "\", \"SubmissionDate\": \"" + timestamp +
        "\"}";

    // Download the generated submission file.
    downloadFile(submissionFileContent, 'json', fileName);
}

// Download a file given its content, file extension, and filename.
function downloadFile(content, extension, fileName) {
    let type = "";
    if (extension === 'txt') {
        type = "text/plain";
    }
    else if (extension === 'csv') {
        type = "text/csv";
    }
    else if (extension === 'json') {
        type = "text/json";
    }

    // Create an invisible HTML anchor element that contains the text content.
    let downloadAnchor = window.document.createElement('a');
    downloadAnchor.href = window.URL.createObjectURL(new Blob([content], {type: type}));
    downloadAnchor.download = fileName;

    // Append the downloader anchor element to the HTML body and emulate a click on it to download the file.
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();

    // Remove the downloader anchor element from the HTML body.
    document.body.removeChild(downloadAnchor);
}

// 'Move' class which contains the LLM name and move outcome ("Y" for valid moves, or explanations of invalid move types)
class Move {
    #player;
    #outcome;

    constructor(player, outcome) {
        this.#player = player;
        this.#outcome = outcome;
    }

    getPlayer() {
        return this.#player;
    }
    getOutcome() {
        return this.#outcome;
    }
}

// 'Model' class which contains the model's type (company), name, API key, URL, and whether it supports images.
class Model {
    #type;
    #name;
    #apiKey;
    #url;
    #supportsImages;

    constructor(type, name, apiKey, url, supportsImages) {
        this.#type = type;
        this.#name = name;
        this.#apiKey = apiKey;
        this.#url = url;
        this.#supportsImages = supportsImages;
    }

    getType() {
        return this.#type;
    }
    getName() {
        return this.#name;
    }
    getApiKey() {
        return this.#apiKey;
    }
    getUrl() {
        return this.#url;
    }
    getSupportsImages() {
        return this.#supportsImages;
    }
}

// Add a model to the list of models available for gameplay, and update the LLM dropdowns accordingly.
function addModel(model) {
    models.push(model);

    document.getElementById("first-player").innerHTML +=
        "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
    document.getElementById("second-player").innerHTML +=
        "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
}

// If both LLMs selected by the user support images as input, allow it as an option in the "prompt type" field.
function checkImageCompatibility() {
    if (models[document.getElementById("first-player").selectedIndex].getSupportsImages() && models[document.getElementById("second-player").selectedIndex].getSupportsImages()) {
        document.getElementById("prompt-type").innerHTML = "<option value=\"list\">List</option>" +
            "<option value=\"illustration\">Illustration</option>" +
            "<option value=\"image\">Image</option>";
    }
    else {
        document.getElementById("prompt-type").innerHTML = "<option value=\"list\">List</option>" +
            "<option value=\"illustration\">Illustration</option>";
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    // Add initial models.
    addModel(new Model("OpenAI", "gpt-3.5-turbo", OPENAI_API_KEY, OPENAI_URL, false));
    addModel(new Model("OpenAI", "gpt-4", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("OpenAI", "gpt-4-turbo", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("OpenAI", "gpt-4o", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("Google", "gemini-pro", GOOGLE_API_KEY, null, false));
    addModel(new Model("Google", "gemini-pro-vision", GOOGLE_API_KEY, null, true));

    // Initialize user selections and game statistics information windows.
    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let currentGameCount = 0;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;
    updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount);
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
});
