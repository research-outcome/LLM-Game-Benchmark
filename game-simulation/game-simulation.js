import { uuidv7 } from "./uuidv7.js";
import { Model } from "./classes.js";
import { TicTacToe } from "./tic-tac-toe.js";
import { ConnectFour } from "./connect-four.js";
import { Gomoku } from "./gomoku.js";
import { getMove, processMove } from "./web-service-communication.js";
import { generateGameLogFiles, generateSubmissionFiles, downloadZipFile, downloadBulkZipFile } from "./logging.js";
import { updateAddModelFields, updatePlayerDropdowns, addModel, checkForEmptyApiKeys, getCurrentModel } from "./add-edit-llms.js";
import { fetchJSON, populatePromptTable, populateLLMTable, populateGameDetailsTable, populateFAQTable } from "./info.js";

// Initialize variables
const GAME_RESET_DELAY = 5000; // Time to wait (in milliseconds) before resetting the board after a game ends.

// REMOVE BEFORE RELEASE.
const OPENAI_API_KEY = "sk-proj-AI4ZtKkTSmFvG37WBuevT3BlbkFJnhRKpeh2YyfqTctRQ8il";
const GOOGLE_API_KEY = "AIzaSyC-xij8Mk7bdlh0HDQUbNaSseqkqY4nTBE";
const BEDROCK_SECRET = "LLM-GameOn";
const BEDROCK_URL = "https://v5fb43ch74.execute-api.us-east-1.amazonaws.com/devpost/bedrockllms";

// OpenAI URL
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// URLs for JSON data
const promptListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/promptList.json';
const LLMListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/LLMlist.json';
const gameDetailsURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/gameDetails.json';
const faqURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/FAQs.json';

// Gameplay flags
let bulkEnabled = false; // This flag determines whether the game will generate a "bulk" ZIP file.
const playersCanBeTheSame = false; // This flag determines whether LLMs will go against themselves during a bulk run.
let gameStopped = false; // This flag is used to halt gameplay when the user presses the "stop" button.

// Main gameplay loop
async function playGame() {
    // If either model's API key field is empty, halt gameplay.
    if (checkForEmptyApiKeys()) {
        alert("At least one of your models' API keys are empty. Please click 'Add/Edit LLMs' to correct this before starting gameplay.");
        return;
    }

    gameStopped = false;

    // Obtain existing user selections and initialize current game count to 1.
    let gameType = document.getElementById("game-type").value;
    let promptType = document.getElementById("prompt-type").value;
    let gameCount = document.getElementById("game-count").value;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let currentGameCount = 1;
    let progressDisplayType;
    let radioButtons = document.getElementsByName("progress-display-type");
    for (let i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            progressDisplayType = radioButtons[i].value;
        }
    }

    // If bulk play is enabled, reset stats for every session. We should not keep stats from sessions from previous LLM combinations.
    if (bulkEnabled) {
        updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }

    // Obtain existing statistics (from previous sessions) from the "stats" box.
    let previousFirstPlayerWins = document.getElementById("first-player-wins").innerHTML;
    let previousSecondPlayerWins = document.getElementById("second-player-wins").innerHTML;
    let previousDraws = document.getElementById("draws").innerHTML;
    let previousFirstPlayerTotalMoveCount = document.getElementById("first-player-total-move-count").innerHTML;
    let previousSecondPlayerTotalMoveCount= document.getElementById("second-player-total-move-count").innerHTML;
    let previousFirstPlayerDisqualifications= document.getElementById("first-player-disqualifications").innerHTML;
    let previousSecondPlayerDisqualifications= document.getElementById("second-player-disqualifications").innerHTML;
    let previousFirstPlayerTotalInvalidMoves = document.getElementById("first-player-invalid-moves").innerHTML;
    let previousSecondPlayerTotalInvalidMoves = document.getElementById("second-player-invalid-moves").innerHTML;

    // Initialize statistics for this gameplay session to 0.
    let firstPlayerWins = 0;
    let secondPlayerWins = 0;
    let firstPlayerDisqualifications = 0;
    let secondPlayerDisqualifications = 0;
    let draws = 0;
    let firstPlayerTotalMoveCount = 0;
    let secondPlayerTotalMoveCount = 0;
    let firstPlayerTotalInvalidMoves = 0;
    let secondPlayerTotalInvalidMoves = 0;

    // Get game class.
    let game;
    if (gameType === "tic-tac-toe") {
        game = TicTacToe;
    }
    else if (gameType === "connect-four") {
        game = ConnectFour;
    }
    else if (gameType === "gomoku") {
        game = Gomoku;
    }

    // Initialize prompt version, UUID, and game log files array for logging purposes.
    let promptVersion = game.promptVersion();
    let uuid = uuidv7();
    let gameLogFiles = [];

    // Initialize game progress displays.
    document.getElementById("first-player-game-progress").innerHTML = "<strong><u>First Player:</u> " + document.getElementById("first-player").value + "</strong><br>";
    document.getElementById("second-player-game-progress").innerHTML = "<strong><u>Second Player:</u> " + document.getElementById("second-player").value + "</strong><br>";

    // Hide/show appropriate buttons.
    document.getElementById("run-btn").style.display = "none";  // Hide run button
    document.getElementById("bulk-run-btn").style.display = "none"; // Hide bulk run button
    document.getElementById("stop-btn").style.display = "block";  // Show stop button

    disableInputs(true); // Disable input fields.

    // Main gameplay loop
    while(currentGameCount <= gameCount) {
        // Initialize values.
        let isGameActive = true;
        let currentMoveCount = 1;
        let firstPlayerCurrentMoveCount = 0;
        let secondPlayerCurrentMoveCount = 0;
        let firstPlayerMovesPerWin = 0;
        let secondPlayerMovesPerWin = 0;
        let currentPlayer = 1;
        let moves = [];
        let firstPlayerCurrentInvalidMoves = 0;
        let secondPlayerCurrentInvalidMoves = 0;
        let gameLog = "";
        let gameStartTime = Date.now();
        let result = "";

        // Initialize current game's progress information for each player's progress window.
        document.getElementById("first-player-game-progress").innerHTML += "<strong>Game " + currentGameCount + "</strong><br>" +
            "<strong>Result: </strong><span id=\"game-" + currentGameCount + "-result-first-player\"><em>Match in progress...</em></span><br>";
        document.getElementById("second-player-game-progress").innerHTML += "<strong>Game " + currentGameCount + "</strong><br>" +
            "<strong>Result: </strong><span id=\"game-" + currentGameCount + "-result-second-player\"><em>Match in progress...</em></span><br>";

        // Scroll the progress displays if "Auto-Scroll Progress Displays" is enabled.
        let autoScrollDisplays = document.getElementById("checkbox-auto-scroll").checked;
        let firstPlayerProgressDisplay = document.getElementById("first-player-game-progress");
        let secondPlayerProgressDisplay = document.getElementById("second-player-game-progress");
        if (autoScrollDisplays) {
            firstPlayerProgressDisplay.scrollTop = firstPlayerProgressDisplay.scrollHeight;
            secondPlayerProgressDisplay.scrollTop = secondPlayerProgressDisplay.scrollHeight;
        }

        while(isGameActive) {
            // If gameplay was stopped, exit before attempting to fetch move.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Get the current model object from the 'models' list.
            let model = getCurrentModel(currentPlayer);

            // Get initial response from the corresponding API for the model.
            let initialContent = await getMove(game, promptType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves);

            if (initialContent === "Network Error Occurred") {
                result = "networkerror";
                gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                console.log("Game was canceled because a network error occurred.");
                isGameActive = false;
                continue;
            }

            // If gameplay was stopped, exit before attempting to process move.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Get move object, which includes LLM and outcome ('Y' for valid move, or a description of how the move was invalid).
            let move = await processMove(game, initialContent, currentPlayer, model, currentMoveCount);
            moves.push(move);

            // If a valid move was made, process it.
            if(move.getOutcome() === "Y") {
                let boardState = game.visualizeBoardState();
                gameLog += boardState; // Append new move to visual game log.

                // Update the progress displays with the new board state.
                await updateProgressDisplays(game, currentPlayer, progressDisplayType);

                // If a player has won the game, process it accordingly.
                if (game.checkForWin()) {
                    if (currentPlayer === 1) {
                        result = "winner1st";
                        firstPlayerWins++;
                        firstPlayerMovesPerWin = firstPlayerCurrentMoveCount;
                    } else {
                        result = "winner2nd";
                        secondPlayerWins++;
                        secondPlayerMovesPerWin = secondPlayerCurrentMoveCount;
                    }

                    // Log the current game to output files and set gameplay as inactive because game has concluded.
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, gameCount, currentGameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log(result);
                    isGameActive = false;
                }
                // If a draw has taken place, process it accordingly.
                else if (game.checkForFullBoard()) {
                    result = "draw";
                    draws++;
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Draw");
                    isGameActive = false;
                }

                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players since the move was valid.
            }
            // An invalid move was made, process it accordingly.
            else {
                // Increment invalid move counts, since an invalid move was made.
                if (currentPlayer === 1) {
                    firstPlayerCurrentInvalidMoves++;
                    firstPlayerTotalInvalidMoves++;
                }
                else {
                    secondPlayerCurrentInvalidMoves++;
                    secondPlayerTotalInvalidMoves++;
                }

                // If a player's invalid move count is above the threshold, disqualify the player.
                if (firstPlayerCurrentInvalidMoves > game.getMaxInvalidMoves()) {
                    result = "disqualified1st";
                    firstPlayerDisqualifications++;
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Player 1 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves > game.getMaxInvalidMoves()) {
                    result = "disqualified2nd";
                    secondPlayerDisqualifications++;
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Player 2 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
            }

            // Increment move counts, since a move was made.
            if (currentPlayer === 1) {
                firstPlayerCurrentMoveCount++
                firstPlayerTotalMoveCount++;
            }
            else {
                secondPlayerCurrentMoveCount++;
                secondPlayerTotalMoveCount++;
            }

            // If gameplay was stopped, exit prior to updating game statistics.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Calculate new statistics information by adding current session's stats to previous stats from before this session started.
            let newFirstPlayerWins = (parseInt(previousFirstPlayerWins) + firstPlayerWins).toString();
            let newSecondPlayerWins = (parseInt(previousSecondPlayerWins) + secondPlayerWins).toString();
            let newDraws = (parseInt(previousDraws) + draws).toString();
            let newFirstPlayerDisqualifications = (parseInt(previousFirstPlayerDisqualifications) + firstPlayerDisqualifications).toString();
            let newSecondPlayerDisqualifications = (parseInt(previousSecondPlayerDisqualifications) + secondPlayerDisqualifications).toString();
            let newFirstPlayerTotalMoveCount = (parseInt(previousFirstPlayerTotalMoveCount) + firstPlayerTotalMoveCount).toString();
            let newSecondPlayerTotalMoveCount = (parseInt(previousSecondPlayerTotalMoveCount) + secondPlayerTotalMoveCount).toString();
            let newFirstPlayerTotalInvalidMoves = (parseInt(previousFirstPlayerTotalInvalidMoves) + firstPlayerTotalInvalidMoves).toString();
            let newSecondPlayerTotalInvalidMoves = (parseInt(previousSecondPlayerTotalInvalidMoves) + secondPlayerTotalInvalidMoves).toString();
            updateStatistics(newFirstPlayerWins, newSecondPlayerWins, newDraws, newFirstPlayerDisqualifications, newSecondPlayerDisqualifications, newFirstPlayerTotalMoveCount, newSecondPlayerTotalMoveCount, newFirstPlayerTotalInvalidMoves, newSecondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin);

            // Increment move count, because a move was just made.
            currentMoveCount++;

            // If the number of moves has exceeded the maximum allowed, cancel the game.
            if (currentMoveCount >= game.getMaxMoves()) {
                gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                console.log("Game Cancelled");
                isGameActive = false;
            }
        }

        // If the "Stop" button was clicked, just reset the board; do not update any fields or perform a post-game pause.
        if (gameStopped) {
            game.resetBoard();
            break;
        }

        // Update game results for progress windows.
        document.getElementById("game-" + currentGameCount + "-result-first-player").textContent = result;
        document.getElementById("game-" + currentGameCount + "-result-second-player").textContent = result;

        // Pause game to allow user to view results. Then, reset the board and update game information.
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        game.resetBoard();
        currentGameCount++;
        updateInfo(gameType, promptType, firstPlayer, secondPlayer, gameCount, currentGameCount);
    }

    document.getElementById("run-btn").style.display = "inline-block";  // Show run button
    document.getElementById("bulk-run-btn").style.display = "inline-block";  // Show bulk run button
    document.getElementById("stop-btn").style.display = "none";  // Hide stop button

    disableInputs(false); // Re-enable input fields.

    // Once all games have finished, write a submission JSON file, re-enable inputs, and show the start button again.
    // Only generate a ZIP file if gameLogFiles is not empty; in other words, if at least one game has been played.
    if (gameLogFiles.length > 0) {
        let submissionFiles = generateSubmissionFiles(gameType, promptType, promptVersion, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, "cedell@floridapoly.edu", uuid);
        if (bulkEnabled) {
            return [submissionFiles, gameLogFiles];
        }
        else {
            downloadZipFile(submissionFiles, gameLogFiles, gameType, promptType, firstPlayer, secondPlayer);
        }
    }
}

// Run games with all combinations of LLMs in the player dropdowns.
async function bulkRun() {
    bulkEnabled = true; // Set bulkEnabled flag to true, since we are performing a bulk run.
    let allGameLogs = [] // Each index here contains [submissionFiles, gameLogFiles] for a given set of games.

    // Iterate through every combination of models in the model list, and play "gameCount" games per combination.
    for(let firstModelIndex = 0; firstModelIndex < document.getElementById("first-player").length; firstModelIndex++) {
        document.getElementById("first-player").selectedIndex = firstModelIndex; // Adjust selected first player model.
        for(let secondModelIndex = 0; secondModelIndex < document.getElementById("second-player").length; secondModelIndex++) {
            document.getElementById("second-player").selectedIndex = secondModelIndex; // Adjust selected second player model.

            // Skip games with the same first/second player LLM if the "playersCanBeTheSame" flag is set to false.
            if (playersCanBeTheSame === false && firstModelIndex === secondModelIndex) {
                continue;
            }

            // Get game logs in the form [submissionFiles, gameLogFiles] for this set of games.
            let currentGameLogs = await playGame();

            // If gameplay was stopped, stop the bulk run. Otherwise, write the current game logs.
            if (gameStopped) {
                break;
            } else {
                allGameLogs.push(currentGameLogs);
            }
        }
        // If gameplay was stopped, stop the bulk run.
        if (gameStopped) {
            break;
        }
    }

    bulkEnabled = false; // Disable the bulkEnabled flag, since we are now done with the bulk run.

    // If allGameLogs isn't empty (at least one game was played), download a bulk ZIP file.
    if (allGameLogs[0] !== undefined) {
        let gameType = document.getElementById("game-type").value;
        let promptType = document.getElementById("prompt-type").value;
        downloadBulkZipFile(allGameLogs, gameType, promptType);
    }
}

// Enable or disable option input fields.
function disableInputs(disableFlag) {
    document.getElementById("game-type").disabled = disableFlag;
    document.getElementById("game-count").disabled = disableFlag;
    document.getElementById("first-player").disabled = disableFlag;
    document.getElementById("second-player").disabled = disableFlag;
    document.getElementById("prompt-type").disabled = disableFlag;
    document.getElementById("manage-llms-btn").disabled = disableFlag;
    document.getElementById("reset-btn").disabled = disableFlag;

    let radioButtons = document.getElementsByName("progress-display-type");
    for (let i = 0; i < radioButtons.length; i++) {
        radioButtons[i].disabled = disableFlag;
    }
}

// Display selected gameplay options, as well as current game count, to the user.
function updateInfo(gameType, promptType, firstPlayer, secondPlayer, gameCount, currentGameCount) {
    // If all games have concluded, gameCount will internally be gameCount + 1, but we don't want to display that.
    if (currentGameCount > gameCount) {
        currentGameCount = gameCount
    }

    // Update the Game Info display with the current values.
    document.getElementById("game-info").innerHTML =
        "<div><strong><em>Current Selections:</em></strong></div>" +
        "<div class=\"info\"><strong>Game Type: </strong>" + gameType + "</div>" +
        "<div class=\"info\"><strong>Prompt Type: </strong>" + promptType + "</div>" +
        "<div class=\"info\"><strong>1st Player: </strong>" + firstPlayer + "</div>" +
        "<div class=\"info\"><strong>2nd Player: </strong>" + secondPlayer + "</div>" +
        "<div class=\"info\"><strong>Number of Games: </strong>" + gameCount + "</div>" +
        "<div class=\"info\"><strong>Current Game: </strong>" + currentGameCount + "</div>";
}

// Update the Statistics display with the current game statistics.
function updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin) {
    document.getElementById("first-player-wins").innerHTML = firstPlayerWins;
    document.getElementById("second-player-wins").innerHTML = secondPlayerWins;
    document.getElementById("draws").innerHTML = draws;
    document.getElementById("first-player-total-move-count").innerHTML = firstPlayerTotalMoveCount;
    document.getElementById("second-player-total-move-count").innerHTML = secondPlayerTotalMoveCount;
    document.getElementById("first-player-disqualifications").innerHTML = firstPlayerDisqualifications;
    document.getElementById("second-player-disqualifications").innerHTML = secondPlayerDisqualifications;
    document.getElementById("first-player-invalid-moves").innerHTML = firstPlayerTotalInvalidMoves;
    document.getElementById("second-player-invalid-moves").innerHTML = secondPlayerTotalInvalidMoves;
    document.getElementById("first-player-moves-per-win").innerHTML = firstPlayerMovesPerWin;
    document.getElementById("second-player-moves-per-win").innerHTML = secondPlayerMovesPerWin;
}

// Show a game board with a specific HTML ID, hiding all other boards.
function showBoardWithId(boardId) {
    // Hide all boards.
    for (let boardDiv of document.getElementById("board-container").children) {
        document.getElementById(boardDiv.id).style.display = "none";
    }

    // Show board with desired board ID.
    document.getElementById(boardId).style.display = "table";
}

async function updateProgressDisplays(game, currentPlayer, progressDisplayType) {
    let newContent = "";
    let autoScrollDisplays = document.getElementById("checkbox-auto-scroll").checked; // We check this every time because the user may have disabled this option during gameplay.
    let firstPlayerProgressDisplay = document.getElementById("first-player-game-progress");
    let secondPlayerProgressDisplay = document.getElementById("second-player-game-progress");

    if (progressDisplayType === "list") {
        newContent = game.listBoard().replaceAll("\n", "<br>");
        newContent = newContent.substring(newContent.lastIndexOf("The current state of the game is as follows: <br>") + 49) + "<br>";
    }
    if (progressDisplayType === "illustration") {
        newContent = game.drawBoard().replaceAll("\n", "<br>");
        newContent = newContent.substring(newContent.lastIndexOf("The current state of the game is as follows: <br>") + 49) + "<br>";
    }
    if (progressDisplayType === "image") {
        let imageData = await game.screenshotBoard();
        newContent = "<img class=\"progress-image\" src=\"" + imageData + "\"><br><br>";
    }

    if (currentPlayer === 1) {
        document.getElementById("first-player-game-progress").innerHTML += newContent;
    }
    else {
        document.getElementById("second-player-game-progress").innerHTML += newContent;
    }

    if (autoScrollDisplays) {
        firstPlayerProgressDisplay.scrollTop = firstPlayerProgressDisplay.scrollHeight;
        secondPlayerProgressDisplay.scrollTop = secondPlayerProgressDisplay.scrollHeight;
    }
}

// Clear the progress displays on either side of the game board.
function resetProgressDisplays() {
    document.getElementById("first-player-game-progress").innerHTML = "<strong><u>First Player:</u> " + document.getElementById("first-player").value + "</strong><br>";
    document.getElementById("second-player-game-progress").innerHTML = "<strong><u>Second Player:</u> " + document.getElementById("second-player").value + "</strong><br>";
}

// Once the webpage has been fully loaded, initialize values and event listeners.
document.addEventListener("DOMContentLoaded", async function() {
    // Reset stats and show board for selected game when the game type is changed.
    document.getElementById("game-type").addEventListener("change", (event) => {
        updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); // Update visual statistics immediately.

        // Show board for selected game type and hide all others.
        if (event.target.value === "tic-tac-toe") {
            showBoardWithId("tic-tac-toe-board");
        }
        else if (event.target.value === "connect-four") {
            showBoardWithId("connect-four-board");
        }
        else if (event.target.value === "gomoku") {
            showBoardWithId("gomoku-board");
        }
        else if (event.target.value === "") {
            // Additional game types here.
        }

        // Update "info" display with current selections.
        let firstPlayer = document.getElementById("first-player").value;
        let secondPlayer = document.getElementById("second-player").value;
        let promptType = document.getElementById("prompt-type").value;
        let gameCount = document.getElementById("game-count").value;
        let currentGameCount = 1;
        updateInfo(event.target.value, promptType, firstPlayer, secondPlayer, gameCount, currentGameCount);
    });

    // When the prompt type is changed, update the available LLMs in the player dropdowns.
    document.getElementById("prompt-type").addEventListener("change", (event) => {
        updatePlayerDropdowns();

        // Update "info" display with current selections.
        let gameType = document.getElementById("game-type").value;
        let firstPlayer = document.getElementById("first-player").value;
        let secondPlayer = document.getElementById("second-player").value;
        let gameCount = document.getElementById("game-count").value;
        let currentGameCount = 1;
        updateInfo(gameType, event.target.value, firstPlayer, secondPlayer, gameCount, currentGameCount);
    });

    // When the first player LLM is changed, update the progress displays with the new first player.
    document.getElementById("first-player").addEventListener("change", (event) => {
        resetProgressDisplays();

        // Update "info" display with current selections.
        let gameType = document.getElementById("game-type").value;
        let secondPlayer = document.getElementById("second-player").value;
        let promptType = document.getElementById("prompt-type").value;
        let gameCount = document.getElementById("game-count").value;
        let currentGameCount = 1;
        updateInfo(gameType, promptType, event.target.value, secondPlayer, gameCount, currentGameCount);
    });

    // When the second player LLM is changed, update the progress displays with the new second player.
    document.getElementById("second-player").addEventListener("change", (event) => {
        resetProgressDisplays();

        // Update "info" display with current selections.
        let gameType = document.getElementById("game-type").value;
        let firstPlayer = document.getElementById("first-player").value;
        let promptType = document.getElementById("prompt-type").value;
        let gameCount = document.getElementById("game-count").value;
        let currentGameCount = 1;
        updateInfo(gameType, promptType, firstPlayer, event.target.value, gameCount, currentGameCount);
    });

    // When game count is changed, ensure that entered game count is >= 1. If not, alert the user and set game count to 1.
    document.getElementById("game-count").addEventListener("change", (event) => {
        if (event.target.value < 1) {
            alert("Invalid game count.");
            document.getElementById("game-count").value = 1;
        }

        // Update "info" display with current selections.
        let gameType = document.getElementById("game-type").value;
        let firstPlayer = document.getElementById("first-player").value;
        let secondPlayer = document.getElementById("second-player").value;
        let promptType = document.getElementById("prompt-type").value;
        let currentGameCount = 1;
        updateInfo(gameType, promptType, firstPlayer, secondPlayer, event.target.value, currentGameCount);
    });

    // Show "manage LLMs" window when the "Manage LLMs" button is clicked.
    document.getElementById("manage-llms-btn").addEventListener("click", () => {
        document.getElementById("manage-llms-container").style.display = "inline-block";
        document.getElementById("manage-llms").style.display = "inline-block";
    });

    // When the LLM type is changed in the "manage LLMs" window, update the available options accordingly.
    document.getElementById("llm-type").addEventListener("change", (event) => {
        updateAddModelFields(event);
    });

    // When the "manage LLMs" window's close button is clicked, close the window.
    document.getElementById("manage-llms-close-btn").addEventListener("click", () => {
        document.getElementById("manage-llms-container").style.display = "none";
        document.getElementById("manage-llms").style.display = "none";
    });

    // When the "reset stats" button is clicked, reset the stats both visually and internally.
    document.getElementById("reset-btn").addEventListener("click", () => {
        updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); // Reset visual stats immediately.
    });

    // When the "run" button is clicked, start gameplay.
    document.getElementById("run-btn").addEventListener("click", () => {
        playGame();
    });

    // When the "bulk run" button is clicked, run games for all combinations of LLMs in the player dropdowns.
    document.getElementById("bulk-run-btn").addEventListener("click", () => {
        bulkRun();
    });

    // Stop gameplay when the "stop" button is clicked.
    document.getElementById("stop-btn").addEventListener("click", () => {
        console.log("Stopping gameplay...");
        gameStopped = true;
    });

    // Add an LLM to the LLM list when the "add" button is clicked.
    document.getElementById("add-llm-btn").addEventListener("click", () => {
        addModel();
    });

    // Hide the "confirm model removal" popup when the "cancel model removal" button is clicked.
    document.getElementById("cancel-removal-btn").addEventListener("click", () => {
        document.getElementById("confirm-removal-button-container").innerHTML = "<button id=\"confirm-removal-btn\">Yes</button>" +
            "<button id=\"cancel-removal-btn\">Cancel</button>";
        document.getElementById("confirm-removal-popup-container").style.display = "none";
        document.getElementById("confirm-removal-popup").style.display = "none";
    });

    // Populate prompt list table and show prompt list when prompt list button is clicked.
    document.getElementById("promptListButton").addEventListener("click", () => {
        fetchJSON(promptListURL).then(data => {
            populatePromptTable(data);
            document.getElementById("promptListPopup").style.display = "block";
        });
    });

    // Populate LLM list table and show LLM list when LLM list button is clicked.
    document.getElementById("LLMListButton").addEventListener("click", () => {
        fetchJSON(LLMListURL).then(data => {
            populateLLMTable(data);
            document.getElementById("LLMListPopup").style.display = "block";
        });
    });

    // Populate game details table and show game details popup when game details button is clicked.
    document.getElementById("gameDetailsButton").addEventListener("click", () => {
        fetchJSON(gameDetailsURL).then(data => {
            populateGameDetailsTable(data);
            document.getElementById("gameDetailsPopup").style.display = "block";
        });
    });

    // Populate FAQ table and show FAW popup when FAW button is clicked.
    document.getElementById("FAQsButton").addEventListener("click", () => {
        fetchJSON(faqURL).then(data => {
            populateFAQTable(data);
            document.getElementById("faqPopup").style.display = "block";
        });
    });

    // Hide popups when a popup's close button has been clicked.
    document.querySelectorAll(".popup-container .close").forEach(closeButton => {
        closeButton.addEventListener("click", () => {
            closeButton.closest(".popup-container").style.display = "none";
        });
    });

    // Close popups when clicking outside of them.
    window.addEventListener("click", (event) => {
        if (event.target.classList.contains('popup-container')) {
            event.target.style.display = "none";
        }
    });

    // Predefined models to add to LLM model list. This prevents you from having to manually add them every time.
    // gpt-3.5-turbo, gemini-pro, and gemini-pro-vision for TESTING ONLY, remove later.
    //addModel(new Model("OpenAI", "gpt-3.5-turbo", OPENAI_URL, OPENAI_API_KEY, true, false));
    //addModel(new Model("OpenAI", "gpt-4", OPENAI_URL, OPENAI_API_KEY, true, false));
    addModel(new Model("OpenAI", "gpt-4-turbo", OPENAI_URL, OPENAI_API_KEY, true, true));
    addModel(new Model("OpenAI", "gpt-4o", OPENAI_URL, OPENAI_API_KEY, true, true));
    //addModel(new Model("Google", "gemini-pro", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, false));
    addModel(new Model("Google", "gemini-1.5-pro", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    addModel(new Model("Google", "gemini-1.5-flash", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    //addModel(new Model("Google", "gemini-pro-vision", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, false, true));
    addModel(new Model("AWS Bedrock", "meta.llama3-70b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    //addModel(new Model("AWS Bedrock", "meta.llama3-8b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-sonnet-20240229-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "anthropic.claude-3-haiku-20240307-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "mistral.mistral-large-2402-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));

    // Initialize user selections and game statistics information windows.
    let gameType = document.getElementById("game-type").value;
    let promptType = document.getElementById("prompt-type").value;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let gameCount = document.getElementById("game-count").value;
    let currentGameCount = 1;

    // Initialize the game information, statistics, and progress displays.
    updateInfo(gameType, promptType, firstPlayer, secondPlayer, gameCount, currentGameCount);
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    resetProgressDisplays();

    // Show the game board based on the default gameType selection.
    showBoardWithId(gameType + "-board");
});