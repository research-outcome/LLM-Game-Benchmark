import { Model } from "./classes.js";

let models = []; // Array to store models.
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

// Update URL of a model in the model list.
function updateUrl(urlInputId) {
    let updatedUrl = document.getElementById(urlInputId).value;
    let index = urlInputId.slice(8) // Remove "llm-url-" from ID. We just want to retrieve the index of the model to update.
    models[index].setUrl(updatedUrl);
}

// Update API Key of a model in the model list.
function updateApiKey(apiKeyInputId) {
    let updatedApiKey = document.getElementById(apiKeyInputId).value;
    let index = apiKeyInputId.slice(12) // Remove "llm-api-key-" from ID. We just want to retrieve the index of the model to update.
    models[index].setApiKey(updatedApiKey);
}

// Add a model to the list of models available for gameplay and update the LLM dropdowns accordingly.
export function addModel(predefinedModel) {
    // If the given model is a predefined model in the "game-simulation.js" file, add it accordingly.
    if (predefinedModel) {
        models.push(predefinedModel);
        updateModelLists();
        return;
    }

    let modelType = document.getElementById("llm-type").value;
    let modelName = document.getElementById("llm-name").value;
    let modelApiKey = document.getElementById("llm-api-key").value;
    let modelUrl;

    // OpenAI model URL is the same for all models.
    if (modelType === "OpenAI") {
        modelUrl = OPENAI_URL;
    }
    // Google models do not require a URL field.
    else if (modelType === "Google") {
        modelUrl = "URL is not needed since it is handled by the library.";
    }
    // Other models will require the user to enter the URL manually.
    else {
        modelUrl = document.getElementById("llm-url").value
    }

    let supportsTextInput;
    // If model is a predefined model, check if model supports images. If model is a user-defined model ("Other" type), get the value of the "supports text" input field.
    if (modelType !== "Other") {
        supportsTextInput = modelSupportsText(modelName);
    } else {
        supportsTextInput = document.getElementById("llm-supports-text").value;
    }

    let supportsImageInput;
    // If model is a predefined model, check if model supports images. If model is a user-defined model ("Other" type), get the value of the "supports images" input field.
    if (modelType !== "Other") {
        supportsImageInput = modelSupportsImages(modelName);
    } else {
        supportsImageInput = document.getElementById("llm-supports-images").value;
    }

    // Construct Model object with attributes initialized above.
    let model = new Model(
        modelType,
        modelName,
        modelUrl,
        modelApiKey,
        supportsTextInput,
        supportsImageInput
    );

    // If this model already exists in the model list, do not add it; alert the user.
    if (checkForDuplicateModel(model)) {
        alert("Model already exists.");
        return;
    }
    // If the model's name was left empty, do not add it; alert the user.
    if (modelName === "") {
        alert("Model name is empty.");
        return;
    }
    // If the model's URL was left empty (and it is not a Google model which does not require a URL) do not add it; alert the user.
    if (modelUrl === "" && modelType !== "Google") {
        alert("Model URL is empty.");
        return;
    }
    // If the model's API key was left empty, do not add it; alert the user.
    if (modelApiKey === "") {
        alert("Model API key is empty.");
        return;
    }

    // If model passed all checks, add it to the model list and update the model lists (table and player dropdowns).
    models.push(model);
    updateModelLists();
}

// Show a popup which asks the user if they are sure they would like to delete a model.
function confirmRemoveModel(buttonId) {
    let index = buttonId.slice(15); // Remove "remove-btn-id-" from ID. We just want to retrieve the index of the model to remove.
    document.getElementById("confirm-removal-popup-container").style.display = "inline-block";
    document.getElementById("confirm-removal-popup").style.display = "inline-block";
    document.getElementById("confirm-removal-btn").addEventListener("click", function () {
        removeModel(index);
    });
}

// Remove a model from the model list, hide the "confirm model removal" popup and update the model lists.
function removeModel(index) {
    document.getElementById("confirm-removal-popup-container").style.display = "none";
    document.getElementById("confirm-removal-popup").style.display = "none";

    // Replace confirm removal popups to clear event listeners and prevent repeated deletion of models.
    document.getElementById("confirm-removal-button-container").innerHTML = "<button id=\"confirm-removal-btn\">Yes</button>" +
        "<button id=\"cancel-removal-btn\">Cancel</button>";
    document.getElementById("cancel-removal-btn").addEventListener("click", function () {
        document.getElementById("confirm-removal-button-container").innerHTML = "<button id=\"confirm-removal-btn\">Yes</button>" +
            "<button id=\"cancel-removal-btn\">Cancel</button>";
        document.getElementById("confirm-removal-popup-container").style.display = "none";
        document.getElementById("confirm-removal-popup").style.display = "none";
    })

    // Remove matching model from model list and update model lists (table and player dropdowns).
    models.splice(index, 1);
    updateModelLists();
}

// If the current model name supports text, return true.
function modelSupportsText(modelName) {
    // "gemini-pro-vision" is the only predefined model that does NOT support text input without an image component.
    return modelName !== "gemini-pro-vision";
}

// If the current model name supports images, return true.
function modelSupportsImages(modelName) {
    return modelName === "gpt-4-turbo" ||
        modelName === "gpt-4o" ||
        modelName === "gemini-1.5-pro" ||
        modelName === "gemini-1.5-flash" ||
        modelName === "gemini-pro-vision" ||
        modelName === "anthropic.claude-3-sonnet-20240229-v1:0" ||
        modelName === "anthropic.claude-3-haiku-20240307-v1:0";
}

// Update "Add/Edit LLMs" options depending on which type (company) is selected.
export function updateAddModelFields(event) {
    if (event.target.value === "OpenAI") { // List LLM options for OpenAI.
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
                "<option value=\"gpt-3.5-turbo\">gpt-3.5-turbo</option>" +
                "<option value=\"gpt-4\">gpt-4</option>" +
                "<option value=\"gpt-4-turbo\">gpt-4-turbo</option>" +
                "<option value=\"gpt-4o\">gpt-4o</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "none";
        document.getElementById("llm-url").style.display = "none";
        document.getElementById("llm-supports-text-label").style.display = "none";
        document.getElementById("llm-supports-text").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";
        document.getElementById("llm-supports-images").style.display = "none";
    }
    else if (event.target.value === "Google") {
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
                "<option value=\"gemini-pro\">gemini-pro</option>" +
                "<option value=\"gemini-1.5-pro\">gemini-1.5-pro</option>" +
                "<option value=\"gemini-1.5-flash\">gemini-1.5-flash</option>" +
                "<option value=\"gemini-pro-vision\">gemini-pro-vision</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "none";
        document.getElementById("llm-url").style.display = "none";
        document.getElementById("llm-supports-text-label").style.display = "none";
        document.getElementById("llm-supports-text").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";
        document.getElementById("llm-supports-images").style.display = "none";
    }
    else if (event.target.value === "AWS Bedrock") {
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
                "<option value=\"meta.llama3-70b-instruct-v1:0\">meta.llama3-70b-instruct-v1:0</option>" +
                "<option value=\"meta.llama3-8b-instruct-v1:0\">meta.llama3-8b-instruct-v1:0</option>" +
                "<option value=\"anthropic.claude-v2\">anthropic.claude-v2</option>" +
                "<option value=\"anthropic.claude-v2:1\">anthropic.claude-v2:1</option>" +
                "<option value=\"anthropic.claude-3-sonnet-20240229-v1:0\">anthropic.claude-3-sonnet-20240229-v1:0</option>" +
                "<option value=\"anthropic.claude-3-haiku-20240307-v1:0\">anthropic.claude-3-haiku-20240307-v1:0</option>" +
                "<option value=\"mistral.mistral-large-2402-v1:0\">mistral.mistral-large-2402-v1:0</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "inline";
        document.getElementById("llm-url").style.display = "inline";
        document.getElementById("llm-supports-text-label").style.display = "none";
        document.getElementById("llm-supports-text").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";
        document.getElementById("llm-supports-images").style.display = "none";

    }
    else if (event.target.value === "Other") {
        document.getElementById("llm-name-container").innerHTML = "<input type=\"text\" id=\"llm-name\" name=\"llm-name\">";
        document.getElementById("llm-url-label").style.display = "inline";
        document.getElementById("llm-url").style.display = "inline";
        document.getElementById("llm-supports-text-label").style.display = "inline";
        document.getElementById("llm-supports-text").style.display = "inline";
        document.getElementById("llm-supports-images-label").style.display = "inline";
        document.getElementById("llm-supports-images").style.display = "inline";
    }
}

// Update "Add/Edit LLMs" table and "Player" dropdowns with current model list.
export function updateModelLists() {
    // Write table header.
    document.getElementById("llm-table-body").innerHTML = "<div class=\"llm-table-row\">" +
            "<div class=\"llm-table-header llm-table-cell\">Type</div>" +
            "<div class=\"llm-table-header llm-table-cell\">Name</div>" +
            "<div class=\"llm-table-header llm-table-cell\">URL</div>" +
            "<div class=\"llm-table-header llm-table-cell\">API Key</div>" +
            "<div class=\"llm-table-header llm-table-cell\">Supports Text?</div>" +
            "<div class=\"llm-table-header llm-table-cell\">Supports Images?</div>" +
            "<div class=\"llm-table-header llm-table-cell\"><!-- Placeholder column for 'X' buttons --></div>" +
        "</div>";

    // Append a table row with every LLM in the model list, and update dropdowns.
    document.getElementById("first-player").innerHTML = "";
    document.getElementById("second-player").innerHTML = "";
    let index = 0;
    for (let model of models) {
        document.getElementById("llm-table-body").innerHTML += "<div class=\"llm-table-row\">\n" +
                "<div class=\"llm-table-cell\">" + model.getType() + "</div>" +
                "<div class=\"llm-table-cell\">" + model.getName() + "</div>" +
                "<div class=\"llm-table-cell\"><input class=\"llm-url\" type=\"text\" value=\"" + model.getUrl() + "\" id=\"llm-url-" + index + "\"></div>" +
                "<div class=\"llm-table-cell\"><input class=\"llm-api-key\" type=\"text\" value=\"" + model.getApiKey() + "\" id=\"llm-api-key-" + index + "\"></div>" +
                "<div class=\"llm-table-cell\">" + model.getSupportsTextInput() + "</div>" +
                "<div class=\"llm-table-cell\">" + model.getSupportsImageInput() + "</div>" +
                "<button class=\"remove-llm-btn\" id=\"remove-llm-btn-" + index + "\">X</button>" +
            "</div>";

        index++;
    }

    // Update '1st Player' and '2nd' Player dropdowns with new model.
    updatePlayerDropdowns();

    // Add event listeners for URL input fields in table.
    for (let urlInputField of document.getElementsByClassName("llm-url")) {
        urlInputField.addEventListener("change", (event) => {
            updateUrl(event.target.id);
        });
    }

    // Add event listeners for API key input fields in table.
    for (let apiKeyInputField of document.getElementsByClassName("llm-api-key")) {
        apiKeyInputField.addEventListener("change", (event) => {
            updateApiKey(event.target.id);
        });
    }

    // Add event listeners for newly-added buttons.
    for (let removeButton of document.getElementsByClassName("remove-llm-btn")) {
        removeButton.addEventListener("click", (event) => {
            confirmRemoveModel(event.target.id);
        });
    }
}

// Return a model object for the given player number.
export function getCurrentModel(currentPlayer) {
    return (currentPlayer === 1) ? getModelWithName(document.getElementById("first-player").value) : getModelWithName(document.getElementById("second-player").value);
}

// Iterate through the model list and return the model object with the given name.
function getModelWithName(name) {
    for (let model of models) {
        if (model.getName() === name) {
            return model;
        }
    }
}

// Update the available LLMs in the LLM player dropdowns depending on the prompt type.
export function updatePlayerDropdowns() {
    let promptType = document.getElementById("prompt-type").value;
    document.getElementById("first-player").innerHTML = "";
    document.getElementById("second-player").innerHTML = "";

    // If the selected prompt type is a text-based prompt, update the model list accordingly.
    if (promptType === "list" || promptType === "illustration") {
        for (let model of models) {
            if (model.getSupportsTextInput()) {
                document.getElementById("first-player").innerHTML +=
                    "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
                document.getElementById("second-player").innerHTML +=
                    "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
            }
        }
    }
    // If the selected prompt type is an image-based prompt, update the model list accordingly.
    else if (promptType === "image") {
        for (let model of models) {
            if (model.getSupportsImageInput()) {
                document.getElementById("first-player").innerHTML +=
                    "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
                document.getElementById("second-player").innerHTML +=
                    "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
            }
        }
    }
}

// Check if a model with the given type and name already exists in the model list.
function checkForDuplicateModel(model) {
    for (let existingModel of models) {
        if (model.getType() === existingModel.getType() && model.getName() === existingModel.getName()) {
            return true;
        }
    }
    return false;
}

// Return "true" if one of the LLMs selected has an empty API key.
export function checkForEmptyApiKeys() {
    return getModelWithName(document.getElementById("first-player").value).getApiKey() === "" || getModelWithName(document.getElementById("second-player").value).getApiKey() === "";
}