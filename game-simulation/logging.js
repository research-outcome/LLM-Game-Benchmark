import { GameLogFiles } from './classes.js';

// Format a dateTime in yyMMdd-HHmmss format.
function formatDateTime(dateTime) {
    let year = String(dateTime.getFullYear()).slice(-2); // Get last 2 digits of year.
    let month = String(dateTime.getMonth() + 1).padStart(2, "0"); // Get month and pad to 2 digits.
    let day = String(dateTime.getDate()).padStart(2, "0"); // Get day and pad to 2 digits.
    let hours = String(dateTime.getHours()).padStart(2, "0"); // Get hour and pad to 2 digits.
    let minutes = String(dateTime.getMinutes()).padStart(2, "0"); // Get minute and pad to 2 digits.
    let seconds = String(dateTime.getSeconds()).padStart(2, "0"); // Get seconds and pad to 2 digits.

    // Return dateTime in yyMMdd-HHmmss format.
    return year + month + day + "-" + hours + minutes + seconds;
}

// Write information about the current game to .txt, .json, and .csv formats.
export function generateGameLogFiles(firstPlayer, secondPlayer, result, gameStartTime, gameType, promptType, promptVersion, currentGameCount, gameCount, currentMoveCount, firstPlayerCurrentMoveCount, secondPlayerCurrentMoveCount, firstPlayerMovesPerWin, secondPlayerMovesPerWin, gameLog, moves, finalGameState, uuid) {
    let gameDuration = Math.round((Date.now() - gameStartTime) / 1000); // Calculate game duration in seconds.
    firstPlayer = firstPlayer.replaceAll("/", "_");
    secondPlayer = secondPlayer.replaceAll("/", "_");
    result = result.replaceAll("/", "_");
    finalGameState = finalGameState.replaceAll("\n", "\\n");

    // Count the number of invalid moves and their types.
    let invalidMovesFirstPlayerAlreadyTaken = 0;
    let invalidMovesSecondPlayerAlreadyTaken = 0;
    let invalidMovesFirstPlayerInvalidFormat = 0;
    let invalidMovesSecondPlayerInvalidFormat = 0;
    let invalidMovesFirstPlayerOutOfBounds = 0;
    let invalidMovesSecondPlayerOutOfBounds = 0;

    // Convert the moves to JSON and CSV formats and count the number of invalid moves of each type.
    let jsonMoves = "[\n";
    let csvMoves = [];
    for (let move of moves) {
        let moveNumber = move.getNumber();
        let movePlayer = move.getPlayer();
        let moveRow = move.getRow();
        let moveCol = move.getCol();
        let moveOutcome = move.getOutcome();
        let currentStatus = move.getCurrentStatus().replaceAll("\n", "\\n");
        let response = move.getResponse().toString().replaceAll("\n", "\\n").replaceAll("\"", "'");

        // Convert move object to JSON string and append it to jsonMoves string.
        jsonMoves += "\t\t{\n" +
            "\t\t\t\"MoveNumber\": " + moveNumber + ",\n" +
            "\t\t\t\"Player\": " + movePlayer + ",\n" +
            "\t\t\t\"Row\": " + moveRow + ",\n" +
            "\t\t\t\"Column\": " + moveCol + ",\n" +
            "\t\t\t\"Outcome\": \"" + moveOutcome + "\",\n" +
            "\t\t\t\"CurrentStatus\": \"" + currentStatus + "\",\n" +
            "\t\t\t\"Response\": \"" + response + "\"\n" +
            "\t\t},\n";

        // Convert move object to a CSV row and append it to the csvMoves list.
        csvMoves.push(moveNumber + "," + movePlayer + "," + moveRow + "," + moveCol + ",\"" + moveOutcome + "\",\"" + currentStatus.replaceAll("\n", "") + "\",\"" + response.replaceAll("\\n", "") + "\"");

        // If the move was invalid, increment the player's invalid move count for that type of invalid move.
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
    // Finalize jsonMoves string.
    jsonMoves = jsonMoves.substring(0, jsonMoves.length - 2); // Remove last ',\n' from moves string.
    jsonMoves += "\n\t]"; // Close jsonMoves array.

    // Name the output files.
    let dateTime = formatDateTime(new Date());
    let fileName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + result + "_" + dateTime;
    let textFileName = fileName + ".txt";
    let jsonFileName = fileName + ".json";
    let csvFileName = fileName + ".csv";
    let movesCsvFileName = fileName + "_moves.csv";

    // Generate the text file content.
    let textFileContent = "UUID: " + uuid + "\n" +
        "Date and Time (yyMMdd-HHmmss): " + dateTime + "\n" +
        "Game Type: " + gameType + "\n" +
        "Prompt Type: " + promptType + "\n" +
        "Prompt Version: " + promptVersion + "\n" +
        "Game #: " + currentGameCount + "\n" +
        "Player 1: " + firstPlayer + "\n" +
        "Player 2: " + secondPlayer + "\n" +
        "Result: " + result + "\n" +
        "Game Duration (seconds): " + gameDuration + "\n" +
        "Total Moves: " + currentMoveCount + "\n" +
        "Player 1 Moves: " + firstPlayerCurrentMoveCount + "\n" +
        "Player 2 Moves: " + secondPlayerCurrentMoveCount + "\n" +
        "Player 1 Moves per Win: " + firstPlayerMovesPerWin + "\n" +
        "Player 2 Moves per Win: " + secondPlayerMovesPerWin + "\n" +
        "Player 1 Already Taken Moves: " + invalidMovesFirstPlayerAlreadyTaken + "\n" +
        "Player 2 Already Taken Moves: " + invalidMovesSecondPlayerAlreadyTaken + "\n" +
        "Player 1 Invalid Format Moves: " + invalidMovesFirstPlayerInvalidFormat + "\n" +
        "Player 2 Invalid Format Moves: " + invalidMovesSecondPlayerInvalidFormat + "\n" +
        "Player 1 Out of Bounds Moves: " + invalidMovesFirstPlayerOutOfBounds + "\n" +
        "Player 2 Out of Bounds Moves: " + invalidMovesSecondPlayerOutOfBounds + "\n" +
        "Moves: \n" +
        gameLog;

    // Generate the JSON file content.
    let jsonFileContent = "{\n" +
            "\t\"UUID\": \"" + uuid + "\",\n" +
            "\t\"DateTime\": \"" + dateTime + "\",\n" +
            "\t\"GameType\": \"" + gameType + "\",\n" +
            "\t\"PromptType\": \"" + promptType + "\",\n" +
            "\t\"PromptVersion\": \"" + promptVersion + "\",\n" +
            "\t\"GameNumber\": " + currentGameCount + ",\n" +
            "\t\"Player1\": \"" + firstPlayer + "\",\n" +
            "\t\"Player2\": \"" + secondPlayer + "\",\n" +
            "\t\"Result\": \"" + result + "\",\n" +
            "\t\"GameDuration\": " + gameDuration + ",\n" +
            "\t\"TotalMoves\": " + currentMoveCount + ",\n" +
            "\t\"Player1Moves\": " + firstPlayerCurrentMoveCount + ",\n" +
            "\t\"Player2Moves\": " + secondPlayerCurrentMoveCount + ",\n" +
            "\t\"Player1MovesPerWin\": " + firstPlayerMovesPerWin + ",\n" +
            "\t\"Player2MovesPerWin\": " + secondPlayerMovesPerWin + ",\n" +
            "\t\"Player1InvalidAlreadyTaken\": " + invalidMovesFirstPlayerAlreadyTaken + ",\n" +
            "\t\"Player2InvalidAlreadyTaken\": " + invalidMovesSecondPlayerAlreadyTaken + ",\n" +
            "\t\"Player1InvalidFormat\": " + invalidMovesFirstPlayerInvalidFormat + ",\n" +
            "\t\"Player2InvalidFormat\": " + invalidMovesSecondPlayerInvalidFormat + ",\n" +
            "\t\"Player1OutOfBounds\": " + invalidMovesFirstPlayerOutOfBounds + ",\n" +
            "\t\"Player2OutOfBounds\": " + invalidMovesSecondPlayerOutOfBounds + ",\n" +
            "\t\"Moves\": " + jsonMoves + ",\n" +
            "\t\"FinalGameState\": \"" + finalGameState + "\"\n" +
        "}";

    // Generate the outcome CSV file content.
    let csvFileContent = "UUID,DateTime,GameType,PromptType,PromptVersion,GameNumber,Player1,Player2,Result,GameDuration,TotalMoves,Player1Moves,Player2Moves,Player1MovesPerWin,Player2MovesPerWin,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat,Player2InvalidFormat,Player1OutOfBounds,Player2OutOfBounds\n" +
        "\"" + uuid + "\",\"" + dateTime + "\",\"" + gameType + "\",\"" + promptType + "\",\"" + promptVersion + "\"," + currentGameCount + ",\"" + firstPlayer + "\",\"" + secondPlayer + "\",\"" + result + "\"," + gameDuration + "," + currentMoveCount + "," + firstPlayerCurrentMoveCount + "," + secondPlayerCurrentMoveCount + "," + firstPlayerMovesPerWin + "," + secondPlayerMovesPerWin + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds;

    // Generate the moves CSV file content.
    let movesCsvFileContent = "UUID,DateTime,GameType,PromptType,PromptVersion,GameNumber,Player1,Player2,Result,GameDuration,TotalMoves,Player1Moves,Player2Moves,Player1MovesPerWin,Player2MovesPerWin,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat,Player2InvalidFormat,Player1OutOfBounds,Player2OutOfBounds,MoveNumber,MovePlayer,MoveRow,MoveCol,MoveOutcome,CurrentStatus,Response,FinalGameState\n";
    for (let csvMove of csvMoves) {
        movesCsvFileContent += "\"" + uuid + "\",\"" + dateTime + "\",\"" + gameType + "\",\"" + promptType + "\",\"" + promptVersion + "\"," + currentGameCount + ",\"" + firstPlayer + "\",\"" + secondPlayer + "\",\"" + result + "\"," + gameDuration + "," + currentMoveCount + "," + firstPlayerCurrentMoveCount + "," + secondPlayerCurrentMoveCount + "," + firstPlayerMovesPerWin + "," + secondPlayerMovesPerWin + "," + invalidMovesFirstPlayerAlreadyTaken + "," + invalidMovesSecondPlayerAlreadyTaken + "," + invalidMovesFirstPlayerInvalidFormat + "," + invalidMovesSecondPlayerInvalidFormat + "," + invalidMovesFirstPlayerOutOfBounds + "," + invalidMovesSecondPlayerOutOfBounds + "," + csvMove + ",\"" + finalGameState + "\"\n";
    }
    movesCsvFileContent = movesCsvFileContent.substring(0, movesCsvFileContent.length - 1); // Remove last '\n' from moves string.

    // Add each of the generated files to the log ZIP file, which will be downloaded after gameplay concludes.
    return new GameLogFiles(textFileName, textFileContent, jsonFileName, jsonFileContent, csvFileName, csvFileContent, movesCsvFileName, movesCsvFileContent);
}

// Generate JSON and CSV files containing aggregated information about a number of games to be submitted to the leaderboard.
export function generateSubmissionFiles(gameType, promptType, promptVersion, firstPlayer, secondPlayer, firstPlayerWins, secondPlayerWins, gameCount, firstPlayerDisqualifications, secondPlayerDisqualifications, draws, firstPlayerTotalInvalidMoves, secondPlayerTotalInvalidMoves, firstPlayerTotalMoveCount, secondPlayerTotalMoveCount, providerEmail, uuid) {
    firstPlayer = firstPlayer.replaceAll("/", "_");
    secondPlayer = secondPlayer.replaceAll("/", "_");

    // Name the submission file.
    let dateTime = formatDateTime(new Date());
    let submissionJsonName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + dateTime + "_submission.json";
    let submissionCsvName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + dateTime + "_submission.csv";

    // Calculate invalid move ratios.
    let firstPlayerInvalidMovesRatio = (firstPlayerTotalMoveCount === 0) ? 0 : firstPlayerTotalInvalidMoves/firstPlayerTotalMoveCount;
    let secondPlayerInvalidMovesRatio = (secondPlayerTotalMoveCount === 0) ? 0: secondPlayerTotalInvalidMoves/secondPlayerTotalMoveCount;

    // Generate the submission file content.
    let submissionJsonContent = "[\n" +
            "\t{\n" +
                "\t\t\"GameType\": \"" + gameType + "\",\n" +
                "\t\t\"PromptType\": \"" + promptType + "\",\n" +
                "\t\t\"PromptVersion\": \"" + promptVersion + "\",\n" +
                "\t\t\"LLM1stPlayer\": \"" + firstPlayer + "\",\n" +
                "\t\t\"LLM2ndPlayer\": \"" + secondPlayer + "\",\n" +
                "\t\t\"WinRatio-1st\": \"" + firstPlayerWins/gameCount + "\",\n" +
                "\t\t\"WinRatio-2nd\": \"" + secondPlayerWins/gameCount + "\",\n" +
                "\t\t\"Wins-1st\": \"" + firstPlayerWins + "\",\n" +
                "\t\t\"Wins-2nd\": \"" + secondPlayerWins + "\",\n" +
                "\t\t\"Disqualifications-1st\": \"" + firstPlayerDisqualifications + "\",\n" +
                "\t\t\"Disqualifications-2nd\": \"" + secondPlayerDisqualifications + "\",\n" +
                "\t\t\"Draws\": \"" + draws + "\",\n" +
                "\t\t\"InvalidMovesRatio-1st\": \"" + firstPlayerInvalidMovesRatio + "\",\n" +
                "\t\t\"InvalidMovesRatio-2nd\": \"" + secondPlayerInvalidMovesRatio + "\",\n" +
                "\t\t\"TotalMoves-1st\": \"" + firstPlayerTotalMoveCount + "\",\n" +
                "\t\t\"TotalMoves-2nd\": \"" + secondPlayerTotalMoveCount + "\",\n" +
                "\t\t\"ProviderEmail\": \"" + providerEmail + "\",\n" +
                "\t\t\"DateTime\": \"" + dateTime + "\",\n" +
                "\t\t\"UUID\": \"" + uuid + "\"\n" +
            "\t}\n" +
        "]";

    let submissionCsvContent = "GameType,PromptType,PromptVersion,LLM1stPlayer,LLM2ndPlayer,WinRatio-1st,WinRatio-2nd,Wins-1st,Wins-2nd,Disqualifications-1st,Disqualifications-2nd,Draws,InvalidMovesRatio-1st,InvalidMovesRatio-2nd,TotalMoves-1st,TotalMoves-2nd,ProviderEmail,DateTime,UUID\n" +
        gameType + "," + promptType + "," + promptVersion + "," + firstPlayer + "," + secondPlayer + "," + firstPlayerWins/gameCount + "," + secondPlayerWins/gameCount + "," + firstPlayerWins + "," + secondPlayerWins + "," + firstPlayerDisqualifications + "," + secondPlayerDisqualifications + "," + draws + "," + firstPlayerInvalidMovesRatio + "," + secondPlayerInvalidMovesRatio + "," + firstPlayerTotalMoveCount + "," + secondPlayerTotalMoveCount + "," + providerEmail + "," + dateTime + "," + uuid;

    // Download the generated submission files to be compiled into the session's ZIP file.
    return [submissionJsonName, submissionJsonContent, submissionCsvName, submissionCsvContent];
}

// Download a ZIP file for the current gameplay session.
export function downloadZipFile(submissionFiles, gameLogFiles, boardScreenshots, gameType, promptType, firstPlayer, secondPlayer) {
    let logZipFile = new JSZip();
    let dateTime = formatDateTime(new Date());

    // Generate ZIP file name.
    let zipFileName = gameType + "_" + promptType + "_" + firstPlayer + "_" + secondPlayer + "_" + dateTime + ".zip";

    // Add each game's text, JSON, and CSV files to ZIP file.
    let gameIndex = 0;
    for (let gameLogs of gameLogFiles) {
        // Add text, JSON, and CSV files for each game to ZIP file.
        logZipFile.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
        logZipFile.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
        logZipFile.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
        logZipFile.file(gameLogs.getMovesCsvFileName(), gameLogs.getMovesCsvFileContent());

        // If we are using an "image" prompt type, add each board screenshot to the ZIP file.
        if (promptType === "image") {
            let moves = JSON.parse(gameLogs.getJsonFileContent()).Moves;
            let finalBoardImageData = JSON.parse(gameLogs.getJsonFileContent()).FinalGameState.split(',')[1];
            for (let i = 0; i <= moves.length; i++) {
                let imageFileName = gameLogs.getJsonFileName();
                imageFileName = imageFileName.substring(0, imageFileName.length - 5); // Get json file name and remove ".json" extension.
                imageFileName = imageFileName + "_move" + i.toString().padStart(3, "0") + ".png"; // Append "_moven.png" to filename to finalize image file name. n is padded with 0s to (at least) 3 decimal places.

                // If we have iterated through all moves in the moves list, save the final board state screenshot.
                // The data for this screenshot is stored in the FinalGameState value in the JSON file.
                let imageData = (i === moves.length) ? finalBoardImageData : moves[i].CurrentStatus.split(',')[1]; // Obtain raw base64-encoded screenshot data.

                logZipFile.file(imageFileName, imageData, { base64:true });
            }
        }

        // Save board screenshots for this game, if there are any. These are only saved when "save progress images in ZIP file" is checked and promptType is NOT "image".
        for (let i = 0; i < boardScreenshots[gameIndex].length; i++) {
            let imageFileName = gameLogs.getJsonFileName();
            imageFileName = imageFileName.substring(0, imageFileName.length - 5); // Get json file name and remove ".json" extension.
            imageFileName = imageFileName + "_move" + i.toString().padStart(3, "0") + ".png"; // Append "_moven.png" to filename to finalize image file name. n is padded with 0s to (at least) 3 decimal places.

            // If we have iterated through all moves in the moves list, save the final board state screenshot.
            // The data for this screenshot is stored in the FinalGameState value in the JSON file.
            let imageData = boardScreenshots[gameIndex][i].split(',')[1]; // Obtain raw base64-encoded screenshot data.

            logZipFile.file(imageFileName, imageData, { base64:true });
        }


        // Add final submission JSON and CSV files to session's ZIP file.
        // submissionFiles[0] = JSON name, submissionFiles[1] = JSON content,
        // submissionFiles[2] = CSV name, and submissionFiles[3] = CSV content.
        logZipFile.file(submissionFiles[0], submissionFiles[1]);
        logZipFile.file(submissionFiles[2], submissionFiles[3]);

        logZipFile.generateAsync({type:"blob"}).then(function (blob) {
            saveAs(blob, zipFileName);
        });

        gameIndex++;
    }
}

// For bulk running only, download a "bulk" zip file which contains all outcomes and move information in CSV format.
export function downloadBulkZipFile(allLogFiles) {
    let bulkZipFile = new JSZip();
    let gameType;
    let promptType;
    try {
        gameType = JSON.parse(allLogFiles[0][0][1])[0].GameType;
        promptType = JSON.parse(allLogFiles[0][0][1])[0].PromptType;
    }
    catch (e) {
        alert("An error occurred while obtaining game type or prompt type for bulk zip file. Replacing them with their default values and attempting to continue.");
        gameType = "error-getting-game-type";
        promptType = "error-getting-prompt-type";
    }

    let jsonFileContentAllSubmission = "[\n";
    let jsonFileContentAllMoves = "{\n";
    let csvFileContentAll = "UUID,DateTime,GameType,PromptType,PromptVersion,GameNumber,Player1,Player2,Result,GameDuration,TotalMoves,Player1Moves,Player2Moves,Player1MovesPerWin,Player2MovesPerWin,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat,Player2InvalidFormat,Player1OutOfBounds,Player2OutOfBounds\n";
    let csvFileContentAllMoves = "UUID,DateTime,GameType,PromptType,PromptVersion,GameNumber,Player1,Player2,Result,GameDuration,TotalMoves,Player1Moves,Player2Moves,Player1MovesPerWin,Player2MovesPerWin,Player1InvalidAlreadyTaken,Player2InvalidAlreadyTaken,Player1InvalidFormat,Player2InvalidFormat,Player1OutOfBounds,Player2OutOfBounds,MoveNumber,MovePlayer,MoveRow,MoveCol,MoveOutcome,CurrentStatus,Response,FinalGameState\n";
    let csvFileContentAllSubmission = "GameType,PromptType,PromptVersion,LLM1stPlayer,LLM2ndPlayer,WinRatio-1st,WinRatio-2nd,Wins-1st,Wins-2nd,Disqualifications-1st,Disqualifications-2nd,Draws,InvalidMovesRatio-1st,InvalidMovesRatio-2nd,TotalMoves-1st,TotalMoves-2nd,ProviderEmail,DateTime,UUID\n";

    // Add all individual game log files from all games to bulk ZIP file.
    try {
        for (let i = 0; i < allLogFiles.length; i++) {
            bulkZipFile.file(allLogFiles[i][0][0], allLogFiles[i][0][1]); // Add JSON submission file for current game to bulk ZIP file.
            bulkZipFile.file(allLogFiles[i][0][2], allLogFiles[i][0][3]); // Add CSV submission file for current game to bulk ZIP file.

            jsonFileContentAllSubmission += allLogFiles[i][0][1].substring(2, allLogFiles[i][0][1].length - 2) + ",\n"; // Add submission file object for current game to list of all submission file JSON objects for the entire bulk run.
            csvFileContentAllSubmission += allLogFiles[i][0][3].split("\n")[1] + "\n"; // Add CSV submission file information for current game to "all submission" CSV file content.
            let gameIndex = 0;
            for (let gameLogs of allLogFiles[i][1]) {
                bulkZipFile.file(gameLogs.getTextFileName(), gameLogs.getTextFileContent());
                bulkZipFile.file(gameLogs.getJsonFileName(), gameLogs.getJsonFileContent());
                bulkZipFile.file(gameLogs.getCsvFileName(), gameLogs.getCsvFileContent());
                bulkZipFile.file(gameLogs.getMovesCsvFileName(), gameLogs.getMovesCsvFileContent());
                csvFileContentAll += gameLogs.getCsvFileContent().split("\n")[1] + "\n"; // Add game outcomes to "all" CSV file content.
                for(let move of gameLogs.getMovesCsvFileContent().split("\n").slice(1)) {
                    csvFileContentAllMoves += move + "\n"; // Add move information to "all moves" CSV file content.
                }

                let jsonContent = JSON.parse(gameLogs.getJsonFileContent());
                let moveObjectName = "Moves_" + gameLogs.getJsonFileName();
                moveObjectName = moveObjectName.substring(0, moveObjectName.length - 5);
                jsonFileContentAllMoves += "\t\"" + moveObjectName + "\": [\n";
                for (let move of jsonContent.Moves) {
                    jsonFileContentAllMoves += "\t\t{\n";
                    jsonFileContentAllMoves += "\t\t\t\"MoveNumber\": " + JSON.stringify(move.Row) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"Player\": " + JSON.stringify(move.Player) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"Row\": " + JSON.stringify(move.Row) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"Column\": " + JSON.stringify(move.Column) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"Outcome\": " + JSON.stringify(move.Outcome) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"CurrentStatus\": " + JSON.stringify(move.CurrentStatus) + ",\n";
                    jsonFileContentAllMoves += "\t\t\t\"Response\": " + JSON.stringify(move.Response) + "\n";
                    jsonFileContentAllMoves += "\t\t},\n";
                }
                jsonFileContentAllMoves = jsonFileContentAllMoves.substring(0, jsonFileContentAllMoves.length - 2);
                jsonFileContentAllMoves += "\n\t],\n";

                // If we are using an "image" prompt type, add each board screenshot to the ZIP file.
                if (promptType === "image") {
                    let moves = JSON.parse(gameLogs.getJsonFileContent()).Moves;
                    let finalBoardImageData = JSON.parse(gameLogs.getJsonFileContent()).FinalGameState.split(',')[1];
                    for (let i = 0; i <= moves.length; i++) {
                        let imageFileName = gameLogs.getJsonFileName();
                        imageFileName = imageFileName.substring(0, imageFileName.length - 5); // Get json file name and remove ".json" extension.
                        imageFileName = imageFileName + "_move" + i.toString().padStart(3, "0") + ".png"; // Append "_moven.png" to filename to finalize image file name. n is padded with 0s to (at least) 3 decimal places.

                        // If we have iterated through all moves in the moves list, save the final board state screenshot.
                        // The data for this screenshot is stored in the FinalGameState value in the JSON file.
                        let imageData = (i === moves.length) ? finalBoardImageData : moves[i].CurrentStatus.split(',')[1]; // Obtain raw base64-encoded screenshot data.

                        bulkZipFile.file(imageFileName, imageData, { base64:true });
                    }
                }

                // Save board screenshots for this game, if there are any. These are only saved when "save progress images in ZIP file" is checked and promptType is NOT "image".
                for (let j = 0; j < allLogFiles[i][2][gameIndex].length; j++) {
                    let imageFileName = gameLogs.getJsonFileName();
                    imageFileName = imageFileName.substring(0, imageFileName.length - 5); // Get json file name and remove ".json" extension.
                    imageFileName = imageFileName + "_move" + j.toString().padStart(3, "0") + ".png"; // Append "_moven.png" to filename to finalize image file name. n is padded with 0s to (at least) 3 decimal places.

                    // If we have iterated through all moves in the moves list, save the final board state screenshot.
                    // The data for this screenshot is stored in the FinalGameState value in the JSON file.
                    let imageData = allLogFiles[i][2][gameIndex][j].split(',')[1]; // Obtain raw base64-encoded screenshot data.

                    bulkZipFile.file(imageFileName, imageData, { base64:true });
                }

                gameIndex++;
            }
        }
    }
    catch (e) {
        alert("An error occurred while generating the bulk ZIP file's contents. Downloading all files that were generated before the error.");
    }

    // Remove last ",\n" from "All" JSON content and append closing newline and bracket "\n]".
    jsonFileContentAllSubmission = jsonFileContentAllSubmission.substring(0, jsonFileContentAllSubmission.length - 2);
    if (jsonFileContentAllSubmission !== "") {
        jsonFileContentAllSubmission += "\n]";
    } else {
        alert ("\"All Submission\" JSON content was not generated, meaning no logs were successfully made. Exiting.");
        return;
    }

    jsonFileContentAllMoves = jsonFileContentAllMoves.substring(0, jsonFileContentAllMoves.length - 2);
    if (jsonFileContentAllMoves !== "") {
        jsonFileContentAllMoves += "\n}";
    } else {
        alert ("\"All Moves\" JSON content was not generated, meaning no logs were successfully made. Exiting.");
        return;
    }

    // Remove last newline character from CSV file contents.
    if (csvFileContentAll.split("\n")[1] === "" || csvFileContentAllMoves.split("\n")[1] === "" || csvFileContentAllSubmission.split("\n")[1] === "") {
        alert("\"All\" CSV file content was not generated, meaning no logs were successfully made. Exiting.");
        return;
    }
    else {
        csvFileContentAll = csvFileContentAll.substring(0, csvFileContentAll.length - 1);
        csvFileContentAllMoves = csvFileContentAllMoves.substring(0, csvFileContentAllMoves.length - 1);
        csvFileContentAllSubmission = csvFileContentAllSubmission.substring(0, csvFileContentAllSubmission.length - 1);
    }

    // Generate a dateTime to be used for the ZIP file name.
    let dateTime = formatDateTime(new Date());

    // Generate file names.
    let zipFileName = gameType + "_" + promptType + "_" + dateTime + "_bulk";
    let jsonFileNameAllSubmission = gameType + "_" + promptType + "_" + dateTime + "_all_submission.json";
    let jsonFileNameAllMoves = gameType + "_" + promptType + "_" + dateTime + "_all_moves.json";
    let csvFileNameAll = gameType + "_" + promptType + "_" + dateTime + "_all.csv";
    let csvFileNameAllMoves = gameType + "_" + promptType + "_" + dateTime + "_all_moves.csv";
    let csvFileNameAllSubmission = gameType + "_" + promptType + "_" + dateTime + "_all_submission.csv";

    try {
        // Add "all" file contents to the bulk ZIP file.
        bulkZipFile.file(jsonFileNameAllSubmission, jsonFileContentAllSubmission);
        bulkZipFile.file(jsonFileNameAllMoves, jsonFileContentAllMoves);
        bulkZipFile.file(csvFileNameAll, csvFileContentAll);
        bulkZipFile.file(csvFileNameAllMoves, csvFileContentAllMoves);
        bulkZipFile.file(csvFileNameAllSubmission, csvFileContentAllSubmission);

        // Download bulk ZIP file.
        bulkZipFile.generateAsync({type:"blob"}).then(function (blob) {
            saveAs(blob, zipFileName);
        });
    }
    catch (e) {
        alert("Could not download bulk ZIP file due to an error.");
    }
}