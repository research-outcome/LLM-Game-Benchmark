let models = [];

function updateUrl(urlInputId) {
    let updatedUrl = document.getElementById(urlInputId).value;
    let index = urlInputId.slice(8) // Remove "llm-url-" from ID. We just want to retrieve the index of the model to update.
    console.log("Updating URL of model " + index + " to " + updatedUrl);
    models[index].setUrl(updatedUrl);
}

function updateApiKey(apiKeyInputId) {
    let updatedApiKey = document.getElementById(apiKeyInputId).value;
    let index = apiKeyInputId.slice(12) // Remove "llm-api-key-" from ID. We just want to retrieve the index of the model to update.
    console.log("Updating API Key of model " + index + " to " + updatedApiKey);
    models[index].setApiKey(updatedApiKey);
}

// Add a model to the list of models available for gameplay and update the LLM dropdowns accordingly.
export function addModel(model) {
    models.push(model);
    updateModelLists();
}

function confirmRemoveModel(buttonId) {
    let index = buttonId.slice(15); // Remove "remove-btn-id-" from ID. We just want to retrieve the index of the model to remove.
    document.getElementById("confirm-removal-popup-container").style.display = "inline-block";
    document.getElementById("confirm-removal-popup").style.display = "inline-block";
    document.getElementById("confirm-removal-btn").addEventListener("click", function () {
        removeModel(index);
    });
}

function removeModel(index) {
    console.log("Removing model " + index);
    document.getElementById("confirm-removal-popup-container").style.display = "none";
    document.getElementById("confirm-removal-popup").style.display = "none";
    document.getElementById("confirm-removal-btn").removeEventListener("click", function () {
        removeModel(index);
    });
    models.splice(index, 1); // Remove matching model from models array.
    updateModelLists();
}

// If the current model name supports images, return true.
export function modelSupportsImages(modelName) {
    return modelName === "gpt-4-turbo" ||
        modelName === "gpt-4o" ||
        modelName === "gemini-pro-vision" ||
        modelName === "anthropic.claude-3-sonnet-20240229-v1:0" ||
        modelName === "anthropic.claude-3-haiku-20240307-v1:0";
}

// Update "Add/Edit LLMs" options depending on which type (company) is selected.
export function updateAddModelFields(event) {
    if (event.target.value === "OpenAI") {
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
            "<option value=\"gpt-3.5-turbo\">gpt-3.5-turbo</option>" +
            "<option value=\"gpt-4\">gpt-4</option>" +
            "<option value=\"gpt-4-turbo\">gpt-4-turbo</option>" +
            "<option value=\"gpt-4o\">gpt-4o</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "none";
        document.getElementById("llm-url").style.display = "none";
        document.getElementById("llm-supports-images").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";
    }
    else if (event.target.value === "Google") {
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
            "<option value=\"gemini-pro\">gemini-pro</option>" +
            "<option value=\"gemini-pro-vision\">gemini-pro-vision</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "none";
        document.getElementById("llm-url").style.display = "none";
        document.getElementById("llm-supports-images").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";
    }
    else if (event.target.value === "AWS Bedrock") {
        document.getElementById("llm-name-container").innerHTML = "<select id=\"llm-name\">" +
            "<option value=\"meta.llama2-13b-chat-v1\">meta.llama2-13b-chat-v1</option>" +
            "<option value=\"meta.llama2-70b-chat-v1\">meta.llama2-70b-chat-v1</option>" +
            "<option value=\"meta.llama3-70b-instruct-v1:0\">meta.llama3-70b-instruct-v1:0</option>" +
            "<option value=\"meta.llama3-8b-instruct-v1:0\">meta.llama3-8b-instruct-v1:0</option>" +
            "<option value=\"anthropic.claude-v2\">anthropic.claude-v2</option>" +
            "<option value=\"anthropic.claude-v2:1\">anthropic.claude-v2:1</option>" +
            "<option value=\"anthropic.claude-3-sonnet-20240229-v1:0\">anthropic.claude-3-sonnet-20240229-v1:0</option>" +
            "<option value=\"anthropic.claude-3-haiku-20240307-v1:0\">anthropic.claude-3-haiku-20240307-v1:0</option>" +
            "<option value=\"mistral.mistral-large-2402-v1:0\">mistral.mistral-large-2402-v1:0</option>" +
            "<option value=\"ai21.j2-ultra-v1\">ai21.j2-ultra-v1</option>" +
            "</select>";

        document.getElementById("llm-url-label").style.display = "inline";
        document.getElementById("llm-url").style.display = "inline";
        document.getElementById("llm-supports-images").style.display = "none";
        document.getElementById("llm-supports-images-label").style.display = "none";

    }
    else if (event.target.value === "Other") {
        document.getElementById("llm-name-container").innerHTML = "<input type=\"text\" id=\"llm-name\" name=\"llm-name\">";
        document.getElementById("llm-url-label").style.display = "inline";
        document.getElementById("llm-url").style.display = "inline";
        document.getElementById("llm-supports-images").style.display = "inline";
        document.getElementById("llm-supports-images-label").style.display = "inline";
    }
}

// Update "Add/Edit LLMs" table and "1st/2nd Player LLM" dropdowns with current model list.
export function updateModelLists() {
    // Write table header.
    document.getElementById("llm-table-body").innerHTML = "<div class=\"llm-table-row\" id=\"llm-table-header\">" +
        "<div class=\"llm-table-cell\">Type</div>" +
        "<div class=\"llm-table-cell\">Name</div>" +
        "<div class=\"llm-table-cell\">URL</div>" +
        "<div class=\"llm-table-cell\">API Key</div>" +
        "<div class=\"llm-table-cell\">Supports Images?</div>" +
        "<div class=\"llm-table-cell\"></div>" +
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
            "<div class=\"llm-table-cell\">" + model.getSupportsImages() + "</div>" +
            "<button class=\"remove-llm-btn\" id=\"remove-llm-btn-" + index + "\">X</button>" +
            "</div>";

        document.getElementById("first-player").innerHTML +=
            "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";
        document.getElementById("second-player").innerHTML +=
            "<option value=\"" + model.getName() + "\">" + model.getName() + "</option>";

        index++;
    }

    // Add event listeners for URL input fields in table.
    for (let urlInputField of document.getElementsByClassName("llm-url")) {
        urlInputField.addEventListener("change", (event) => {
            updateUrl(event.target.id);
        });
    }

    // Add event listeners for
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

export function getCurrentModel(currentPlayer) {
    return (currentPlayer === 1) ? models[document.getElementById("first-player").selectedIndex] : models[document.getElementById("second-player").selectedIndex];
}

// If both LLMs selected by the user support images as input, allow it as an option in the "prompt type" field.
export function updatePromptTypeDropdowns() {
    if (models[document.getElementById("first-player").selectedIndex].getSupportsImages() && models[document.getElementById("second-player").selectedIndex].getSupportsImages()) {
        // gemini-pro-vision ONLY supports images, so if either selected model is gemini-pro-vision, the only possible prompt is 'image'.
        if (models[document.getElementById("first-player").selectedIndex].getName() === "gemini-pro-vision" || models[document.getElementById("second-player").selectedIndex].getName() === "gemini-pro-vision") {
            document.getElementById("prompt-type").innerHTML = "<option value=\"image\">Image</option>";
        }
        else {
            document.getElementById("prompt-type").innerHTML = "<option value=\"list\">List</option>" +
                "<option value=\"illustration\">Illustration</option>" +
                "<option value=\"image\">Image</option>";
        }
    }
    // If the selected models don't BOTH support images, and one of the models is gemini-vision-pro (which ONLY supports images), there are no prompt types available for this scenario.
    else if (models[document.getElementById("first-player").selectedIndex].getName() === "gemini-pro-vision" || models[document.getElementById("second-player").selectedIndex].getName() === "gemini-pro-vision") {
        document.getElementById("prompt-type").innerHTML = "";
    }
    // If the selected models don't BOTH support images, and neither selected model is gemini-pro-vision, only 'list' and 'illustration' prompts are available.
    else {
        document.getElementById("prompt-type").innerHTML = "<option value=\"list\">List</option>" +
            "<option value=\"illustration\">Illustration</option>";
    }
}

// Check if a model with the given type and name already exists in the model list.
export function checkForDuplicateModel(model) {
    for (let existingModel of models) {
        if (model.getType() === existingModel.getType() && model.getName() === existingModel.getName()) {
            return true;
        }
    }
    return false;
}

// Return "true" if one of the LLMs selected has an empty API key.
export function checkForEmptyApiKeys() {
    return models[document.getElementById("first-player").selectedIndex].getApiKey() === "" || models[document.getElementById("second-player").selectedIndex].getApiKey() === "";
}