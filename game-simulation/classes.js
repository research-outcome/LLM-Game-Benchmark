// 'Move' class which contains the LLM name and move outcome ("Y" for valid moves, or explanations of invalid move types)
export class Move {
    #number; // Move number in current game.
    #player; // Number of player who made the move.
    #row;
    #col;
    #outcome; // Result of the game.
    #currentStatus; // Current game status prompt provided to the LLM.
    #response; // Response from the LLM.

    constructor(number, player, row, col, outcome, currentStatus, response) {
        this.#number = number;
        this.#player = player;
        this.#row = row;
        this.#col = col;
        this.#outcome = outcome;
        this.#currentStatus = currentStatus;
        this.#response = response;
    }

    // Getter methods which return values. These are needed because the value are private and thus cannot be directly
    // accessed.
    getNumber() {
        return this.#number;
    }
    getPlayer() {
        return this.#player;
    }
    getRow() {
        return this.#row;
    }
    getCol() {
        return this.#col;
    }
    getOutcome() {
        return this.#outcome;
    }
    getCurrentStatus() {
        return this.#currentStatus;
    }
    getResponse() {
        return this.#response;
    }
}

// 'Model' class which contains the model's type (company), name, API key, URL, and whether it supports images.
export class Model {
    #type; // Model type, such as "OpenAI", "Google", or "AWS Bedrock".
    #name; // Name of the model, such as "gpt-4-turbo".
    #url; // URL for the model. NOTE: Google models do not require a URL.
    #apiKey; // API Key for the model.
    #supportsTextInput; // Flag indicating whether the model supports text-based input (prompts).
    #supportsImageInput; // Flag indicating whether the model supports text-based input (prompts).

    constructor(type, name, url, apiKey, supportsTextInput, supportsImageInput) {
        this.#type = type;
        this.#name = name;
        this.#url = url;
        this.#apiKey = apiKey;
        this.#supportsTextInput = supportsTextInput;
        this.#supportsImageInput = supportsImageInput;
    }

    getType() {
        return this.#type;
    }
    getName() {
        return this.#name;
    }
    getUrl() {
        return this.#url;
    }
    getApiKey() {
        return this.#apiKey;
    }
    getSupportsTextInput() {
        return this.#supportsTextInput;
    }
    getSupportsImageInput() {
        return this.#supportsImageInput;
    }

    // Setter methods which set values which can not be set directly.
    setUrl(url) {
        this.#url = url;
    }
    setApiKey(apiKey) {
        this.#apiKey = apiKey;
    }
}

// 'GameLogFiles' class which contains a text file, JSON file, a CSV file with game information, and another CSV file with move information.
export class GameLogFiles {
    #textFileName;
    #textFileContent;
    #jsonFileName;
    #jsonFileContent;
    #csvFileName;
    #csvFileContent;
    #movesCsvFileName;
    #movesCsvFileContent;

    constructor(textFileName, textFileContent, jsonFileName, jsonFileContent, csvFileName, csvFileContent, movesCsvFileName, movesCsvFileContent) {
        this.#textFileName = textFileName;
        this.#textFileContent = textFileContent;
        this.#jsonFileName = jsonFileName;
        this.#jsonFileContent = jsonFileContent;
        this.#csvFileName = csvFileName;
        this.#csvFileContent = csvFileContent;
        this.#movesCsvFileName = movesCsvFileName;
        this.#movesCsvFileContent = movesCsvFileContent;
    }

    getTextFileName() {
        return this.#textFileName;
    }
    getTextFileContent() {
        return this.#textFileContent;
    }
    getJsonFileName() {
        return this.#jsonFileName;
    }
    getJsonFileContent() {
        return this.#jsonFileContent;
    }
    getCsvFileName() {
        return this.#csvFileName;
    }
    getCsvFileContent() {
        return this.#csvFileContent;
    }
    getMovesCsvFileName() {
        return this.#movesCsvFileName;
    }
    getMovesCsvFileContent() {
        return this.#movesCsvFileContent;
    }
}