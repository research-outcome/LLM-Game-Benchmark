import { uuidv7 } from "./uuidv7.js";
import { Model } from "./classes.js";
import { TicTacToe } from "./tic-tac-toe.js";
import { ConnectFour } from "./connect-four.js";
import { Gomoku } from "./gomoku.js";
// Add imports for future game classes here.
import { getMove, processMove } from "./web-service-communication.js";
import { downloadBulkZipFile, downloadZipFile, generateGameLogFiles, generateSubmissionFiles } from "./logging.js";
import {
    addModel,
    checkForEmptyApiKeys,
    getCurrentModel,
    updateAddModelFields,
    updatePlayerDropdowns
} from "./add-edit-llms.js";
import { populateGameDetailsTable, populatePromptTable, populateLLMTable, populateFAQTable, populateUserGuide } from "./info.js";

// Initialize variables
const GAME_RESET_DELAY = 5000; // Time to wait (in milliseconds) before resetting the board after a game ends.
const MAX_GAME_REPEATS = 10; // Max number of times to attempt to repeat a game when network errors occur.

// REMOVE BEFORE RELEASE.
const OPENAI_API_KEY = "PLACE YOUR API KEY HERE";
const GOOGLE_API_KEY = "PLACE YOUR API KEY HERE";
const BEDROCK_SECRET = "PLACE YOUR API KEY HERE";
const BEDROCK_URL = "PLACE YOUR URL HERE";

// OpenAI URL
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Gameplay flags
let bulkEnabled = false; // This flag determines whether the game will generate a "bulk" ZIP file.
let playersCanBeTheSame = document.getElementById("checkbox-bulk-run-same-players").checked; // This flag determines whether LLMs will go against themselves during a bulk run.
let gameStopped = false; // This flag is used to halt gameplay when the user presses the "stop" button.
let useConsoleLogging = true;

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
    // Only set this flag if checkbox is checked and we are NOT using image prompt. Image prompt will automatically save the images.
    let saveProgressImages = (document.getElementById("checkbox-save-progress-images").checked && promptType !== "image");

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
    if (gameType === "tic-tac-toe")
        game = TicTacToe;
    else if (gameType === "connect-four")
        game = ConnectFour;
    else if (gameType === "gomoku")
        game = Gomoku;
    // Add conditions for future games here.

    // Initialize prompt version, provider email(s), UUID, and game log files array for logging purposes.
    let promptVersion = game.promptVersion();
    let providerEmail = document.getElementById("provider-email").value;
    let uuid = uuidv7();
    let gameLogFiles = [];
    let boardScreenshots = []; // 2-D array of board screenshots for each game.

    // Initialize game progress displays.
    document.getElementById("first-player-game-progress").innerHTML = "<strong><u>First Player:</u> " + document.getElementById("first-player").value + "</strong><br>";
    document.getElementById("second-player-game-progress").innerHTML = "<strong><u>Second Player:</u> " + document.getElementById("second-player").value + "</strong><br>";

    // Hide/show appropriate buttons.
    document.getElementById("run-btn").style.display = "none";  // Hide run button
    document.getElementById("bulk-run-btn").style.display = "none"; // Hide bulk run button
    document.getElementById("stop-btn").style.display = "block";  // Show stop button

    disableInputs(true); // Disable input fields.

    // Get existing game count. In the case of batch gameplay, we will add on to this value.
    let existingGameCount = parseInt(document.getElementById("info-current-game-number").innerHTML);

    // Initialize game repeat counter for network errors.
    let gameRepeatCounter = 0;

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
        boardScreenshots[currentGameCount - 1] = [];
        // If the "save progress images" flag is set, take an initial screenshot of the board.
        if (saveProgressImages) {
            let imageData = await game.screenshotBoard();
            boardScreenshots[currentGameCount - 1].push(imageData);
        }
        let firstPlayerCurrentInvalidMoves = 0;
        let secondPlayerCurrentInvalidMoves = 0;
        let gameLog = "";
        let gameStartTime = Date.now();
        let result = "";
        let finalGameState = "";

        // Initialize current game's progress information for each player's progress window.
        document.getElementById("first-player-game-progress").innerHTML += "<strong>Game " + currentGameCount + "</strong><br>" +
            "<strong>Result: </strong><span id=\"game-" + currentGameCount + "-result-first-player-" + gameRepeatCounter + "\"><em>Match in progress...</em></span><br>";
        document.getElementById("second-player-game-progress").innerHTML += "<strong>Game " + currentGameCount + "</strong><br>" +
            "<strong>Result: </strong><span id=\"game-" + currentGameCount + "-result-second-player-" + gameRepeatCounter + "\"><em>Match in progress...</em></span><br>";

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
                game.resetBoard();
                break;
            }

            // Get the current model object from the 'models' list.
            let model = getCurrentModel(currentPlayer);

            // Get initial response from the corresponding API for the model.
            // "moves[moves.length - 1]" gives the latest move. We do this to check if the last move was invalid to explain the LLM's previous mistake.
            let response = await getMove(game, promptType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, moves[moves.length - 1], useConsoleLogging);

            if (useConsoleLogging) console.log("Initial Response: " + response);

            if (response === "Network Error Occurred") {
                if (gameRepeatCounter < MAX_GAME_REPEATS) {
                    result = "networkerror";
                    if (useConsoleLogging) console.log("Network error occurred. Repeating game.");
                    game.resetBoard();
                    break;
                }
                else {
                    if (useConsoleLogging) console.log("Attempted to repeat the game the maximum number of times. Cancelling game.");
                    result = "cancelled-networkerrors";
                    finalGameState = await getFinalGameState(game, promptType);
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                    game.resetBoard();
                    break;
                }
            }

            // If gameplay was stopped, exit before attempting to process move.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                game.resetBoard();
                break;
            }

            // Get move object, which includes LLM and outcome ('Y' for valid move, or a description of how the move was invalid).
            let move = await processMove(game, response, currentPlayer, model, currentMoveCount, useConsoleLogging);
            moves.push(move);

            // If a valid move was made, process it.
            if(move.getOutcome() === "Valid") {
                // Increment move counts, since a move was made.
                if (currentPlayer === 1) {
                    firstPlayerCurrentMoveCount++
                    firstPlayerTotalMoveCount++;
                }
                else {
                    secondPlayerCurrentMoveCount++;
                    secondPlayerTotalMoveCount++;
                }

                let boardState = game.visualizeBoardState();
                gameLog += boardState; // Append new move to visual game log.

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
                    finalGameState = await getFinalGameState(game, promptType);
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                    if (useConsoleLogging) console.log(result);
                    isGameActive = false;
                }
                // If a draw has taken place, process it accordingly.
                else if (game.checkForFullBoard()) {
                    result = "draw";
                    draws++;
                    finalGameState = await getFinalGameState(game, promptType);
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                    if (useConsoleLogging) console.log("Draw");
                    isGameActive = false;
                }

                currentPlayer = (currentPlayer === 1) ? 2 : 1;  // Swap players since the move was valid.
            }
            // An invalid move was made, process it accordingly.
            else {
                gameLog += "Invalid Move (" + move.getOutcome() + ")\n\n"; // Append invalid move explanation to text file's game log.

                // Increment move counts and invalid move counts, since an invalid move was made.
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
                    firstPlayerDisqualifications++;
                    finalGameState = await getFinalGameState(game, promptType);
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                    if (useConsoleLogging) console.log("Player 1 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
                else if (secondPlayerCurrentInvalidMoves > game.getMaxInvalidMoves()) {
                    result = "disqualified2nd";
                    secondPlayerDisqualifications++;
                    finalGameState = await getFinalGameState(game, promptType);
                    gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                    if (useConsoleLogging) console.log("Player 2 was disqualified; they made too many invalid moves.");
                    isGameActive = false;
                }
            }

            // If gameplay was stopped, exit prior to updating game statistics.
            if (gameStopped) {
                currentGameCount = (gameCount + 1);
                game.resetBoard();
                break;
            }

            // Update the progress displays with the current move.
            await updateProgressDisplays(game, move, progressDisplayType);

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

            // If the "save progress images" flag is set, screenshot the board and append it to "board screenshots" list.
            if (saveProgressImages) {
                let imageData = await game.screenshotBoard();
                boardScreenshots[currentGameCount - 1].push(imageData);
            }

            // Increment move count, because a move was just made.
            currentMoveCount++;

            // If the number of moves has met the maximum allowed, cancel the game.
            // Note that we add 1 to the maximum allowed moves during comparison because we initialize currentMoveCount to 1.
            // Essentially, if getMaxMoves() = 20 and there have been 20 total moves made, we will cancel the game here.
            if (currentMoveCount === game.getMaxMoves() + 1) {
                result = "Cancelled"
                finalGameState = await getFinalGameState(game, promptType);
                gameLogFiles.push(generateGameLogFiles(firstPlayer, secondPlayer, "Cancelled", gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount - 1, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid));
                if (useConsoleLogging) console.log("Game Cancelled");
                isGameActive = false;
            }
        }

        // If the "Stop" button was clicked, just reset the board; do not update any fields or perform a post-game pause.
        if (gameStopped) {
            currentGameCount = (gameCount + 1);
            game.resetBoard();
            break;
        }

        // Update game results for progress windows.
        document.getElementById("game-" + currentGameCount + "-result-first-player-" + gameRepeatCounter).textContent = result;
        document.getElementById("game-" + currentGameCount + "-result-second-player-" + gameRepeatCounter).textContent = result;

        gameRepeatCounter++; // Increment game repeat counter.

        // Pause game to allow user to view results. Then, reset the board and update game information.
        await new Promise(resolve => setTimeout(resolve, GAME_RESET_DELAY));
        game.resetBoard();

        // Only increment currentGameCount and reset gameRepeatCounter if a network error didn't occur. Otherwise, repeat the game.
        if (result !== "networkerror") {
            currentGameCount++;
            gameRepeatCounter = 0;
        }

        document.getElementById("info-current-game-number").innerHTML = (bulkEnabled) ? (existingGameCount + currentGameCount - 1).toString() : currentGameCount.toString();
        if (parseInt(document.getElementById("info-current-game-number").innerHTML) > parseInt(document.getElementById("info-total-game-count").innerHTML)) {
            document.getElementById("info-current-game-number").innerHTML = document.getElementById("info-total-game-count").innerHTML; // Game count will internally be totalGameCount + 1 after last game. This prevents displaying that.
        }
    }

    document.getElementById("run-btn").style.display = "inline-block";  // Show run button
    document.getElementById("bulk-run-btn").style.display = "inline-block";  // Show bulk run button
    document.getElementById("stop-btn").style.display = "none";  // Hide stop button

    disableInputs(false); // Re-enable input fields.

    // Once all games have finished, write a submission JSON file, re-enable inputs, and show the start button again.
    // Only generate a ZIP file if gameLogFiles is not empty; in other words, if at least one game has been played.
    if (gameLogFiles.length > 0) {
        let submissionFiles = generateSubmissionFiles(gameType, promptType, promptVersion, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, providerEmail, uuid);
        if (bulkEnabled) {
            return [submissionFiles, gameLogFiles, boardScreenshots];
        }
        else {
            downloadZipFile(submissionFiles, gameLogFiles, boardScreenshots, gameType, promptType, firstPlayer, secondPlayer);
        }
    }
}

// Run games with all combinations of LLMs in the player dropdowns.
async function bulkRun() {
    bulkEnabled = true; // Set bulkEnabled flag to true, since we are performing a bulk run.
    let allLogFiles = [] // Each index here contains [submissionFiles, gameLogFiles, boardScreenshots] for a given set of games.

    // Update game info display's "Total # of Games" value to the total number of bulk games, and reset Current Game # to 1.
    document.getElementById("info-total-game-count").innerHTML = getBulkRunGameCount();
    document.getElementById("info-current-game-number").innerHTML = "1";

    // Iterate through every combination of models in the model list, and play "gameCount" games per combination.
    for(let firstModelIndex = 0; firstModelIndex < document.getElementById("first-player").length; firstModelIndex++) {
        document.getElementById("first-player").selectedIndex = firstModelIndex; // Adjust selected first player model.
        document.getElementById("info-first-player").innerHTML = document.getElementById("first-player").options[firstModelIndex].value; // Update info display, since changing selectedIndex doesn't trigger a change event.
        for(let secondModelIndex = 0; secondModelIndex < document.getElementById("second-player").length; secondModelIndex++) {
            document.getElementById("second-player").selectedIndex = secondModelIndex; // Adjust selected second player model.
            document.getElementById("info-second-player").innerHTML = document.getElementById("second-player").options[secondModelIndex].value; // Update info display, since changing selectedIndex doesn't trigger a change event.

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
                allLogFiles.push(currentGameLogs);
            }
        }
        // If gameplay was stopped, stop the bulk run.
        if (gameStopped) {
            break;
        }
    }

    bulkEnabled = false; // Disable the bulkEnabled flag, since we are now done with the bulk run.

    // If allLogFiles isn't empty (at least one game was played), download a bulk ZIP file.
    if (allLogFiles[0] !== undefined) {
        downloadBulkZipFile(allLogFiles);
    }
}

// Obtain the final game state for logging purposes. This uses the same functionality as prompt generation.
async function getFinalGameState(game, promptType) {
    let finalGameState = "";
    if (promptType === "list") {
        finalGameState = game.listBoard();
        return finalGameState.substring(finalGameState.lastIndexOf("The current state of the game is as follows: \n") + 47);
    }
    else if (promptType === "illustration") {
        finalGameState = game.drawBoard();
        return finalGameState.substring(finalGameState.lastIndexOf("The current state of the game is as follows: \n") + 46);
    }
    else if (promptType === "image") {
        return await game.screenshotBoard();
    }
}

// Calculate the total number of games to be played during a bulk run with the given LLMs, game count, and playersCanBeTheSame flag value.
function getBulkRunGameCount() {
    let firstPlayerModelCount = document.getElementById("first-player").length;
    let secondPlayerModelCount = document.getElementById("second-player").length;
    let gamesPerCombination = document.getElementById("game-count").value;

    // If the "playersCanBeTheSame" flag is set to "false", decrement secondPlayerModelCount by 1.
    // This is because models will not play against themselves with this flag set to false.
    if (!playersCanBeTheSame) {
        secondPlayerModelCount--;
    }

    return (firstPlayerModelCount * secondPlayerModelCount * gamesPerCombination).toString();
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

    document.getElementById("checkbox-bulk-run-same-players").disabled = disableFlag;
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

async function updateProgressDisplays(game, move, progressDisplayType) {
    let newContent = "";
    let moveNumber = move.getNumber();
    let currentPlayer = move.getPlayer();
    let moveOutcome = move.getOutcome();
    let autoScrollDisplays = document.getElementById("checkbox-auto-scroll").checked; // We check this every time because the user may have disabled this option during gameplay.
    let firstPlayerProgressDisplay = document.getElementById("first-player-game-progress");
    let secondPlayerProgressDisplay = document.getElementById("second-player-game-progress");

    // If the move is valid, draw the board using the user's selected progress display type.
    if (moveOutcome === "Valid") {
        if (progressDisplayType === "list") {
            newContent = game.listBoard().replaceAll("\n", "<br>");
            newContent = newContent.substring(newContent.lastIndexOf("The current state of the game is as follows: <br>") + 49) + "<br>";
        }
        else if (progressDisplayType === "illustration") {
            newContent = game.drawBoard().replaceAll("\n", "<br>");
            newContent = newContent.substring(newContent.lastIndexOf("The current state of the game is as follows: <br>") + 49) + "<br>";
        }
        else if (progressDisplayType === "image") {
            let imageData = await game.screenshotBoard();
            newContent = "<img class=\"progress-image\" src=\"" + imageData + "\"><br><br>";
        }
    }
    // If the move was invalid, display the invalid move type.
    else {
        newContent = "Invalid Move (" + moveOutcome + ")<br><br>";
    }

    // Append current move to the current player's progress display.
    if (currentPlayer === 1) {
        document.getElementById("first-player-game-progress").innerHTML += "Move " + moveNumber + ":<br>" +
            newContent;
    }
    else {
        document.getElementById("second-player-game-progress").innerHTML += "Move " + moveNumber + ":<br>" +
            newContent;
    }

    // Scroll the progress displays downward if the "autoScrollDisplays" flag is set to true.
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
        updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        // Show board for selected game type and hide all others.
        showBoardWithId(event.target.value + "-board");

        // Update "info" display with current selections.
        document.getElementById("info-game-type").innerHTML = event.target.value;
        document.getElementById("info-current-game-number").innerHTML = "1";
    });

    // When the prompt type is changed, update the available LLMs in the player dropdowns.
    document.getElementById("prompt-type").addEventListener("change", (event) => {
        updatePlayerDropdowns();

        // Match selected "progress display type" with newly-selected prompt type.
        let radioButtons = document.getElementsByName("progress-display-type");
        for (let i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value === event.target.value) {
                radioButtons[i].checked = true;
                break;
            }
        }

        // Update "info" display with current selections.
        document.getElementById("info-prompt-type").innerHTML = event.target.value;
        document.getElementById("info-first-player").innerHTML = document.getElementById("first-player").value;
        document.getElementById("info-second-player").innerHTML = document.getElementById("second-player").value;
        document.getElementById("info-current-game-number").innerHTML = "1";
    });

    // When the first player LLM is changed, update the progress displays with the new first player.
    document.getElementById("first-player").addEventListener("change", (event) => {
        resetProgressDisplays();

        // Update "info" display with current selections.
        document.getElementById("info-first-player").innerHTML = event.target.value;
        document.getElementById("info-current-game-number").innerHTML = "1";
    });

    // When the second player LLM is changed, update the progress displays with the new second player.
    document.getElementById("second-player").addEventListener("change", (event) => {
        resetProgressDisplays();

        // Update "info" display with current selections.
        document.getElementById("info-second-player").innerHTML = event.target.value;
        document.getElementById("info-current-game-number").innerHTML = "1";
    });

    // When game count is changed, ensure that entered game count is >= 1. If not, alert the user and set game count to 1.
    document.getElementById("game-count").addEventListener("change", (event) => {
        if (event.target.value < 1) {
            alert("Invalid game count.");
            document.getElementById("game-count").value = 1;
        }

        // Update "info" display with current selections.
        document.getElementById("info-total-game-count").innerHTML = event.target.value;
        document.getElementById("info-current-game-number").innerHTML = "1";
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

    // When the "reset stats" button is clicked, reset the stats.
    document.getElementById("reset-btn").addEventListener("click", () => {
        updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    });

    // When the "run" button is clicked, start gameplay.
    document.getElementById("run-btn").addEventListener("click", () => {
        document.getElementById("info-total-game-count").innerHTML = document.getElementById("game-count").value;
        document.getElementById("info-current-game-number").innerHTML = "1";
        playGame();
    });

    // When the "bulk run" button is clicked, if "email" field in "Manage LLMs" popup is empty, display a warning about it.
    // Otherwise, display the total number of games and ask the user if they are sure they want to continue.
    document.getElementById("bulk-run-btn").addEventListener("click", () => {
        if (document.getElementById("provider-email").value === "") {
            document.getElementById("empty-email-warning-popup-container").style.display = "block";
            document.getElementById("empty-email-warning-popup").style.display = "block";
        } else {
            document.getElementById("bulk-run-warning-popup-container").style.display = "block";
            document.getElementById("bulk-run-warning-popup").style.display = "block";

            document.getElementById("bulk-run-game-count").innerHTML = getBulkRunGameCount();
        }
    });

    // When the "yes" button on the bulk run warning popup is clicked, hide the popup and start the bulk run.
    document.getElementById("start-bulk-run-btn").addEventListener("click", () => {
        document.getElementById("bulk-run-warning-popup-container").style.display = "none";
        document.getElementById("bulk-run-warning-popup").style.display = "none";
        bulkRun();
    });

    // When the "no" button on the bulk run warning popup is clicked, hide the popup and do NOT start a bulk run.
    document.getElementById("cancel-bulk-run-btn").addEventListener("click", () => {
        document.getElementById("bulk-run-warning-popup-container").style.display = "none";
        document.getElementById("bulk-run-warning-popup").style.display = "none";
    });

    // When the "yes" button on the empty email warning popup is clicked, hide the popup and show the bulk run game count warning.
    document.getElementById("empty-email-continue-btn").addEventListener("click", () => {
        document.getElementById("empty-email-warning-popup-container").style.display = "none";
        document.getElementById("empty-email-warning-popup").style.display = "none";

        document.getElementById("bulk-run-warning-popup-container").style.display = "block";
        document.getElementById("bulk-run-warning-popup").style.display = "block";

        document.getElementById("bulk-run-game-count").innerHTML = getBulkRunGameCount();
    });

    // When the "no" button on the empty email warning popup is clicked, hide the popup.
    document.getElementById("empty-email-cancel-btn").addEventListener("click", () => {
        document.getElementById("empty-email-warning-popup-container").style.display = "none";
        document.getElementById("empty-email-warning-popup").style.display = "none";
    });

    // Stop gameplay and clear progress displays when the "stop" button is clicked.
    document.getElementById("stop-btn").addEventListener("click", () => {
        if (useConsoleLogging) console.log("Stopping gameplay...");
        gameStopped = true;
    });

    // Enable/disable the "playersCanBeTheSame" flag when the corresponding checkbox is clicked.
    document.getElementById("checkbox-bulk-run-same-players").addEventListener("change", (event) => {
        playersCanBeTheSame = document.getElementById("checkbox-bulk-run-same-players").checked;
    });

    // Add an LLM to the LLM list when the "add" button is clicked.
    document.getElementById("add-llm-btn").addEventListener("click", () => {
        addModel();
    });

    // Populate game details table and show game details popup when game details button is clicked.
    document.getElementById("gameDetailsButton").addEventListener("click", () => {
        populateGameDetailsTable();
    });

    // Populate prompt list table and show prompt list when prompt list button is clicked.
    document.getElementById("promptListButton").addEventListener("click", () => {
        populatePromptTable();
    });

    // Populate LLM list table and show LLM list when LLM list button is clicked.
    document.getElementById("LLMListButton").addEventListener("click", () => {
        populateLLMTable();
    });

    // Populate FAQ table and show FAW popup when FAW button is clicked.
    document.getElementById("FAQsButton").addEventListener("click", () => {
        populateFAQTable();
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
    //addModel(new Model("OpenAI", "gpt-3.5-turbo", OPENAI_URL, OPENAI_API_KEY, true, false));
    //addModel(new Model("OpenAI", "gpt-4", OPENAI_URL, OPENAI_API_KEY, true, false));
    addModel(new Model("OpenAI", "gpt-4o", OPENAI_URL, OPENAI_API_KEY, true, true));
    addModel(new Model("OpenAI", "gpt-4-turbo", OPENAI_URL, OPENAI_API_KEY, true, true));
    //addModel(new Model("Google", "gemini-pro", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, false));
    addModel(new Model("Google", "gemini-1.5-pro", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    addModel(new Model("Google", "gemini-1.5-flash", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, true, true));
    //addModel(new Model("Google", "gemini-pro-vision", "URL is not needed since it is handled by the library.", GOOGLE_API_KEY, false, true));
    addModel(new Model("AWS Bedrock", "meta.llama3-70b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    //addModel(new Model("AWS Bedrock", "meta.llama3-8b-instruct-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-sonnet-20240229-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    addModel(new Model("AWS Bedrock", "anthropic.claude-3-5-sonnet-20240620-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "anthropic.claude-3-haiku-20240307-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, true));
    //addModel(new Model("AWS Bedrock", "mistral.mistral-large-2402-v1:0", BEDROCK_URL, BEDROCK_SECRET, true, false));
    addModel(new Model("Random", "random-play", "Placeholder URL for random play.", "Placeholder API key for random play.", true, true));

    // Initialize the game information, statistics, and progress displays.
    document.getElementById("info-game-type").innerHTML = document.getElementById("game-type").value;
    document.getElementById("info-prompt-type").innerHTML = document.getElementById("prompt-type").value;
    document.getElementById("info-first-player").innerHTML = document.getElementById("first-player").value;
    document.getElementById("info-second-player").innerHTML = document.getElementById("second-player").value;
    document.getElementById("info-total-game-count").innerHTML = document.getElementById("game-count").value;
    document.getElementById("info-current-game-number").innerHTML = "1";
    updateStatistics(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    resetProgressDisplays();

    // Show the game board based on the default gameType selection.
    showBoardWithId(document.getElementById("game-type").value + "-board");
});
