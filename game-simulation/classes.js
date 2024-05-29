// 'Move' class which contains the LLM name and move outcome ("Y" for valid moves, or explanations of invalid move types)
export class Move {
    #number;
    #player;
    #row;
    #col;
    #outcome;
    #currentStatus;
    #response;

    constructor(number, player, row, col, outcome, currentStatus, response) {
        this.#number = number;
        this.#player = player;
        this.#row = row;
        this.#col = col;
        this.#outcome = outcome;
        this.#currentStatus = currentStatus;
        this.#response = response;
    }

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
    #type;
    #name;
    #url;
    #apiKey;
    #supportsTextInput;
    #supportsImageInput;

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

    setUrl(url) {
        this.#url = url;
    }
    setApiKey(apiKey) {
        this.#apiKey = apiKey;
    }
}

// 'GameLogFiles' class which contains a text file, JSON file, and CSV file with game information.
export class GameLogFiles {
    #textFileName;
    #textFileContent;
    #jsonFileName;
    #jsonFileContent;
    #csvFileName;
    #csvFileContent;

    constructor(textFileName, textFileContent, jsonFileName, jsonFileContent, csvFileName, csvFileContent) {
        this.#textFileName = textFileName;
        this.#textFileContent = textFileContent;
        this.#jsonFileName = jsonFileName;
        this.#jsonFileContent = jsonFileContent;
        this.#csvFileName = csvFileName;
        this.#csvFileContent = csvFileContent;
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
}