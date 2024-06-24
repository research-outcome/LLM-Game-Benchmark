import { GoogleGenerativeAI } from "@google/generative-ai";

import { Move } from "./classes.js";

const MULTI_AGENT_SERVER_ADDRESS = "http://localhost:3000"; // Address to the multi-agent implementation web server.

let currentStatus = "";

// Generate a prompt to call the LLM with based on the prompt type, game type, and model to be called.
async function createSinglePlayerPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove) {
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

    // If the most recent move was invalid, it was this LLM's mistake. Provide the move's content and the reason it was invalid so the LLM can correct itself.
    if (previousMove !== undefined) {
        if (previousMove.getOutcome() !== "Valid") {
            prompt += " Your previous response was '" + previousMove.getResponse() + "'. This move was deemed invalid for the following reason: '" + previousMove.getOutcome() + "'. Please adjust accordingly. \n";
        }
    }

    // Append the player's current number of invalid moves to the text-based prompt.
    prompt += " You currently have " + playerInvalidMoves + " invalid move(s). " + (game.getMaxInvalidMoves() - playerInvalidMoves + 1) + " more invalid move(s) will result in disqualification.";

    // Clean the prompt for the web service call.
    prompt = prompt.replaceAll("\n", "\\n");
    prompt = prompt.replaceAll("\"", "\\\"");

    // Return an array consisting of the text-based prompt and image data (if any).
    return [prompt, imageData];
}

// Create a system prompt given a model.
function createSinglePlayerSystemPrompt(game) {
    let systemPrompt = "";

    // Clean the prompt for the web service call.
    systemPrompt = systemPrompt.replaceAll("\n", "\\n");
    systemPrompt = systemPrompt.replaceAll("\"", "\\\"");

    return systemPrompt;
}

async function createStrategistPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove) {
    let [prompt, imageData] = await createSinglePlayerPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
    prompt = prompt.split(" You are an adept strategic player")[0]; // We only take the part of the string that explains the game and game state.
    let player = (currentPlayer === 1) ? "first" : "second";
    prompt += " You are playing in a team of three: a strategist, a suggester, and a validator, all collaborating as the " + player + " player. You are the strategist: you must analyze the current board and suggest strategic moves to win the game or to avoid defeat. \\n";
    prompt += " If you have an opportunity to win with the next move, you should suggest taking that move; these types of moves have the highest priority. If the opponent is about to win with one more move, you should suggest blocking that move, if there isn't an available move that would win you the game. Finally, if neither of the previous two move types apply, if you can make a move that will help you win the game in a few short steps, you should suggest making that move. \\n";
    prompt += " Based on these guidelines, make a suggestion for the best move to make, with a brief explanation. This suggestion will be sent to your teammate, the suggester, who will take your strategy into account while suggesting the next move. \\n";
    prompt += " Your team is collaborating, playing as the " + player + " player.";
    console.log("Strategist Prompt: " + prompt);
    return [prompt, imageData];
}

async function createSuggesterPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove) {
    let [prompt, imageData] = await createSinglePlayerPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
    prompt = prompt.split(" You are the")[0];
    let player = (currentPlayer === 1) ? "first" : "second";
    prompt += " You are playing in a team of three: a strategist, a suggester, and a validator, all collaborating as the " + player + " player. You are the suggester; your job is to analyze the suggestions from the strategist and then make a suggestion for the next move. \\n";
    prompt += game.formatNextMove().replaceAll("\n", "\\n");
    console.log("Original Suggester Prompt (before Strategist/Validator Calls): " + prompt);
    return [prompt, imageData];
}

async function createValidatorPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove) {
    let [prompt, imageData] = await createSinglePlayerPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
    prompt = prompt.split(" You are the")[0];
    let player = (currentPlayer === 1) ? "first" : "second";
    prompt += " You are playing in a team of three: a strategist, a suggester, and a validator, all collaborating as the " + player + " player. You are the validator; your job is to check the move given by the suggester. If it conforms to the following guidelines, give the following response: 'Finalize Move'. If it does not conform to the guidelines, give a brief explanation of what is wrong with the move; this explanation will be given back to the suggester so that it can alter the move accordingly. \\n";
    //prompt += " Moves should use the following JSON format: " + game.formatNextMove().split("format: ")[1].replaceAll("\n", "\\n");
    prompt += game.moveRequirements().replaceAll("\n", "\\n");
    console.log("Original Validator Prompt (before Strategist/Suggester Calls): " + prompt);
    return [prompt, imageData];
}

// Call an LLM with a given prompt and base64-encoded board screenshot (if any) and return its response.
export async function asynchronousWebServiceCall(prompt, systemPrompt, imageData, modelType, modelName, modelUrl, modelApiKey, useConsoleLogging) {
    if (useConsoleLogging) console.log("Prompt: " + prompt);

    // If we are attempting to call a Google model, call the model through the Google API.
    if (modelType === "Google") {
        try {
            let genAI = new GoogleGenerativeAI(modelApiKey);
            let result;
            let model = genAI.getGenerativeModel({ model: modelName });

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
            return response.candidates[0].content.parts[0].text;
        }
        catch (e) {
            console.log(e);
            return "Network Error Occurred";
        }
    }

    // If we are attempting to call an OpenAI or Bedrock LLM, attempt to fetch the response through its web API.
    return new Promise((resolve) => {
        let url = new URL(modelUrl);
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
                    "apiKey": modelApiKey,
                    "type": modelName.split('.')[0],
                    "image": imageData.split(',')[1], // Discard the image metadata and only send the base64-encoded image.
                });
            } else {
                requestBody = JSON.stringify({
                    "prompt": prompt,
                    "modelId": modelName,
                    "apiKey": modelApiKey,
                    "type": modelName.split('.')[0],
                });
            }
        }

        // Attempt to fetch the URL's response using the generated prompt body.
        fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + modelApiKey,
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
    response = response.replaceAll("\t", "");
    response = response.replaceAll("\n", "");
    response = response.replaceAll("\\\\\"", "\"");
    response = response.replaceAll("\\\"", "\"");
    response = response.replaceAll("\\'", "\"");
    response = response.replaceAll("'", "\"");
    response = response.replaceAll("\"{", "{");
    response = response.replaceAll("}\"", "}");
    response = response.replaceAll("'}", "}");
    if (response.lastIndexOf("{") !== -1) {
        response = response.substring(response.lastIndexOf("{"));
        if (response.lastIndexOf("}") !== -1) {
            response = response.substring(0, response.lastIndexOf("}") + 1);
        }
    }
    return response;
}

// Determine if the LLM's move was valid. Return a "Move" object which contains the model name and move outcome ("Y" for valid moves, explanations for invalid moves)
export async function processMove(game, response, currentPlayer, model, currentMoveCount, useConsoleLogging) {
    response = cleanResponse(response); // Preprocess the response string into a JSON-formatted move.

    // Attempt to process the move. If the move had an invalid format, return a move object with an "Invalid Format" outcome.
    try {
        response = JSON.parse(response); // Attempt to parse the response. If parsing fails, the move has an invalid format.

        // Generate a Move object given the LLM response and display its move on the game board if it was valid.
        return game.processMove(response, currentPlayer, model, currentMoveCount, currentStatus, useConsoleLogging);
    }
    catch (e) {
        if (useConsoleLogging) console.log("Move " + currentMoveCount + ": " + model.getName() + "'s given move had an invalid format.");
        return new Move(currentMoveCount, currentPlayer, -1, -1, "Invalid Format", currentStatus, response);
    }
}

// Get a move by generating a prompt and calling the LLM.
export async function getMove(game, promptType, currentPlayerType, currentPlayer, model, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove, useConsoleLogging) {
    if (currentPlayerType === "single") {
        // If we are using a single-player implementation, generate a prompt, call the LLM with the prompt, and return its response.

        // Generate prompts and image data (if necessary).
        let [prompt, imageData] = await createSinglePlayerPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
        let systemPrompt = createSinglePlayerSystemPrompt();

        // Obtain model information.
        let modelType = model.getType();
        if (modelType === "Random") { // If we are using random play, there is no need to perform a web service call; just return a random move.
            return game.randomMove();
        }
        let modelName = model.getName();
        let modelUrl = model.getUrl();
        let modelApiKey = model.getApiKey();

        // Call LLM with prompts and image data (if it is present).
        return await asynchronousWebServiceCall(prompt, systemPrompt, imageData, modelType, modelName, modelUrl, modelApiKey, useConsoleLogging);
    }
    else if (currentPlayerType === "multi") {
        // If we are using a multi-agent implementation, call the multi-agent web server to perform the multi-agent collaboration and retrieve a move.

        // Obtain model information.
        let modelType = model.getType();
        if (modelType === "Random") { // If we are using random play, there is no need to perform multi-agent collaboration; just return a random move.
            return game.randomMove();
        }
        let modelName = model.getName();
        let modelUrl = model.getUrl();
        let modelApiKey = model.getApiKey();

        // Generate prompts and image data (if necessary).
        let strategistPrompt = await createStrategistPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
        let suggesterPrompt = await createSuggesterPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
        let validatorPrompt = await createValidatorPrompt(game, promptType, currentPlayer, firstPlayerCurrentInvalidMoves, secondPlayerCurrentInvalidMoves, previousMove);
        let systemPrompt = createSinglePlayerSystemPrompt();

        // Generate a request to be sent to the multi-agent implementation server.
        let requestBody = {
            strategistPrompt: strategistPrompt[0],
            suggesterPrompt: suggesterPrompt[0],
            validatorPrompt: validatorPrompt[0],
            systemPrompt: systemPrompt,
            imageData: strategistPrompt[1],
            modelType: modelType,
            modelName: modelName,
            modelUrl: modelUrl,
            modelApiKey: modelApiKey,
            useConsoleLogging: useConsoleLogging
        }

        // Call the multi-agent implementation server, which will perform the multi-agent collaboration and return a move.
        return await fetch(MULTI_AGENT_SERVER_ADDRESS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            else {
                return "Network Error Occurred";
            }
        }).then(data => {
            return data.response;
        }).catch(error => {
            return "Network Error Occurred";
        });
    }
}