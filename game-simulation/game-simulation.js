import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize variables
let GAME_RESET_DELAY = 5000; // Time to wait (in milliseconds) before resetting the board after a game ends.
let INVALID_MOVE_THRESHOLD = 5; // Number of invalid moves a player can make before the win is given to the other player.

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
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0);

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
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0);
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

document.getElementById("first-player").addEventListener("change", () => {
    checkImageCompatibility();
});

document.getElementById("second-player").addEventListener("change", () => {
    checkImageCompatibility();
});


async function playGame() {
    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let currentGameCount = 0;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;

    // Obtain existing statistics.
    let firstPlayerWins = parseInt(document.getElementById("first-player-wins").innerText.split(': ')[1]);
    let secondPlayerWins = parseInt(document.getElementById("second-player-wins").innerText.split(': ')[1]);
    let draws = parseInt(document.getElementById("draws").innerText.split(': ')[1]);
    let firstPlayerTotalMoveCount = parseInt(document.getElementById("first-player-moves").innerText.split(': ')[1]);
    let secondPlayerTotalMoveCount= parseInt(document.getElementById("second-player-moves").innerText.split(': ')[1]);
    let firstPlayerTotalInvalidMoves = parseInt(document.getElementById("first-player-invalid-moves").innerText.split(': ')[1]);
    let secondPlayerTotalInvalidMoves = parseInt(document.getElementById("second-player-invalid-moves").innerText.split(': ')[1]);
    let firstPlayerMovesPerWin = parseFloat(document.getElementById("first-player-moves-per-win").innerText.split(': ')[1]);
    let secondPlayerMovesPerWin = parseFloat(document.getElementById("second-player-moves-per-win").innerText.split(': ')[1]);

    if (resetStats) {
        firstPlayerWins = 0;
        secondPlayerWins = 0;
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
    updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin);
    disableInputs(true);

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

            // Get move outcome ('Y' for valid move, or a description of how the move was invalid).
            let move = await processMove(gameType, initialContent, currentPlayer, model, currentMoveCount);
            moves.push(move);

            // If a valid move was made, process it.
            if(move.getOutcome() === "Y") {
                gameLog += updateGameLog(gameType); // Append new move to game log.
                if (checkForWin(gameType)) { // If a player has won the game, write the game log accordingly.
                    let winningSymbol = (currentPlayer === 1) ? "X" : "O";

                    if (currentPlayer === 1) {
                        firstPlayerWins++;
                        firstPlayerMovesPerWin = firstPlayerTotalMoveCount / firstPlayerWins;
                    } else {
                        secondPlayerWins++;
                        secondPlayerMovesPerWin = secondPlayerTotalMoveCount / secondPlayerWins;
                    }

                    writeGameLogToFile(firstPlayer, secondPlayer, model.getID() + " " + winningSymbol + " wins!", gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moves);
                    console.log(model.getID() + " (" + winningSymbol + ") wins!");
                    isGameActive = false;
                }
                else if (isBoardFull(gameType)) { // If a draw has taken place, write the game log accordingly.
                    draws++;
                    writeGameLogToFile(firstPlayer, secondPlayer, "Draw", gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moves);
                    console.log("Draw");
                    isGameActive = false;
                }
                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players if last move was valid.
            }
            else {
                // An invalid move was made. Increment current player's invalid move count for this game.
                if (currentPlayer === 1) {
                    firstPlayerCurrentInvalidMoves++;
                }
                else {
                    secondPlayerCurrentInvalidMoves++;
                }

                // If a player's invalid move count is above the threshold, give the win to the other player.
                if (firstPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    secondPlayerWins++;
                    secondPlayerMovesPerWin = secondPlayerTotalMoveCount / secondPlayerWins;
                    writeGameLogToFile(firstPlayer, secondPlayer, secondPlayer + " (O) wins!", gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moves);
                    console.log(secondPlayer + " (O) wins because " + firstPlayer + " made too many invalid moves!");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    firstPlayerWins++;
                    firstPlayerMovesPerWin = firstPlayerTotalMoveCount / firstPlayerWins;
                    writeGameLogToFile(firstPlayer, secondPlayer, firstPlayer + " (X) wins!", gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moves);
                    console.log(firstPlayer + " (X) wins because " + secondPlayer + " made too many invalid moves!");
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

            updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin);
            currentMoveCount++;

            // If the number of moves has exceeded the maximum allowed, cancel the game.
            if (currentMoveCount >= TIC_TAC_TOE_MAX_ALLOWED_MOVES) {
                writeGameLogToFile(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moveOutcomes);
                console.log("Game Cancelled");
                isGameActive = false;
            }
        }
        firstPlayerTotalInvalidMoves += firstPlayerCurrentInvalidMoves;
        secondPlayerTotalInvalidMoves += secondPlayerCurrentInvalidMoves;
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        resetBoard(gameType);
        currentGameCount++;
        updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount, gameType, promptType, currentGameCount, currentMoveCount, gameLog);
    }
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

// Display game options to the user.
function updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount) {
    let adjustedGameCount = 0;
    // Do not increment game count after last game has finished.
    if (currentGameCount < gameCount) {
        adjustedGameCount = currentGameCount + 1;
    }
    else {
        adjustedGameCount = currentGameCount;
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
function updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin) {
    document.getElementById("first-player-wins").innerHTML = "<div class='info' id='first-player-wins'><strong>1st Player Wins: </strong>" + firstPlayerWins + "</div>";
    document.getElementById("second-player-wins").innerHTML = "<div class='info' id='second-player-wins'><strong>2nd Player Wins: </strong>" + secondPlayerWins + "</div>";
    document.getElementById("draws").innerHTML = "<div class='info' id='draws'><strong>Draws: </strong>" + draws + "</div>";
    document.getElementById("first-player-moves").innerHTML = "<div class='info' id='first-player-moves'><strong>1st Player Moves: </strong>" + firstPlayerTotalMoveCount + "</div>";
    document.getElementById("second-player-moves").innerHTML = "<div class='info' id='second-player-moves'><strong>2nd Player Moves: </strong>" + secondPlayerTotalMoveCount + "</div>";
    document.getElementById("first-player-invalid-moves").innerHTML = "<div class='info' id='first-player-invalid-moves'><strong>1st Player Invalid Moves: </strong>" + firstPlayerTotalInvalidMoves + "</div>";
    document.getElementById("second-player-invalid-moves").innerHTML = "<div class='info' id='second-player-invalid-moves'><strong>2nd Player Invalid Moves: </strong>" + secondPlayerTotalInvalidMoves + "</div>";
    document.getElementById("first-player-moves-per-win").innerHTML = "<div class='info' id='first-player-moves-per-win'><strong>1st Player Moves per Win: </strong>" + firstPlayerMovesPerWin + "</div>";
    document.getElementById("second-player-moves-per-win").innerHTML = "<div class='info' id='second-player-moves-per-win'><strong>2nd Player Moves per Win: </strong>" + secondPlayerMovesPerWin + "</div>";
}

function checkForWin(gameType) {
    if (gameType === "tic-tac-toe") {
        return checkForWinTicTacToe(TIC_TAC_TOE_BOARD_SIZE);
    }
}

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

function escapeStringForJson(input) {
    input = input.replace("\n", "\\n");
    return input.replace("\"", "\\\"");
}

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

function createSystemPrompt(currentModel) {
    let systemPrompt = "";
    return escapeStringForJson(systemPrompt);
}

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

function resetBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        for (let i = 0; i < TIC_TAC_TOE_BOARD_SIZE; i++) {
            for(let j = 0; j < TIC_TAC_TOE_BOARD_SIZE; j++) {
                document.getElementById("tic-tac-toe-" + (i + 1) + "-" + (j + 1)).innerText = "";
            }
        }
    }
}

async function getMove(promptType, gameType, currentPlayer, model) {
    let prompt = createPrompt(promptType, gameType, currentPlayer);
    let systemPrompt = createSystemPrompt();
    return await asynchronousWebServiceCall(prompt, systemPrompt, model);
}

async function processMove(gameType, initialContent, currentPlayer, model, currentMoveCount) {
    if (gameType === "tic-tac-toe") {
        let row;
        let col;
        let jsonResponse = cleanResponse(initialContent);
        let modelID = model.getID();
        let symbol = (currentPlayer === 1) ? "X" : "O";
        try {
            if (modelID === "gemini-pro" || modelID === "gemini-pro-vision") {
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
            else if (modelID === "gpt-3.5-turbo" || modelID === "gpt-4" || modelID === "gpt-4-turbo" || modelID === "gpt-4o") {
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
            console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + modelID + " (" + symbol + ")'s given move had an invalid format.");
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
                console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + modelID + " (" + symbol + ") places at space (" + row + ", " + col + ").");
                return new Move(currentPlayer, "Y");
            }
            else {
                // Return unsuccessful move because AI attempted to play in a space that was already taken.
                console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + modelID + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is already taken.");
                return new Move(currentPlayer, "Already Taken");
            }
        }
        else {
            // Return unsuccessful move because AI attempted to play in a space that was out of bounds.
            console.log("Move " + currentMoveCount + "/" + TIC_TAC_TOE_MAX_ALLOWED_MOVES + ": " + modelID + " (" + symbol + ") tried to place at space (" + row + ", " + col + ") which is out of bounds.");
            return new Move(currentPlayer, "Out of Bounds");
        }
    }
}

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

async function asynchronousWebServiceCall(prompt, systemPrompt, model) {
    let modelID = model.getID();
    let apiKey = model.getApiKey();

    if (modelID === "gemini-pro" || modelID === "gemini-pro-vision") {
        let genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: modelID });
        let result = await model.generateContent(prompt);
        let response = await result.response;
        return JSON.stringify(response);
    }
    return new Promise((resolve, reject) => {
        let url = new URL(model.getUrl());
        let secret = "LLM-GameOn";
        let requestBody;

        if (modelID === "gpt-3.5-turbo" || modelID === "gpt-4" || modelID === "gpt-4-turbo" || modelID === "gpt-4o") {
            requestBody = JSON.stringify({
                "model": modelID,
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

function formatGameDuration(durationInMillis) {
    let seconds = Math.round(durationInMillis / 1000);
    let minutes = Math.round(seconds / 60);
    minutes = String((minutes < 10) ? '0' + minutes : minutes).padStart(2, "0"); // Pad with 0s to at least 2 decimal places.
    seconds = seconds % 60;
    seconds = String((seconds < 10) ? '0' + seconds : seconds).padStart(2, "0");
    return (minutes + ":" + seconds);
}

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

function writeGameLogToFile(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, currentGameCount, currentMoveCount, gameLog, moves) {
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
    let fileName = gameType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + result + "_" + promptType + "_" + timestamp;
    let textFileName = fileName + ".txt";
    let jsonFileName = fileName + ".json";
    let csvFileName = fileName + ".csv";

    // Write the text file content.
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

    let jsonFileContent = "{\"GameType\": \"" + gameType + "\", \"Prompt\": \"" + promptType + "\", \"LLM1stPlayer\": \"" + firstPlayer + "\", \"LLM2ndPlayer\": \"" + secondPlayer + "\"}";

    let csvFileContent = "Timestamp,GameType,PromptType,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds\n" +
        timestamp + "," + gameType + "," + promptType + "," + firstPlayer + "," + secondPlayer + "," + result + "," + gameDuration + "," + currentMoveCount + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds;

    downloadFile(textFileContent, 'txt', textFileName);
    downloadFile(jsonFileContent, 'json', jsonFileName);
    downloadFile(csvFileContent, 'csv', csvFileName);
}

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

function resetVisualStats() {
    resetStats = true;
    // Visually reset game statistics. Actual values will be reset on the next gameplay run.
    document.getElementById("first-player-wins").innerHTML = "<div class='info' id='first-player-wins'><strong>1st Player Wins: </strong>0</div>";
    document.getElementById("second-player-wins").innerHTML = "<div class='info' id='second-player-wins'><strong>2nd Player Wins: </strong>0</div>";
    document.getElementById("draws").innerHTML = "<div class='info' id='draws'><strong>Draws: </strong>0</div>";
    document.getElementById("first-player-moves").innerHTML = "<div class='info' id='first-player-moves'><strong>1st Player Moves: </strong>0</div>";
    document.getElementById("second-player-moves").innerHTML = "<div class='info' id='second-player-moves'><strong>2nd Player Moves: </strong>0</div>";
    document.getElementById("first-player-invalid-moves").innerHTML = "<div class='info' id='first-player-invalid-moves'><strong>1st Player Invalid Moves: </strong>0</div>";
    document.getElementById("second-player-invalid-moves").innerHTML = "<div class='info' id='second-player-invalid-moves'><strong>2nd Player Invalid Moves: </strong>0</div>";
    document.getElementById("first-player-moves-per-win").innerHTML = "<div class='info' id='first-player-moves-per-win'><strong>1st Player Moves per Win: </strong>0</div>";
    document.getElementById("second-player-moves-per-win").innerHTML = "<div class='info' id='second-player-moves-per-win'><strong>2nd Player Moves per Win: </strong>0</div>";
}

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

class Model {
    #name;
    #ID;
    #apiKey;
    #url;
    #supportsImages;

    constructor(name, ID, apiKey, url, supportsImages) {
        this.#name = name;
        this.#ID = ID;
        this.#apiKey = apiKey;
        this.#url = url;
        this.#supportsImages = supportsImages;
    }

    getName() {
        return this.#name;
    }
    getID() {
        return this.#ID;
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

function addModel(model) {
    models.push(model);
    document.getElementById("first-player").innerHTML +=
        "<option value=\"" + model.getID() + "\">" + model.getName() + "</option>";
    document.getElementById("second-player").innerHTML +=
        "<option value=\"" + model.getID() + "\">" + model.getName() + "</option>";
}

function checkImageCompatibility() {
    // If both selected models support images as input, allow it as an option in the "prompt type" field.
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
    addModel(new Model("GPT 3.5 Turbo", "gpt-3.5-turbo", OPENAI_API_KEY, OPENAI_URL, false));
    addModel(new Model("GPT-4", "gpt-4", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("GPT-4 Turbo", "gpt-4-turbo", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("GPT-4o", "gpt-4o", OPENAI_API_KEY, OPENAI_URL, true));
    addModel(new Model("Gemini Pro", "gemini-pro", GOOGLE_API_KEY, null, false));
    addModel(new Model("Gemini Pro Vision", "gemini-pro-vision", GOOGLE_API_KEY, null, true));

    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let currentGameCount = 0;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;
    updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount);
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0);
});
