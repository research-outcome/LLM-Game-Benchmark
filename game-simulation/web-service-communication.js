import { GoogleGenerativeAI } from "@google/generative-ai";

// Generate a prompt given the game type, prompt type, and player number.
import {Move} from "./classes.js";
import {TicTacToe} from "./tic-tac-toe.js";
import {ConnectFour} from "./connect-four.js";
import {Gomoku} from "./gomoku.js";

let currentStatus = "";

async function createPrompt(promptType, gameType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves) {
    let prompt = "";
    let game;
    let playerInvalidMoves;

    if (gameType === "tic-tac-toe") {
        game = TicTacToe;
    }
    else if (gameType === "connect-four") {
        game = ConnectFour;
    }
    else if (gameType === "gomoku") {
        game = Gomoku;
    }

    prompt += game.explainGame();

    if (promptType === "list") {
        let firstPlayerMoves = game.listPlayerMoves(1);
        let secondPlayerMoves = game.listPlayerMoves(2);
        prompt += game.listBoard(firstPlayerMoves, secondPlayerMoves);
    }
    else if (promptType === "illustration") {
        prompt += game.drawBoard()
    }
    else if (promptType === "image") {
        prompt += game.imagePrompt();
        prompt += "The current state of the game is given in the attached image. \n";
    }

    currentStatus = prompt.substring(prompt.lastIndexOf("The current state"));

    if (currentPlayer === 1) {
        prompt += "You are an adept strategic player, aiming to win the game in the fewest moves possible. You are the first player. What would be your next move? \n";
        playerInvalidMoves = firstPlayerCurrentInvalidMoves;
    }
    else {
        prompt += "You are an adept strategic player, aiming to win the game in the fewest moves possible. You are the second player. What would be your next move? \n";
        playerInvalidMoves = secondPlayerCurrentInvalidMoves;
    }

    prompt += game.formatNextMove();

    prompt += game.invalidMoveWarning();

    prompt += "You currently have " + playerInvalidMoves + " invalid moves."

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

async function screenshotBoard(gameType) {
    if (gameType === "tic-tac-toe") {
        return await TicTacToe.screenshotBoard();
    }
    else if (gameType === "connect-four") {
        return await ConnectFour.screenshotBoard();
    }
    else if (gameType === "gomoku") {
        return await Gomoku.screenshotBoard();
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
            // If we have image data, call the model with the image.
            if (imageData !== "") {
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
            // If there is image data, we have a model that supports images and we are using the image prompt.
            // Therefore, we should call the model with the image data if there is image data available.
            // Otherwise, just call the model with a text-based prompt.
            if (imageData !== "") {
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
                "apiKey": model.getApiKey(),
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
                return Promise.reject("Network Error Occurred");
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
    let jsonResponse = cleanResponse(initialContent);

    try {
        if (jsonResponse === "Invalid Response") {
            throw new Error();
        }
        
        if (gameType === "tic-tac-toe") {
            // If the move had a valid format, process it using the methods defined in the TicTacToe class.
            return TicTacToe.processMove(currentMoveCount, currentPlayer, jsonResponse, model, currentStatus);
        } else if (gameType === "connect-four") {
            return ConnectFour.processMove(currentMoveCount, currentPlayer, jsonResponse, model, currentStatus);
        } else if (gameType === "gomoku") {
            return Gomoku.processMove(currentMoveCount, currentPlayer, jsonResponse, model, currentStatus);
        }
    }
    catch (e) {
        console.log("Move " + currentMoveCount + ": " + model.getName() + "'s given move had an invalid format.");
        return new Move(currentMoveCount, currentPlayer, -1, -1, "Invalid Format", currentStatus, JSON.stringify(jsonResponse));
    }
}

// Generate a prompt, call the LLM, and return its response.
export async function getMove(promptType, gameType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves) {
    // Generate prompts. If we are using the image prompt, generate a screenshot of the board and store the
    // base64-encoded image in the "imageData" parameter.
    let prompt = await createPrompt(promptType, gameType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves);
    let imageData = (promptType === "image") ? await screenshotBoard(gameType) : "";
    // Append image data to currentStatus so that the generated image can be logged.
    if (promptType === "image") {
        currentStatus += imageData;
    }
    let systemPrompt = createSystemPrompt();

    return await asynchronousWebServiceCall(prompt, systemPrompt, imageData, model);
}