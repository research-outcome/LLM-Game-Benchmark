import { GoogleGenerativeAI } from "@google/generative-ai";

import {Move} from "./classes.js";

let currentStatus = "";

// Generate a prompt to call the LLM with based on the prompt type, game type, and model to be called..
async function createPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves) {
    let prompt = ""; // This string will contain the text-based prompt.
    let imageData = ""; // This string will contain the base64-encoded image data for the "image" prompt type.
    let playerInvalidMoves; // This variable will store the current player's invalid moves.

    // Append the game explanation to the prompt.
    prompt += game.explainGame();

    // Dynamically generate a prompt based on the game/prompt type, and append it to the prompt.
    // Note that for the "image" prompt, the image data is handled separately, and is not part of the text prompt.
    if (promptType === "list") {
        prompt += game.listBoard();
        currentStatus = prompt.substring(prompt.lastIndexOf("The current state of the game is as follows: \n") + 47);
    }
    else if (promptType === "illustration") {
        prompt += game.drawBoard();
        currentStatus = prompt.substring(prompt.lastIndexOf("The current state of the game is as follows: \n") + 46);
    }
    else if (promptType === "image") {
        // Generate the text-based portion of the image prompt and append it to the text-based prompt.
        prompt += game.imagePrompt(); // Describe what the screenshot will look like for the given game type.
        prompt += " The current state of the game is given in the attached image. \n";

        // Generate the base64-encoded board screenshot data and store it in the "imageData" variable.
        // Note that the image data is NOT part of the text-based prompt.
        imageData = await game.screenshotBoard();

        currentStatus = imageData; // Store image data in current status so that generated images can be logged.
    }

    // Append the LLM role explanation and request for move to the text-based prompt.
    if (currentPlayer === 1) {
        prompt += " You are an adept strategic player, aiming to win the game in the fewest moves possible. You are the first player. What would be your next move? \n";
        playerInvalidMoves = firstPlayerCurrentInvalidMoves;
    }
    else {
        prompt += " You are an adept strategic player, aiming to win the game in the fewest moves possible. You are the second player. What would be your next move? \n";
        playerInvalidMoves = secondPlayerCurrentInvalidMoves;
    }

    // Append the desired response formatting for the current game to the text-based prompt.
    prompt += game.formatNextMove();

    // Append the warning about disqualification for invalid moves to the text-based prompt.
    prompt += game.invalidMoveWarning();

    // Append the player's current number of invalid moves to the text-based prompt.
    prompt += " You currently have " + playerInvalidMoves + " invalid moves."

    // Clean the prompt for the web service call.
    prompt = prompt.replaceAll("\n", "\\n");
    prompt = prompt.replaceAll("\"", "\\\"");

    // Return an array consisting of the text-based prompt and image data (if any).
    return [prompt, imageData];
}

// Create a system prompt given a model.
function createSystemPrompt(game) {
    let systemPrompt = "";

    // Clean the prompt for the web service call.
    systemPrompt = systemPrompt.replaceAll("\n", "\\n");
    systemPrompt = systemPrompt.replaceAll("\"", "\\\"");

    return systemPrompt;
}

// Call an LLM with a given prompt and base64-encoded board screenshot (if any) and return its response.
export async function asynchronousWebServiceCall(prompt, systemPrompt, imageData, model) {
    let modelType = model.getType();
    let modelName = model.getName();
    let apiKey = model.getApiKey();

    // If we are attempting to call a Google model, call the model through the Google API.
    if (modelType === "Google") {
        try {
            let genAI = new GoogleGenerativeAI(apiKey);
            let result;
            model = genAI.getGenerativeModel({ model: modelName });

            // If we have image data, call the model with the image.
            if (imageData !== "") {
                let image = {
                    inlineData: {
                        data: imageData.split(',')[1], // Discard the image metadata and only send the base64-encoded image.
                        mimeType: "image/png",
                    }
                };

                result = await model.generateContent([prompt, image]);
            }
            else {
                result = await model.generateContent(prompt);
            }

            let response = await result.response;
            if (modelName === "gemini-1.5-flash") {
                await new Promise(resolve => setTimeout(resolve, 4500)); // 4.5-second delay to meet free quota.

            }
            return response.candidates[0].content.parts[0].text;
        }
        catch (e) {
            return "Network Error Occurred";
        }
    }

    // If we are attempting to call an OpenAI or Bedrock LLM, attempt to fetch the response through its web API.
    return new Promise((resolve) => {
        let url = new URL(model.getUrl());
        let requestBody;

        // Generate a request for an OpenAI model.
        if (modelType === "OpenAI") {
            // Call the model with the image data if there is image data available.
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

        // Generate a request for a Bedrock model.
        if (modelType === "AWS Bedrock") {
            if (imageData !== "") {
                requestBody = JSON.stringify({
                    "prompt": prompt,
                    "modelId": modelName,
                    "apiKey": model.getApiKey(),
                    "type": modelName.split('.')[0],
                    "image": imageData.split(',')[1], // Discard the image metadata and only send the base64-encoded image.
                });
            } else {
                requestBody = JSON.stringify({
                    "prompt": prompt,
                    "modelId": modelName,
                    "apiKey": model.getApiKey(),
                    "type": modelName.split('.')[0],
                });
            }
        }

        // Attempt to fetch the URL's response using the generated prompt body.
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

// Clean the LLM's response by reformatting certain characters and parsing it into a JSON object.
export function cleanResponse(response) {
    response = response.replaceAll("\n", "");
    response = response.replaceAll("\\\\\"", "\"");
    response = response.replaceAll("'row'", "\"row\"");
    response = response.replaceAll("'column'", "\"column\"");
    response = response.replaceAll("\"{", "{");
    response = response.replaceAll("}\"", "}");
    response = response.replaceAll("'}", "}");
    if (response.lastIndexOf("{") !== -1) {
        response = response.substring(response.lastIndexOf("{"));
        if (response.lastIndexOf("}") !== -1) {
            response = response.substring(0, response.lastIndexOf("}") + 1);
        }
    }
    try {
        return JSON.parse(response);
    }
    catch(e) {
        // If there was an error parsing the JSON, return an empty string.
        return "Invalid Response";
    }
}

// Determine if the LLM's move was valid. Return a "Move" object which contains the model name and move outcome ("Y" for valid moves, explanations for invalid moves)
export async function processMove(game, response, currentPlayer, model, currentMoveCount) {
    response = cleanResponse(response); // Preprocess the response string into a JSON-formatted move.

    // Attempt to process the move. If the move had an invalid format, return a move object with an "Invalid Format" outcome.
    try {
        if (response === "Invalid Response") {
            throw new Error();
        }

        // Generate a Move object given the LLM response and display its move on the game board if it was valid.
        return game.processMove(response, currentPlayer, model, currentMoveCount, currentStatus);
    }
    catch (e) {
        console.log("Move " + currentMoveCount + ": " + model.getName() + "'s given move had an invalid format.");
        return new Move(currentMoveCount, currentPlayer, "Invalid Format", currentStatus, JSON.stringify(response));
    }
}

// Generate a prompt, call the LLM with the prompt, and return its response.
export async function getMove(gameType, promptType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves) {
    // Generate prompts and image data.
    let [prompt, imageData] = await createPrompt(gameType, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves);
    let systemPrompt = createSystemPrompt();

    // Call LLM with the prompt and return its response.
    return await asynchronousWebServiceCall(prompt, systemPrompt, imageData, model);
}