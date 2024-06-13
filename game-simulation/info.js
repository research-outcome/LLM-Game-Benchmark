// URLs for JSON data
const gameDetailsURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/gameDetails.json';
const promptListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/promptList.json';
const LLMListURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/LLMlist.json';
const faqURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/FAQs.json';

// Function to fetch JSON data
async function fetchJSON(url) {
    const response = await fetch(url);
    return await response.json();
}

// Function to populate the Game Details table
export function populateGameDetailsTable() {
    const tableBody = document.querySelector("#gameDetailsTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    fetchJSON(gameDetailsURL).then(data => {
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
        document.getElementById("gameDetailsPopup").style.display = "block";
    });
}

// Function to populate the prompt table
export function populatePromptTable() {
    const tableBody = document.querySelector("#promptTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    fetchJSON(promptListURL).then(data => {
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
        document.getElementById("promptListPopup").style.display = "block";
    });
}

// Function to populate the LLM table
export function populateLLMTable() {
    const tableBody = document.querySelector("#LLMTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    fetchJSON(LLMListURL).then(data => {
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
        document.getElementById("LLMListPopup").style.display = "block";
    });
}

// Function to populate the FAQ table
export function populateFAQTable() {
    const tableBody = document.querySelector("#faqTable tbody");
    tableBody.innerHTML = ''; // Clear existing rows

    fetchJSON(faqURL).then(data => {
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
        document.getElementById("faqPopup").style.display = "block";
    });
}

// Function to populate the User Guide pop up data
// Function to populate the User Guide pop up data
export function populateUserGuide() {
    // Example data for demonstration
    const data = {
        title: "How to Run the Game Simulation",
        description: `
            <p>Please follow the steps outlined below to run the game simulation:</p>
            <ol>
                <li>Select game type.</li>
                <li>Select prompt type.</li>
                <li>Select LLM for 1st and 2nd player.</li>
                <li>Enter the number of games to be played.</li>
                <li>The progress during the game (the current status after each move) can be displayed as a list, illustration, or image.</li>
                <li>Select 'Run' or 'Bulk' ('Bulk Run' button makes all the LLM's in the list of players compete against each other).</li>
                <li>Choose the 'results' file destination when the games are done (results automatically download when the games are completed).</li>
                <li>The results include files for submission to the leaderboard and several other files for further analysis of the games.</li>
            </ol>
            <p>Below is a video demonstration of the steps:</p>
        `,
        addLLMTitle: "How to Add a LLM",
        addLLMSteps: `
            <p>Please follow the steps outlined below to add a LLM:</p>
            <ol>
                <li>Select ‘Manage LLMs’.</li>
                <li>Add the email you would like displayed on the leaderboard.</li>
                <li>Choose LLM type & model.</li>
                <li>Enter your API key.</li>
                <li>You can implement your own AWS Bedrock web service using the sample code provided in the 'webservice' folder of the GitHub repository.</li>
                <li>By selecting ‘Other’, you can implement your own web service for a new LLM. You will need to adjust/implement the code in the web-service.js file.</li>
                <li>You can now use the benchmark with the LLM you added.</li>
            </ol>
             <p>Below is a video demonstration of the steps:</p>
        `
    };

    const titleElement = document.getElementById('userGuideTitle');
    const descriptionElement = document.getElementById('userGuideDescription');
    const addLLMTitleElement = document.getElementById('userGuideAddLLMTitle');
    const addLLMStepsElement = document.getElementById('userGuideAddLLMSteps');

    titleElement.textContent = data.title;
    descriptionElement.innerHTML = data.description;
    addLLMTitleElement.textContent = data.addLLMTitle;
    addLLMStepsElement.innerHTML = data.addLLMSteps;

    document.getElementById("userGuidePopup").style.display = "block";
}