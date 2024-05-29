import {uuidv7} from "./uuidv7.js";
import {Model} from "./classes.js";
import {TicTacToe} from "./tic-tac-toe.js";
import {getMove, processMove} from "./web-service-communication.js";
import {generateGameLogFiles, generateSubmissionJson, downloadZipFile} from "./logging.js";
import {updateModelLists, checkForDuplicateModel, updatePromptTypeDropdowns, updateAddModelFields, addModel, modelSupportsImages, checkForEmptyApiKeys, getCurrentModel} from "./add-edit-llms.js";

// Initialize variables
let GAME_RESET_DELAY = 5000; // Time to wait (in milliseconds) before resetting the board after a game ends.
let INVALID_MOVE_THRESHOLD = 10; // Number of invalid moves a player can make before the win is given to the other player.

let OPENAI_API_KEY = "sk-proj-AI4ZtKkTSmFvG37WBuevT3BlbkFJnhRKpeh2YyfqTctRQ8il";
let OPENAI_URL = "https://api.openai.com/v1/chat/completions";
let GOOGLE_API_KEY = "AIzaSyC-xij8Mk7bdlh0HDQUbNaSseqkqY4nTBE";
let BEDROCK_SECRET = "LLM-GameOn";
let BEDROCK_URL = "https://v5fb43ch74.execute-api.us-east-1.amazonaws.com/devpost/bedrockllms";

let PROMPT_EXPLAIN_CONNECT_FOUR = "Connect-Four, a classic two-player game, is played on a 7 by 6 grid. The objective is to connect four of your discs in a row, either horizontally, vertically, or diagonally. The first player uses red (R) discs and the second player uses yellow (Y) discs. Strategic placement is crucial; besides aiming for four in a row, players must also block their opponent's potential connections to avoid defeat. Players take turns dropping their discs into an empty column, where the disc occupies the lowest available space. You are a skilled strategic Connect-Four player, currently engaged in a game. ";
let PROMPT_RESPONSE_FORMAT_NEXT_MOVE_CONNECT_FOUR = " Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response. "
let SYSTEM_PROMPT_CONNECT_FOUR = " Suggest your next move in the following JSON format: {'column': ColumnNumber}. Replace ColumnNumber with the appropriate number for your move. ColumnNumber starts at 1 (the leftmost column is {'column': 1}). The maximum value for ColumnNumber is 7, as the grid is 7 columns wide. Do not include any additional commentary in your response. "

let PROMPT_EXPLAIN_GOMOKU = "Gomoku, a classic two-player game, is played on a 15 by 15 grid. The objective is to align five of your stones, black for the first player and white for the second, either horizontally, vertically, or diagonally. Strategic placement is crucial; besides aiming for five in a row, players must also block their opponent's potential alignments to avoid defeat. Players take turns placing their stones on an empty intersection of the grid. You are a skilled strategic Gomoku player, currently engaged in a game. ";
let PROMPT_RESPONSE_FORMAT_NEXT_MOVE_GOMOKU = " Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15. ";
let SYSTEM_PROMPT_GOMOKU = " Suggest your next move in the following JSON format: {'row': RowNumber, 'column': ColumnNumber}. Do not include any additional commentary in your response. Replace RowNumber and ColumnNumber with the appropriate numbers for your move. Both RowNumber and ColumnNumber start at 1 (top left corner is {'row': 1, 'column': 1}). The maximum value for RowNumber and ColumnNumber is 15, as the grid is 15 by 15. ";

let MAX_ALLOWED_MOVES = 20;

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
    document.getElementById("edit-llms-container").style.display = "inline-block";
    document.getElementById("edit-llms").style.display = "inline-block";
});

document.getElementById("edit-llms-close-btn").addEventListener("click", () => {
    document.getElementById("edit-llms-container").style.display = "none";
    document.getElementById("edit-llms").style.display = "none";
})

document.getElementById("llm-type").addEventListener("change", (event) => {
    updateAddModelFields(event);
});

document.getElementById("add-llm-btn").addEventListener("click", () => {
    let modelType = document.getElementById("llm-type").value;
    let modelName = document.getElementById("llm-name").value;
    let modelApiKey = document.getElementById("llm-api-key").value;
    let modelUrl;
    if (modelType === "OpenAI") {
        modelUrl = OPENAI_URL;
    }
    else if (modelType === "Google") {
        modelUrl = "";
    }
    else {
        modelUrl = document.getElementById("llm-url").value
    }
    let supportsImages;

    // If model is a predefined model, check if model supports images. If model is a user-defined model ("Other" type), get the value of the "supports images" input field.
    if (modelType !== "Other") {
        supportsImages = modelSupportsImages(modelName);
    } else {
        supportsImages = document.getElementById("llm-supports-images").value;
    }

    let model = new Model(
        modelType,
        modelName,
        modelUrl,
        modelApiKey,
        supportsImages
    );

    // If this model already exists in the model list, do not add it; alert the user.
    if (checkForDuplicateModel(model)) {
        alert("Model already exists.");
        return;
    }
    // If the model's name was left empty, do not add it; alert the user.
    if (modelName === "") {
        alert("Model name is empty.");
        return;
    }
    // If the model's URL was left empty (and it is not a Google model which does not require a URL) do not add it; alert the user.
    if (modelUrl === "" && modelType !== "Google") {
        alert("Model URL is empty.");
        return;
    }
    // If the model's API key was left empty, do not add it; alert the user.
    if (modelApiKey === "") {
        alert("Model API key is empty.");
        return;
    }

    addModel(model);
});

document.getElementById("cancel-removal-btn").addEventListener("click", (event) => {
    document.getElementById("confirm-removal-popup-container").style.display = "none";
    document.getElementById("confirm-removal-popup").style.display = "none";
});

document.getElementById("first-player").addEventListener("change", () => {
    updatePromptTypeDropdowns();
});

document.getElementById("second-player").addEventListener("change", () => {
    updatePromptTypeDropdowns();
});

document.addEventListener('DOMContentLoaded', () => {
    // URLs for JSON data
    const promptListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/promptList.json';
    const LLMListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/LLMlist.json';
    const gameDetailsURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/gameDetails.json'

    // Function to fetch JSON data
    async function fetchJSON(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }

    // Function to populate the prompt table
    function populatePromptTable(data) {
        const tableBody = document.querySelector("#promptTable tbody");
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(item => {
            const row = document.createElement("tr");

            const gameTypeCell = document.createElement("td");
            gameTypeCell.textContent = item["Game Type"];
            row.appendChild(gameTypeCell);

            const promptTypeCell = document.createElement("td");
            promptTypeCell.textContent = item["Prompt Type"];
            row.appendChild(promptTypeCell);

            const promptExampleCell = document.createElement("td");
            promptExampleCell.textContent = item["Prompt Example"];
            row.appendChild(promptExampleCell);

            tableBody.appendChild(row);
        });
    }

    // Function to populate the LLM table
    function populateLLMTable(data) {
        const tableBody = document.querySelector("#LLMTable tbody");
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(item => {
            const row = document.createElement("tr");

            const companyCell = document.createElement("td");
            companyCell.textContent = item["Company"];
            row.appendChild(companyCell);

            const modelCell = document.createElement("td");
            modelCell.textContent = item["LLM Model"];
            row.appendChild(modelCell);

            const linkCell = document.createElement("td");
            const link = document.createElement("a");
            link.href = item["More Info"].startsWith("http") ? item["More Info"] : "http://" + item["More Info"];
            link.textContent = "More Info";
            link.target = "_blank"; // Open the link for more info in a new tab
            linkCell.appendChild(link);
            row.appendChild(linkCell);

            tableBody.appendChild(row);
        });
    }

    // Function to populate the Game Details table
    function populateGameDetailsTable(data) {
        const tableBody = document.querySelector("#gameDetailsTable tbody");
        tableBody.innerHTML = ''; // Clear existing rows

        data.forEach(item => {
            const row = document.createElement("tr");
    
            const gameTypeCell = document.createElement("td");
            gameTypeCell.textContent = item["Game type"];
            row.appendChild(gameTypeCell);
    
            const detailsCell = document.createElement("td");
            const detailsText = item["Details"];
            const urlRegex = /(https?:\/\/[^\s]+)/g;
    
            // Split the details text to extract URLs and other text parts
            const parts = detailsText.split(urlRegex);
    
            parts.forEach(part => {
                if (urlRegex.test(part)) {
                    // If the part is a URL, create a clickable link
                    const link = document.createElement("a");
                    link.href = part;
                    link.textContent = part;
                    link.target = "_blank"; // Open the link in a new tab
                    detailsCell.appendChild(link);
                } else {
                    // Otherwise, append the text part
                    detailsCell.appendChild(document.createTextNode(part));
                }
            });
    
            row.appendChild(detailsCell);
        tableBody.appendChild(row);
    });
}
    // Event listener for the prompt list button
    document.getElementById("promptListButton").addEventListener("click", () => {
        fetchJSON(promptListURL).then(data => {
            populatePromptTable(data);
            document.getElementById("promptListPopup").style.display = "block";
        });
    });

    // Event listener for the LLM list button
    document.getElementById("LLMListButton").addEventListener("click", () => {
        fetchJSON(LLMListURL).then(data => {
            populateLLMTable(data);
            document.getElementById("LLMListPopup").style.display = "block";
        });
    });

    // Event listener for the Game Details button
    document.getElementById("gameDetailsButton").addEventListener("click", () => {
        fetchJSON(gameDetailsURL).then(data => {
            populateGameDetailsTable(data);
            document.getElementById("gameDetailsPopup").style.display = "block";
        });
    });

    // Event listener for the close buttons in the modals
    document.querySelectorAll(".modal .close").forEach(closeButton => {
        closeButton.addEventListener("click", () => {
            closeButton.closest(".modal").style.display = "none";
        });
    });

    // Event listener to close the modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    });
});

async function playGame() {
    if (checkForEmptyApiKeys()) {
        alert("At least one of your models' API keys are empty. Please click 'Add/Edit LLMs' to correct this before starting gameplay.");
        return;
    }

    // Obtain existing user selections and initialize current game count to 0.
    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;
    let currentGameCount = 0;
    let uuid = uuidv7();
    let gameLogFiles = [];

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
            let model = getCurrentModel(currentPlayer);

            // Get initial response from the corresponding API for the model.
            let initialContent = await getMove(promptType, gameType, currentPlayer, model);

            if (initialContent === "Network Error Occurred") {
                alert("A network error occurred when trying to fetch the move. Ending gameplay now.");
                gameStopped = true;
            }

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
                gameLog += visualizeBoardState(gameType); // Append new move to visual game log.

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
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "winner" + winner, gameStartTime, gameType, promptType, gameCount, currentGameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log(winner + " player wins!");
                    isGameActive = false;
                }
                // If a draw has taken place, process it accordingly.
                else if (checkForFullBoard(gameType)) {
                    draws++;
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "draw", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Draw");
                    isGameActive = false;
                }

                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players since the move was valid.
            }
            // An invalid move was made, process it accordingly.
            else {
                if (currentPlayer === 1) {
                    firstPlayerCurrentInvalidMoves++;
                    firstPlayerTotalInvalidMoves++;
                }
                else {
                    secondPlayerCurrentInvalidMoves++;
                    secondPlayerTotalInvalidMoves++;
                }

                // If a player's invalid move count is above the threshold, disqualify the player.
                if (firstPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "disqualified1st", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Player 1 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves >= INVALID_MOVE_THRESHOLD) {
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "disqualified2nd", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
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
            if (currentMoveCount >= MAX_ALLOWED_MOVES) {
                gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                console.log("Game Cancelled");
                isGameActive = false;
            }
        }

        // Pause game to allow user to view results. Then, reset the board and update game information.
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        resetBoard(gameType);
        currentGameCount++;
        updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount, gameType, promptType, currentGameCount, currentMoveCount, gameLog);
    }

    // Once all games have finished, write a submission JSON file, re-enable inputs, and show the start button again.
    let submissionFile = generateSubmissionJson(gameType, promptType, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, "cedell@floridapoly.edu", uuid);
    downloadZipFile(submissionFile, gameLogFiles, gameType, promptType, firstPlayer, secondPlayer);

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
        return TicTacToe.checkForWin();
    }
    else if (gameType === "connect-four") {

    }
    else if (gameType === "gomoku") {

    }
}

// Check if the board is full for a given game.
function checkForFullBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        return TicTacToe.checkForFullBoard();
    }
    else if (gameType === "connect-four") {

    }
    else if (gameType === "gomoku") {

    }
}

// Reset the board for a given game type.
function resetBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        TicTacToe.resetBoard();
    }
    else if (gameType === "connect-four") {

    }
    else if (gameType === "gomoku") {

    }
}

// Return a visualized board state to be appended to the game log, which is used in .txt log files.
function visualizeBoardState(gameType) {
    if (gameType === "tic-tac-toe") {
        return TicTacToe.visualizeBoardState();
    } else if (gameType === "connect-four") {

    } else if (gameType === "gomoku") {

    }
}

document.addEventListener("DOMContentLoaded", async function() {
    // Add initial models to model list.
    addModel(new Model("OpenAI", "gpt-3.5-turbo", OPENAI_URL, OPENAI_API_KEY, false));
    addModel(new Model("OpenAI", "gpt-4", OPENAI_URL, OPENAI_API_KEY, false));
    addModel(new Model("OpenAI", "gpt-4-turbo", OPENAI_URL, OPENAI_API_KEY, true));
    addModel(new Model("OpenAI", "gpt-4o", OPENAI_URL, OPENAI_API_KEY, true));
    addModel(new Model("Google", "gemini-pro", "", GOOGLE_API_KEY, false));
    addModel(new Model("Google", "gemini-pro-vision", "", GOOGLE_API_KEY, true));
    addModel(new Model("AWS Bedrock", "meta.llama2-13b-chat-v1", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "meta.llama2-70b-chat-v1", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "meta.llama3-70b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "meta.llama3-8b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-v2", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-v2:1", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-sonnet-20240229-v1:0", BEDROCK_URL, BEDROCK_SECRET, true));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-haiku-20240307-v1:0", BEDROCK_URL, BEDROCK_SECRET, true));
    addModel(new Model("AWS Bedrock", "mistral.mistral-large-2402-v1:0", BEDROCK_URL, BEDROCK_SECRET, false));
    addModel(new Model("AWS Bedrock", "ai21.j2-ultra-v1", BEDROCK_URL, BEDROCK_SECRET, false));

    // Use initialized model list to initialize LLM table and player dropdowns.
    updateModelLists();

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