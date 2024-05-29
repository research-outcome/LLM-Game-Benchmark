import {GameLogFiles} from './classes.js';

// Format a timestamp in yyMMdd-HHmmss format.
function formatTimestamp(timestamp) {
    let year = String(timestamp.getFullYear()).slice(-2); // Get last 2 digits of year.
    let month = String(timestamp.getMonth() + 1).padStart(2, "0"); // Get month and pad to 2 digits.
    let day = String(timestamp.getDate()).padStart(2, "0"); // Get day and pad to 2 digits.
    let hours = String(timestamp.getHours()).padStart(2, "0"); // Get hour and pad to 2 digits.
    let minutes = String(timestamp.getMinutes()).padStart(2, "0"); // Get minute and pad to 2 digits.
    let seconds = String(timestamp.getSeconds()).padStart(2, "0"); // Get seconds and pad to 2 digits.

    // Return timestamp in yyMMdd-HHmmss format.
    return year + month + day + "-" + hours + minutes + seconds;
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

// Write information about the current game to .txt, .json, and .csv formats.
export function generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid) {
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

    // Convert the moves to a JSON format and count the number of invalid moves of each type.
    let jsonMoves = "["
    for (let move of moves) {
        jsonMoves += "{\"MoveNumber\": " + move.getNumber() +
            ", \"Player\": " + move.getPlayer() +
            ", \"Row\": " + move.getRow() +
            ", \"Col\": " + move.getCol() +
            ", \"Outcome\": \"" + move.getOutcome() +
            "\", \"PromptType\": \"" + promptType +
            "\", \"CurrentStatus\": \"" + move.getCurrentStatus() +
            "\", \"Response\": \"" + move.getResponse().replace(new RegExp("\n", "g"), "\\n").replace(new RegExp("\"", "g"), "'") +
            "\"},";

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
    jsonMoves = jsonMoves.replace(new RegExp("\n", "g"), "\\n");
    jsonMoves = jsonMoves.replace(new RegExp("\"row\"", "g"), "'row'");
    jsonMoves = jsonMoves.replace(new RegExp("\"column\"", "g"), "'column'");
    jsonMoves = jsonMoves.substring(0, jsonMoves.length - 1); // Remove last ',' from string.
    jsonMoves += "]";

    // Name the output files.
    let timestamp = formatTimestamp(new Date());
    let fileName = gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + result + "_" + timestamp;
    let textFileName = fileName + ".txt";
    let jsonFileName = fileName + ".json";
    let csvFileName = fileName + ".csv";

    // Generate the text file content.
    let textFileContent = "UUID: " + uuid + "\n" +
        "Game Type: " + gameType + "\n" +
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
    let jsonFileContent = "{\"UUID\": \"" + uuid +
        "\", \"Timestamp\": \"" + timestamp +
        "\", \"GameType\": \"" + gameType +
        "\", \"PromptType\": \"" + promptType +
        "\", \"Player1\": \"" + firstPlayer +
        "\", \"Player2\": \"" + secondPlayer +
        "\", \"Result\": \"" + result +
        "\", \"TotalTime\": \"" + gameDuration +
        "\", \"TotalMoves\": " + currentMoveCount +
        ", \"Player1InvalidAlreadyTaken\": " + invalidMovesFirstPlayerAlreadyTaken +
        ", \"Player2InvalidAlreadyTaken\": " + invalidMovesSecondPlayerAlreadyTaken +
        ", \"Player1InvalidFormat\": " + invalidMovesFirstPlayerInvalidFormat +
        ", \"Player2InvalidFormat\": " + invalidMovesSecondPlayerInvalidFormat +
        ", \"Player1OutOfBounds\": " + invalidMovesFirstPlayerOutOfBounds +
        ", \"Player2OutOfBounds\": " + invalidMovesSecondPlayerOutOfBounds +
        ", \"Moves\": " + jsonMoves +
        "}";

    // Generate the CSV file content.
    let csvFileContent = "UUID,Timestamp,GameType,PromptType,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds\n" +
        uuid + "," + timestamp + "," + gameType + "," + promptType + "," + firstPlayer + "," + secondPlayer + "," + result + "," + gameDuration + "," + currentMoveCount + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds;

    // Add each of the generated files to the log ZIP file, which will be downloaded after gameplay concludes.
    return new GameLogFiles(textFileName, textFileContent, jsonFileName, jsonFileContent, csvFileName, csvFileContent);
}

// Generate a JSON file containing aggregated information about a number of games to be submitted to the leaderboard.
export function generateSubmissionJson(gameType, promptType, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, providerEmail, uuid) {
    let sanitizedFirstPlayer = firstPlayer.replace("/", "_");
    let sanitizedSecondPlayer = secondPlayer.replace("/", "_");

    // Name the submission file.
    let timestamp = formatTimestamp(new Date());
    let submissionFileName = "submission_" + gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + timestamp + ".json";

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
        "\", \"UUID\": \"" + uuid +
        "\"}";

    // Download the generated submission file.
    return [submissionFileName, submissionFileContent];
}

// Download a file given its content, file extension, and filename.
export function downloadZipFile(submissionFile, gameLogFiles, gameType, promptType, firstPlayer, secondPlayer) {
    let logZipFile = new JSZip();
    let timestamp = formatTimestamp(new Date());

    // Generate ZIP file name.
    let zipFileName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + timestamp + ".zip";

    // Add each game's text, JSON, and CSV files to ZIP file.
    for (let gameLogs of gameLogFiles) {
        logZipFile.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
        logZipFile.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
        logZipFile.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
    }

    // Add final submission JSON to Zip file. submissionFile[0] = file name, submissionFile[1] = file content.
    logZipFile.file(submissionFile[0], submissionFile[1]);

    logZipFile.generateAsync({type:"blob"}).then(function (blob) {
        saveAs(blob, zipFileName);
    });
}