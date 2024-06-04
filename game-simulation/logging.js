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
export function generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, gameLog, moves, uuid) {
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
    let csvMoves = [];
    for (let move of moves) {
        let moveNumber = move.getNumber();
        let movePlayer = move.getPlayer();
        let moveRow = move.getRow();
        let moveCol = move.getCol();
        let moveOutcome = move.getOutcome();
        let currentStatus = move.getCurrentStatus();
        let response = move.getResponse().replace(new RegExp("\n", "g"), "\\n").replace(new RegExp("\"", "g"), "'")

        jsonMoves += "{\"MoveNumber\": " + moveNumber +
            ", \"Player\": " + movePlayer +
            ", \"Row\": " + moveRow +
            ", \"Col\": " + moveCol +
            ", \"Outcome\": \"" + moveOutcome +
            "\", \"CurrentStatus\": \"" + currentStatus +
            "\", \"Response\": \"" + response +
            "\"},";

        csvMoves.push(moveNumber + "," + movePlayer + "," + moveRow + "," + moveCol + ",\"" + moveOutcome + "\",\"" + currentStatus.replace(new RegExp("\n", "g"), "") + "\",\"" + response.replace(new RegExp("\\n", "g"), "") + "\"\n");

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
    jsonMoves = jsonMoves.substring(0, jsonMoves.length - 1); // Remove last ',' from moves string.
    jsonMoves += "]";

    // Name the output files.
    let timestamp = formatTimestamp(new Date());
    let fileName = gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + result + "_" + timestamp;
    let textFileName = fileName + ".txt";
    let jsonFileName = fileName + ".json";
    let csvFileName = fileName + ".csv";
    let movesCsvFileName = "moves_" + fileName + ".csv";

    // Generate the text file content.
    let textFileContent = "UUID: " + uuid + "\n" +
        "Game Type: " + gameType + "\n" +
        "Game #: " + currentGameCount + "\n" +
        "Prompt Type: " + promptType + "\n" +
        "Prompt Version: " + promptVersion + "\n" +
        "Player 1: " + sanitizedFirstPlayer + "\n" +
        "Player 2: " + sanitizedSecondPlayer + "\n" +
        "Date and Time (yyMMdd-HHmmss): " + timestamp + "\n" +
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
        "\", \"PromptVersion\": \"" + promptVersion +
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

    // Generate the outcome CSV file content.
    let csvFileContent = "UUID,Timestamp,GameType,PromptType,PromptVersion,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds\n" +
        uuid + "," + timestamp + "," + gameType + "," + promptType + "," + promptVersion + "," + firstPlayer + "," + secondPlayer + "," + result + "," + gameDuration + "," + currentMoveCount + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds;

    let movesCsvFileContent = "UUID,Timestamp,GameType,PromptType,PromptVersion,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds,MoveNumber,MovePlayer,MoveRow,MoveCol,MoveOutcome,CurrentStatus,Response\n";
    for (let csvMove of csvMoves) {
        movesCsvFileContent += uuid + "," + timestamp + "," + gameType + "," + promptType + "," + promptVersion + "," + firstPlayer + "," + secondPlayer + "," + result + "," + gameDuration + "," + currentMoveCount + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds + csvMove;
    }
    movesCsvFileContent = movesCsvFileContent.substring(0, movesCsvFileContent.length - 1); // Remove last '\n' from moves string.

    // Add each of the generated files to the log ZIP file, which will be downloaded after gameplay concludes.
    return new GameLogFiles(textFileName, textFileContent, jsonFileName, jsonFileContent, csvFileName, csvFileContent, movesCsvFileName, movesCsvFileContent);
}

// Generate JSON and CSV files containing aggregated information about a number of games to be submitted to the leaderboard.
export function generateSubmissionFiles(gameType, promptType, promptVersion, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, providerEmail, uuid) {
    let sanitizedFirstPlayer = firstPlayer.replace("/", "_");
    let sanitizedSecondPlayer = secondPlayer.replace("/", "_");

    // Name the submission file.
    let timestamp = formatTimestamp(new Date());
    let submissionJsonName = "submission_" + gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + timestamp + ".json";
    let submissionCsvName = "submission_" + gameType + "_" + promptType + "_" + sanitizedFirstPlayer + "_" + sanitizedSecondPlayer + "_" + timestamp + ".csv";

    // Generate the submission file content.
    let submissionJsonContent = "[{\"GameType\": \"" + gameType +
        "\", \"PromptType\": \"" + promptType +
        "\", \"PromptVersion\": \"" + promptVersion +
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
        "\"}]";

    let submissionCsvContent = "GameType,PromptType,PromptVersion,LLM1stPlayer,LLM2ndPlayer,WinRatio-1st,WinRatio-2nd,Wins-1st,Wins-2nd,Disqualifications-1st,Disqualifications-2nd,Draws,InvalidMovesRatio-1st,InvalidMovesRatio-2nd,TotalMoves-1st,TotalMoves-2nd,ProviderEmail,SubmissionDate,UUID\n" +
        gameType + "," + promptType + "," + promptVersion + "," + firstPlayer + "," + secondPlayer + "," + firstPlayerWins/gameCount + "," + secondPlayerWins/gameCount + "," + firstPlayerWins + "," + secondPlayerWins + "," + firstPlayerDisqualifications + "," + secondPlayerDisqualifications + "," + draws + "," + firstPlayerTotalInvalidMoves/firstPlayerTotalMoveCount + "," + secondPlayerTotalInvalidMoves/secondPlayerTotalMoveCount + "," + firstPlayerTotalMoveCount + "," + secondPlayerTotalMoveCount + "," + providerEmail + "," + timestamp + "," + uuid;

    // Download the generated submission files to be compiled into the session's ZIP file.
    return [submissionJsonName, submissionJsonContent, submissionCsvName, submissionCsvContent];
}

// Download a file given its content, file extension, and filename.
export function downloadZipFile(submissionFiles, gameLogFiles, gameType, promptType, firstPlayer, secondPlayer) {
    let logZipFile = new JSZip();
    let timestamp = formatTimestamp(new Date());

    // Generate ZIP file name.
    let zipFileName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + timestamp + ".zip";

    // Add each game's text, JSON, and CSV files to ZIP file.
    for (let gameLogs of gameLogFiles) {
        logZipFile.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
        logZipFile.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
        logZipFile.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
        logZipFile.file(gameLogs.getMovesCsvFileName(), gameLogs.getMovesCsvFileContent());
    }

    // Add final submission JSON and CSV to ZIP file.
    // submissionFiles[0] = JSON name, submissionFiles[1] = JSON content, submissionFiles[2] = CSV name, and submissionFiles[3] = CSV content.
    logZipFile.file(submissionFiles[0], submissionFiles[1]);
    logZipFile.file(submissionFiles[2], submissionFiles[3]);

    logZipFile.generateAsync({type:"blob"}).then(function (blob) {
        saveAs(blob, zipFileName);
    });
}

// For bulk running only, download a "bulk" zip file which contains all outcomes and move information in CSV format.
export function downloadBulkZipFile(allLogFiles, gameType, promptType) {
    let bulkZipFile = new JSZip();
    let gameZipFiles = [];

    let csvFileContentAll = "UUID,Timestamp,GameType,PromptType,PromptVersion,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds\n";
    let csvFileContentAllMoves = "UUID,Timestamp,GameType,PromptType,PromptVersion,Player1,Player2,Result,TotalTime,TotalMoves,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat, Player2InvalidFormat, Player1OutOfBounds, Player2OutOfBounds,MoveNumber,MovePlayer,MoveRow,MoveCol,MoveOutcome,CurrentStatus,Response\n";
    let csvFileContentAllSubmission = "GameType,PromptType,PromptVersion,LLM1stPlayer,LLM2ndPlayer,WinRatio-1st,WinRatio-2nd,Wins-1st,Wins-2nd,Disqualifications-1st,Disqualifications-2nd,Draws,InvalidMovesRatio-1st,InvalidMovesRatio-2nd,TotalMoves-1st,TotalMoves-2nd,ProviderEmail,SubmissionDate,UUID\n";

    // Add all individual game log files from all games to bulk ZIP file.
    for (let i = 0; i < allLogFiles.length; i++) {
        //gameZipFiles[i] = new JSZip();
        //gameZipFiles.file(allLogFiles[i][0][0], allLogFiles[i][0][1]); // Add JSON submission file for current game to current game's ZIP file.
        //gameZipFiles.file(allLogFiles[i][0][2], allLogFiles[i][0][3]); // Add CSV submission file for current game to current game's ZIP file.
        bulkZipFile.file(allLogFiles[i][0][0], allLogFiles[i][0][1]); // Add JSON submission file for current game to bulk ZIP file.
        bulkZipFile.file(allLogFiles[i][0][2], allLogFiles[i][0][3]); // Add CSV submission file for current game to bulk ZIP file.
        csvFileContentAllSubmission += allLogFiles[i][0][3].split("\n")[1] + "\n"; // Add CSV submission file information for current game to "all submission" CSV file content.
        for (let gameLogs of allLogFiles[i][1]) {
            //gameZipFiles.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
            //gameZipFiles.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
            //gameZipFiles.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
            //gameZipFiles.file(gameLogs.getMovesCsvFileName(), gameLogs.getMovesCsvFileContent());
            bulkZipFile.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
            bulkZipFile.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
            bulkZipFile.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
            bulkZipFile.file(gameLogs.getMovesCsvFileName(), gameLogs.getMovesCsvFileContent());
            csvFileContentAll += gameLogs.getCsvFileContent().split("\n")[1] + "\n"; // Add game outcomes to "all" CSV file content.
            for(let move of gameLogs.getMovesCsvFileContent().split("\n").slice(1)) {
                csvFileContentAllMoves += move + "\n"; // Add move information to "all moves" CSV file content.
            }
        }
    }
    csvFileContentAll = csvFileContentAll.substring(0, csvFileContentAll.length - 1); // Remove last "\n" from outcome list.
    csvFileContentAllMoves = csvFileContentAllMoves.substring(0, csvFileContentAllMoves.length - 1); // Remove last "\n" from moves list.
    csvFileContentAllSubmission = csvFileContentAllSubmission.substring(0, csvFileContentAllSubmission.length - 1); // Remove last "\n" from submission information list.

    let timestamp = formatTimestamp(new Date());

    // Generate file names.
    let zipFileName = "bulk_" + gameType + "_" + promptType + "_" + timestamp;
    let csvFileNameAll = "all_" + gameType + "_" + promptType + ".csv";
    let csvFileNameAllMoves = "all_moves_" + gameType + "_" + promptType + ".csv";
    let csvFileNameAllSubmission = "all_submission_" + gameType + "_" + promptType + ".csv";

    bulkZipFile.file(csvFileNameAll, csvFileContentAll);
    bulkZipFile.file(csvFileNameAllMoves, csvFileContentAllMoves);
    bulkZipFile.file(csvFileNameAllSubmission, csvFileContentAllSubmission);

    bulkZipFile.generateAsync({type:"blob"}).then(function (blob) {
        saveAs(blob, zipFileName);
    });
}