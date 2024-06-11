// Function to fetch JSON data
export async function fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

// Function to populate the prompt table
export function populatePromptTable(data) {
    const tableBody = document.querySelector("#promptTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement("tr");

        const gameTypeCell = document.createElement("td");
        gameTypeCell.textContent = item["Game Type"];
        row.appendChild(gameTypeCell);

        const promptTypeCell = document.createElement("td");
        promptTypeCell.textContent = item["Prompt Type"];
        row.appendChild(promptTypeCell);

        const promptExampleCell = document.createElement("td");
        promptExampleCell.innerHTML = item["Prompt Example"];
        row.appendChild(promptExampleCell);

        tableBody.appendChild(row);
    });
}

// Function to populate the LLM table
export function populateLLMTable(data) {
    const tableBody = document.querySelector("#LLMTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement("tr");

        const companyCell = document.createElement("td");
        companyCell.textContent = item["Company"];
        row.appendChild(companyCell);

        const modelCell = document.createElement("td");
        modelCell.textContent = item["LLM Model"];
        row.appendChild(modelCell);

        const linkCell = document.createElement("td");
        const link = document.createElement("a");
        link.href = item["More Info"].startsWith("http") ? item["More Info"] : "http://" + item["More Info"];
        link.textContent = "More Info";
        link.target = "_blank"; // Open the link for more info in a new tab
        linkCell.appendChild(link);
        row.appendChild(linkCell);

        tableBody.appendChild(row);
    });
}

// Function to populate the Game Details table
export function populateGameDetailsTable(data) {
    const tableBody = document.querySelector("#gameDetailsTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement("tr");

        const gameTypeCell = document.createElement("td");
        gameTypeCell.textContent = item["Game type"];
        row.appendChild(gameTypeCell);

        const detailsCell = document.createElement("td");
        const detailsText = item["Details"];
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        // Split the details text to extract URLs and other text parts
        const parts = detailsText.split(urlRegex);

        parts.forEach(part => {
            if (urlRegex.test(part)) {
                // If the part is a URL, create a clickable link
                const link = document.createElement("a");
                link.href = part;
                link.textContent = part;
                link.target = "_blank"; // Open the link in a new tab
                detailsCell.appendChild(link);
            } else {
                // Otherwise, append the text part
                detailsCell.appendChild(document.createTextNode(part));
            }
        });

        row.appendChild(detailsCell);
        tableBody.appendChild(row);
    });
}

// Function to populate the FAQ table
export function populateFAQTable(data) {
    const tableBody = document.querySelector("#faqTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement("tr");

        const questionCell = document.createElement("td");
        questionCell.textContent = item["Question"];
        row.appendChild(questionCell);

        const answerCell = document.createElement("td");
        answerCell.textContent = item["Answer"];
        row.appendChild(answerCell);

        tableBody.appendChild(row);
    });
}

// Function to populate the User Guide pop up data
export function populateUserGuide(data) {
    const titleElement = document.getElementById('userGuideTitle');
    const descriptionElement = document.getElementById('userGuideDescription');

    titleElement.textContent = data.title; 
    descriptionElement.innerHTML = data.description;

    document.getElementById("userGuidePopup").style.display = "block";
}