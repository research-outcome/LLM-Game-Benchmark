document.getElementById('openAllDataBtn').addEventListener('click', function() {
    document.getElementById('allDataFileInput').click();
});

document.getElementById('openReceivedSubmissionsBtn').addEventListener('click', function() {
    document.getElementById('receivedSubmissionsFileInput').click();
});

let allDataJSON = [];
let receivedSubmissionsJSON = [];

function validateData(jsonData) {
    const requiredFields = [
        'GameType', 'PromptType','PromptVersion', 'LLM1stPlayer', 'LLM2ndPlayer', 'WinRatio-1st',
        'WinRatio-2nd', 'Wins-1st', 'Wins-2nd', 'Disqualifications-1st',
        'Disqualifications-2nd', 'Draws', 'InvalidMovesRatio-1st',
        'InvalidMovesRatio-2nd', 'TotalMoves-1st', 'TotalMoves-2nd',
        'ProviderEmail', 'DateTime', 'UUID'
    ];

    return jsonData.every(entry => requiredFields.every(field => field in entry));
}

function handleFileInput(event, jsonStorage, textAreaId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (!validateData(jsonData)) {
                    alert("The uploaded file does not contain all required fields.");
                    event.target.value = ''; // Reset the input after alert
                    return; // Stop further execution
                }
                jsonStorage.splice(0, jsonStorage.length, ...jsonData); // Clear and update the original array
                document.getElementById(textAreaId).value = JSON.stringify(jsonData, null, 2);
                console.log("Loaded JSON:", jsonData);
            } catch (error) {
                alert("Error parsing JSON file: " + error.message);
                event.target.value = ''; // Reset the input after alert
            }
            event.target.value = ''; // Reset the input after successful load
        };
        reader.readAsText(file);
    } else {
        event.target.value = ''; // Reset the input if no file was selected
    }
}

document.getElementById('allDataFileInput').addEventListener('change', function(event) {
    handleFileInput(event, allDataJSON, 'allDataTextArea');
});

document.getElementById('receivedSubmissionsFileInput').addEventListener('change', function(event) {
    handleFileInput(event, receivedSubmissionsJSON, 'receivedSubmissionsTextArea');
});

function mergeAndRecalculate(allData, newSubmission) {
    const existingIndex = allData.findIndex(item =>
        item.GameType === newSubmission.GameType &&
        item.PromptType === newSubmission.PromptType &&
        item.PromptVersion === newSubmission.PromptVersion &&
        item.LLM1stPlayer === newSubmission.LLM1stPlayer &&
        item.LLM2ndPlayer === newSubmission.LLM2ndPlayer
    );

    if (existingIndex !== -1) {
        const existingData = allData[existingIndex];

        // Update Wins and Draws
        existingData["Wins-1st"] = Number(existingData["Wins-1st"]) + Number(newSubmission["Wins-1st"]);
        existingData["Wins-2nd"] = Number(existingData["Wins-2nd"]) + Number(newSubmission["Wins-2nd"]);
        existingData.Draws = Number(existingData.Draws) + Number(newSubmission.Draws);

        // Update Disqualifications
        existingData["Disqualifications-1st"] = Number(existingData["Disqualifications-1st"]) + Number(newSubmission["Disqualifications-1st"]);
        existingData["Disqualifications-2nd"] = Number(existingData["Disqualifications-2nd"]) + Number(newSubmission["Disqualifications-2nd"]);

        // Calculate total games
        const totalGames = Number(existingData["Wins-1st"]) + Number(existingData["Wins-2nd"]) + Number(existingData.Draws);

        // Recalculate Win Ratios
        existingData["WinRatio-1st"] = Number(existingData["Wins-1st"]) / totalGames;
        existingData["WinRatio-2nd"] = Number(existingData["Wins-2nd"]) / totalGames;

        // Recalculate Invalid Moves Ratios
        const totalInvalidMoves1st = (Number(existingData["InvalidMovesRatio-1st"]) * Number(existingData["TotalMoves-1st"])) + (Number(newSubmission["InvalidMovesRatio-1st"]) * Number(newSubmission["TotalMoves-1st"]));
        const totalInvalidMoves2nd = (Number(existingData["InvalidMovesRatio-2nd"]) * Number(existingData["TotalMoves-2nd"])) + (Number(newSubmission["InvalidMovesRatio-2nd"]) * Number(newSubmission["TotalMoves-2nd"]));
        const totalMoves1st = Number(existingData["TotalMoves-1st"]) + Number(newSubmission["TotalMoves-1st"]);
        const totalMoves2nd = Number(existingData["TotalMoves-2nd"]) + Number(newSubmission["TotalMoves-2nd"]);

        existingData["InvalidMovesRatio-1st"] = totalInvalidMoves1st / totalMoves1st;
        existingData["InvalidMovesRatio-2nd"] = totalInvalidMoves2nd / totalMoves2nd;

        // Update Total Moves
        existingData["TotalMoves-1st"] = totalMoves1st;
        existingData["TotalMoves-2nd"] = totalMoves2nd;

        // Update ProviderEmail by adding new emails if they don't already exist
        let emails = new Set(existingData.ProviderEmail.split(', ').concat(newSubmission.ProviderEmail.split(', ')));
        existingData.ProviderEmail = Array.from(emails).join(', ');

        // Handle multiple submission dates and UUIDs
        let dates = new Set(existingData.DateTime.split(', ').concat(newSubmission.DateTime.split(', ')));
        existingData.DateTime = Array.from(dates).join(', ');

        let uuids = new Set(existingData.UUID.split(', ').concat(newSubmission.UUID.split(', ')));
        existingData.UUID = Array.from(uuids).join(', ');

        allData[existingIndex] = existingData;
    } else {
        // Add new submission as a new object
        allData.push(newSubmission);
    }
}

document.getElementById('mergeAndDownloadBtn').addEventListener('click', function() {
    if (allDataJSON.length === 0 || receivedSubmissionsJSON.length === 0) {
        alert("Please upload both JSON files before merging.");
        return;
    }

    // Assuming receivedSubmissionsJSON contains only one object
    receivedSubmissionsJSON.forEach(submission => mergeAndRecalculate(allDataJSON, submission));

    const mergedJSONBlob = new Blob([JSON.stringify(allDataJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(mergedJSONBlob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged_data.json';
    a.click();
    URL.revokeObjectURL(url);
    alert("Files merged and downloaded successfully.");

     //after files are merged reset the state
     allDataJSON = [];
     receivedSubmissionsJSON = []
     document.getElementById('allDataTextArea').value = '';
     document.getElementById('receivedSubmissionsTextArea').value = ''; 
     document.getElementById('allDataFileInput').value = '';
     document.getElementById('receivedSubmissionsFileInput').value = '';
});
