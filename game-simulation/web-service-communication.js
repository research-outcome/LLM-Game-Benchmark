import { GoogleGenerativeAI } from "@google/generative-ai";

// Generate a prompt given the game type, prompt type, and player number.
import {Move} from "./classes.js";
import {TicTacToe} from "./tic-tac-toe.js";

let currentStatus = "";

async function createPrompt(promptType, gameType, currentPlayer) {
    let prompt = "";
    if (gameType === "tic-tac-toe") {
        prompt += TicTacToe.explainGame();
        prompt += TicTacToe.formatNextMove();
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
        currentStatus = listBoard(gameType);
        prompt += currentStatus;
    }
    else if (promptType === "illustration") {
        currentStatus = drawBoard(gameType);
        prompt += currentStatus;
    }
    else if (promptType === "image") {
        prompt += "The current state of the game is given in the attached image.\n";
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

// Reformat special characters for use in prompts.
function escapeStringForJson(input) {
    input = input.replace("\n", "\\n");
    return input.replace("\"", "\\\"");
}

// Return a list of moves in (row, column) format for a given game type and player.
function listPlayerMoves(gameType, player) {
    if (gameType === "tic-tac-toe") {
        return TicTacToe.listPlayerMoves(player);
    }
    else if (gameType === "connect-four") {
        // Connect four move retrieval logic here
    }
    else if (gameType === "gomoku") {
        // Gomoku move retrieval logic here
    }
}

// List the board state for a given game type.
function listBoard(gameType) {
    let firstPlayerMoves = listPlayerMoves(gameType, 1);
    let secondPlayerMoves = listPlayerMoves(gameType, 2);

    if (gameType === "tic-tac-toe") {
        return TicTacToe.listBoard(firstPlayerMoves, secondPlayerMoves);
    }
    else if (gameType === "connect-four") {
        gameStatus += " The current status of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by R for red discs): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by Y for yellow discs): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
    }
    else if (gameType === "gomoku") {
        gameStatus += " The current state of the game is recorded in a specific format: each occupied location is delineated by a semicolon (';'), and for each occupied location, the row number is listed first, followed by the column number, separated by a comma (','). If no locations are occupied by a player, 'None' is noted. Both the row and column numbers start from 1, with the top left corner of the grid indicated by 1,1. The current state of the game is as follows:\n";
        gameStatus += "The locations occupied by the first player (marked by B for black stones): ";
        gameStatus += (firstPlayerMoves.length ? firstPlayerMoves.join("; ") : "None") + "\n";
        gameStatus += "The locations occupied by the second player (marked by W for white stones): ";
        gameStatus += (secondPlayerMoves.length ? secondPlayerMoves.join("; ") : "None") + "\n";
    }
}

// Draw the board for a given game type.
function drawBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        return TicTacToe.drawBoard();
    }
    else if (gameType === "connect-four") {
        gameStatus += " The current state of the game is displayed on a 7 by 6 grid. 'R' represents positions taken by the first player and 'Y' represents positions taken by the second player, while '.' indicates an available position. The current layout is as follows:\n";
        // Connect four game drawing logic here
    }
    else if (gameType === "gomoku") {
        gameStatus += " The current state of the game is displayed on a 15 by 15 grid. 'B' represents positions taken by the first player (using black stones) and 'W' represents positions taken by the second player (using white stones), while '.' indicates an available position. The current layout is as follows:\n";
        // Gomoku game drawing logic here
    }
}

async function screenshotBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        return await TicTacToe.screenshotBoard();
    }
    else if (gameType === "connect-four") {

    }
    else if (gameType === "gomoku") {

    }
}

// Call an LLM with a given prompt, and return its response.
export async function asynchronousWebServiceCall(prompt, systemPrompt, imageData, model) {
    let modelType = model.getType();
    let modelName = model.getName();
    let apiKey = model.getApiKey();

    try {
        if (modelType === "Google") {
            let genAI = new GoogleGenerativeAI(apiKey);
            let result;
            model = genAI.getGenerativeModel({ model: modelName });
            // If model is gemini-pro-vision, and we have image data, call the model with the image.
            if (modelName === "gemini-pro-vision" && imageData !== "") {
                let image = {
                    inlineData: {
                        data: imageData.split(',')[1],
                        mimeType: "image/png",
                    }
                };

                result = await model.generateContent([prompt, image]);
            }
            else {
                result = await model.generateContent(prompt);
            }

            let response = await result.response;
            return response.candidates[0].content.parts[0].text;
        }
    }
    catch (e) {
        return "Network Error Occurred";
    }


    return new Promise((resolve, reject) => {
        let url = new URL(model.getUrl());
        let requestBody;

        // Generate a request for an OpenAI model.
        if (modelType === "OpenAI") {
            if (model.getSupportsImages() === true) {
                requestBody = JSON.stringify({
                    "model": modelName,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": imageData
                                }
                            }
                        ],
                    }]
                });
            } else {
                requestBody = JSON.stringify({
                    "model": modelName,
                    "messages": [{
                        "role": "user",
                        "content": prompt,
                    }]
                });
            }
        }

        if (modelType === "AWS Bedrock") {
            requestBody = JSON.stringify({
                "prompt": prompt,
                "modelId": modelName,
                "secret": "LLM-GameOn",
                "type": modelName.split('.')[0],
            })
        }

        fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + apiKey,
                "Content-Type": "application/json"
            },
            body: requestBody
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            else {
                return Promise.reject();
            }
        }).then(data => {
            if (modelType === "OpenAI") {
                resolve(data.choices[0].message.content);
            }
            else if (modelType === "AWS Bedrock") {
                resolve(data.body);
            }
            else {
                // Other model parsing logic.
            }
        }).catch(error => {
            resolve("Network Error Occurred");
        });
    });
}

// Replace all instances of a given string with another.
export function replaceAll(originalString, searchString, replacementString) {
    return originalString.replace(new RegExp(searchString, "g"), replacementString);
}

// Clean the LLM's response by reformatting certain characters and parsing it into a JSON object.
export function cleanResponse(content) {
    content = replaceAll(content, "\n", "");
    content = replaceAll(content, "\\\\\"", "\"");
    content = replaceAll(content, "'row'", "\"row\"");
    content = replaceAll(content, "'column'", "\"column\"");
    content = replaceAll(content, "\"{", "{");
    content = replaceAll(content, "}\"", "}");
    content = replaceAll(content, "'}", "}");
    if (content.lastIndexOf("{") !== -1) {
        content = content.substring(content.lastIndexOf("{"));
        if (content.lastIndexOf("}") !== -1) {
            content = content.substring(0, content.lastIndexOf("}") + 1);
        }
    }
    console.log("Final content before parsing: " + content);
    try {
        return JSON.parse(content);
    }
    catch(e) {
        // If there was an error parsing the JSON, return an empty string.
        return "Invalid Response";
    }
}

// Determine if the LLM's move was valid. Return a "Move" object which contains the model name and move outcome ("Y" for valid moves, explanations for invalid moves)
export async function processMove(gameType, initialContent, currentPlayer, model, currentMoveCount) {
    console.log("INITIAL CONTENT: " + initialContent);
    let jsonResponse = cleanResponse(initialContent);

    if (gameType === "tic-tac-toe") {
        let row;
        let col;
        let symbol = (currentPlayer === 1) ? "X" : "O";
        try {
            // NOTE: The code that validates a response could probably be moved into its own function.
            if (jsonResponse === "Invalid Response") {
                throw new Error();
            }

            if (jsonResponse.row !== undefined && typeof jsonResponse.row === "number") {
                row = jsonResponse.row;
            }
            else {
                throw new Error();
            }

            if (jsonResponse.column !== undefined && typeof jsonResponse.column === "number") {
                col = jsonResponse.column;
            }
            else {
                throw new Error();
            }
        }
        catch (e) {
            console.log("Move " + currentMoveCount + ": " + model.getName() + " (" + symbol + ")'s given move had an invalid format.");
            return new Move(currentMoveCount, currentPlayer, -1, -1, "Invalid Format", currentStatus, JSON.stringify(jsonResponse));
        }

        // If the move had a valid format, process it using the methods defined in the TicTacToe class.
        return TicTacToe.processMove(currentMoveCount, currentPlayer, row, col, model, currentStatus, JSON.stringify(jsonResponse));
    }
    else if (gameType === "connect-four") {
        // Connect Four move processing logic here
    }
    else if (gameType === "gomoku") {
        // Gomoku move processing logic here
    }
}

// Generate a prompt, call the LLM, and return its response.
export async function getMove(promptType, gameType, currentPlayer, model) {
    let prompt = await createPrompt(promptType, gameType, currentPlayer);
    let imageData = (promptType === "image") ? await screenshotBoard(gameType) : "";
    if (promptType === "image") {
        currentStatus = "The current state of the game is given in the attached image.\n";
        currentStatus += imageData;
    }
    let systemPrompt = createSystemPrompt();
    return await asynchronousWebServiceCall(prompt, systemPrompt, imageData, model);
}