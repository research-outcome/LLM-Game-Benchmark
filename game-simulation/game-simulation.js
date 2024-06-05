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
let bulkEnabled = false;
let playersCanBeTheSame = false;
let gameStopped = false;
let resetStats = true;

// Main gameplay loop
async function playGame() {
    // If either model's API key field is empty, halt gameplay.
    if (checkForEmptyApiKeys()) {
        alert("At least one of your models' API keys are empty. Please click 'Add/Edit LLMs' to correct this before starting gameplay.");
        return;
    }

    // Obtain existing user selections and initialize current game count to 0.
    let gameType = document.getElementById("game-type").value;
    let promptType = document.getElementById("prompt-type").value;
    let gameCount = document.getElementById("game-count").value;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let currentGameCount = 1;
    let uuid = uuidv7();
    let gameLogFiles = [];

    // Obtain existing statistics from the "stats" box.
    let firstPlayerWins = document.getElementById("first-player-wins").innerHTML;
    let secondPlayerWins = document.getElementById("second-player-wins").innerHTML;
    let draws = document.getElementById("draws").innerHTML;
    let firstPlayerTotalMoveCount = document.getElementById("first-player-total-move-count").innerHTML;
    let secondPlayerTotalMoveCount= document.getElementById("second-player-total-move-count").innerHTML;
    let firstPlayerDisqualifications= document.getElementById("first-player-disqualifications").innerHTML;
    let secondPlayerDisqualifications= document.getElementById("second-player-disqualifications").innerHTML;
    let firstPlayerTotalInvalidMoves = document.getElementById("first-player-invalid-moves").innerHTML;
    let secondPlayerTotalInvalidMoves = document.getElementById("second-player-invalid-moves").innerHTML;

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

    // Get prompt version from game object.
    let promptVersion = game.promptVersion();

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
        resetStats = false;
    }

    // Initialize game progress displays.
    document.getElementById("first-player-game-progress").innerHTML = "<strong><u>First Player:</u> " + document.getElementById("first-player").value + "</strong><br>";
    document.getElementById("second-player-game-progress").innerHTML = "<strong><u>Second Player:</u> " + document.getElementById("second-player").value + "</strong><br>";

    document.getElementById("run-btn").style.display = "none";  // Hide run button
    document.getElementById("bulk-run-btn").style.display = "none"; // Hide bulk run button
    document.getElementById("stop-btn").style.display = "block";  // Show stop button
    updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount); // Initialize game information field.
    updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, 0, 0); // Update statistics field.
    disableInputs(true); // Disable selection input fields.

    while(currentGameCount <= gameCount) {
        let isGameActive = true;
        gameStopped = false;
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


        while(isGameActive) {
            // If gameplay was stopped, exit before attempting to fetch move.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Get the current model object from the 'models' list.
            let model = getCurrentModel(currentPlayer);

            // Get initial response from the corresponding API for the model.
            let initialContent = await getMove(promptType, gameType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves);

            if (initialContent === "Network Error Occurred" || initialContent === undefined) {
                alert("A network error occurred when trying to fetch the move. Ending gameplay now.");
                gameStopped = true;
            }

            // If gameplay was stopped, exit before attempting to process move.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Get move object, which includes LLM and outcome ('Y' for valid move, or a description of how the move was invalid).
            let move = await processMove(gameType, initialContent, currentPlayer, model, currentMoveCount);
            moves.push(move);

            // If a valid move was made, process it.
            if(move.getOutcome() === "Y") {
                let boardState = game.visualizeBoardState();
                gameLog += boardState; // Append new move to visual game log.

                // If player 1 is playing, append the board state to the first player's progress log. Otherwise, append it to the second player's log.
                if (currentPlayer === 1) {
                    document.getElementById("first-player-game-progress").innerHTML += boardState.replace(new RegExp("\n", "g"), "<br>");
                }
                else {
                    document.getElementById("second-player-game-progress").innerHTML += boardState.replace(new RegExp("\n", "g"), "<br>");
                }

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

                if (currentPlayer === 1) {
                    firstPlayerCurrentMoveCount++
                    firstPlayerTotalMoveCount++;
                }
                else {
                    secondPlayerCurrentMoveCount++;
                    secondPlayerTotalMoveCount++;
                }

                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players since the move was valid.
            }
            // An invalid move was made, process it accordingly.
            else {
                if (currentPlayer === 1) {
                    firstPlayerCurrentMoveCount++
                    firstPlayerTotalMoveCount++;
                    firstPlayerCurrentInvalidMoves++;
                    firstPlayerTotalInvalidMoves++;
                }
                else {
                    secondPlayerCurrentMoveCount++;
                    secondPlayerTotalMoveCount++;
                    secondPlayerCurrentInvalidMoves++;
                    secondPlayerTotalInvalidMoves++;
                }

                // If a player's invalid move count is above the threshold, disqualify the player.
                if (firstPlayerCurrentInvalidMoves > game.getMaxInvalidMoves()) {
                    result = "disqualified1st";
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Player 1 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves > game.getMaxInvalidMoves()) {
                    result = "disqualified2nd";
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                    console.log("Player 2 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
            }

            // If gameplay was stopped, exit prior to updating game statistics.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                break;
            }

            // Update statistics information and increment move count, because a move has taken place.
            updateStatistics(firstPlayerWins, secondPlayerWins, draws, firstPlayerDisqualifications, secondPlayerDisqualifications, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerMovesPerWin, secondPlayerMovesPerWin);
            currentMoveCount++;

            // If the number of moves has exceeded the maximum allowed, cancel the game.
            if (currentMoveCount >= game.getMaxMoves()) {
                gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid));
                console.log("Game Cancelled");
                isGameActive = false;
            }
        }

        // Update game results for progress windows. Do not update progress if stop button was clicked.
        if (!gameStopped) {
            document.getElementById("game-" + currentGameCount + "-result-first-player").textContent = result;
            document.getElementById("game-" + currentGameCount + "-result-second-player").textContent = result;
        }


        // Pause game to allow user to view results. Then, reset the board and update game information.
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        game.resetBoard();
        currentGameCount++;
        updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount, gameType, promptType, currentGameCount, currentMoveCount, gameLog);
    }

    disableInputs(false);
    document.getElementById("run-btn").style.display = "inline-block";  // Show run button
    document.getElementById("bulk-run-btn").style.display = "inline-block";  // Show bulk run button
    document.getElementById("stop-btn").style.display = "none";  // Hide stop button

    // Once all games have finished, write a submission JSON file, re-enable inputs, and show the start button again.
    // Only generate a ZIP file if gameLogFiles is not empty, or in other words, at least one game has been played.
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
    bulkEnabled = true;
    let allGameLogs = [] // Each index here contains [submissionFiles, gameLogFiles] for a given game.
    for(let firstModelIndex = 0; firstModelIndex < document.getElementById("first-player").length; firstModelIndex++) {
        document.getElementById("first-player").selectedIndex = firstModelIndex;
        for(let secondModelIndex = 0; secondModelIndex < document.getElementById("second-player").length; secondModelIndex++) {
            document.getElementById("second-player").selectedIndex = secondModelIndex;

            // Skip games with the same first/second player LLM if the "playersCanBeTheSame" flag is set to false.
            if (playersCanBeTheSame === false && firstModelIndex === secondModelIndex) {
                continue;
            }
            let currentGameLogs = await playGame();

            resetStats = true; // Reset stats after each set of matches.

            // If gameplay was stopped, stop the bulk run. Otherwise, write the current game logs.
            if (gameStopped) {
                break;
            } else {
                allGameLogs.push(currentGameLogs);
                console.log("Pushed game to allGameLogs: " + currentGameLogs);
            }
        }
        // If gameplay was stopped, stop the bulk run.
        if (gameStopped) {
            break;
        }
    }
    bulkEnabled = false;

    // If allGameLogs isn't empty, download a bulk ZIP file.
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
}

// Display selected gameplay options, as well as current game count, to the user.
function updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount) {
    // If the game was stopped, it internally sets the current game count to be (game count + 1). If we didn't decrement
    // it here, it would show "Number of Games: 3" "Current Game: 4", for example.
    if (gameStopped) {
        currentGameCount = gameCount;
    }

    document.getElementById("game-info").innerHTML =
        "<div><strong><em>Current Selections:</em></strong></div>" +
        "<div class=\"info\"><strong>Game Type: </strong>" + gameType + "</div>" +
        "<div class=\"info\"><strong>Prompt Type: </strong>" + promptType + "</div>" +
        "<div class=\"info\"><strong>1st Player: </strong>" + firstPlayer + "</div>" +
        "<div class=\"info\"><strong>2nd Player: </strong>" + secondPlayer + "</div>" +
        "<div class=\"info\"><strong>Number of Games: </strong>" + gameCount + "</div>" +
        "<div class=\"info\"><strong>Current Game: </strong>" + currentGameCount + "</div>";
}

// Display game statistics to the user.
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
        resetStats = true; // Internal statistics will be reset on next game run.

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
    });

    // When the prompt type is changed, update the available LLMs in the player dropdowns.
    document.getElementById("prompt-type").addEventListener("change", () => {
        updatePlayerDropdowns();
    });

    // When the first player LLM is changed, update the progress displays with the new first player.
    document.getElementById("first-player").addEventListener("change", () => {
        resetProgressDisplays();
    });

    // When the second player LLM is changed, update the progress displays with the new second player.
    document.getElementById("second-player").addEventListener("change", () => {
        resetProgressDisplays();
    });

    // When game count is changed, ensure that entered game count is >= 1. If not, alert the user and set game count to 1.
    document.getElementById("game-count").addEventListener("change", (event) => {
        if (event.target.value < 1) {
            alert("Invalid game count.");
            document.getElementById("game-count").value = 1;
        }
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
        resetStats = true; // Reset stats internally when next game starts.
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

    // Event listener for the FAQs button
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
    //addModel(new Model("Google", "gemini-1.5-pro", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    addModel(new Model("Google", "gemini-1.5-flash", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    //addModel(new Model("Google", "gemini-pro-vision", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, false, true));
    addModel(new Model("AWS Bedrock", "meta.llama3-70b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    //addModel(new Model("AWS Bedrock", "meta.llama3-8b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-sonnet-20240229-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "anthropic.claude-3-haiku-20240307-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "mistral.mistral-large-2402-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));

    // Initialize user selections and game statistics information windows.
    let gameType = document.getElementById("game-type").value;
    let gameCount = document.getElementById("game-count").value;
    let currentGameCount = 1;
    let firstPlayer = document.getElementById("first-player").value;
    let secondPlayer = document.getElementById("second-player").value;
    let promptType = document.getElementById("prompt-type").value;

    // Initialize the game information, statistics, and progress displays.
    updateInfo(gameType, firstPlayer, secondPlayer, promptType, gameCount, currentGameCount);
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    resetProgressDisplays();
});