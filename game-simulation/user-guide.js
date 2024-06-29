document.addEventListener('DOMContentLoaded', function() {
    // Example data for demonstration
    const data = {
        title: "Running The Game Simulation",
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
        addLLMTitle: "Adding an LLM",
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
});
