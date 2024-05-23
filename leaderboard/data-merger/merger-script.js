document.getElementById('openAllDataBtn').addEventListener('click', function() {
    document.getElementById('allDataFileInput').click();
});

document.getElementById('openReceivedSubmissionsBtn').addEventListener('click', function() {
    document.getElementById('receivedSubmissionsFileInput').click();
});

let allDataJSON = [];
let receivedSubmissionsJSON = [];

document.getElementById('allDataFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                allDataJSON = JSON.parse(e.target.result);
                document.getElementById('allDataTextArea').value = JSON.stringify(allDataJSON, null, 2);
                console.log("All Data JSON:", allDataJSON);
            } catch (error) {
                alert("Error parsing All Data JSON file");
            }
        };
        reader.readAsText(file);
    }
});

document.getElementById('receivedSubmissionsFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                receivedSubmissionsJSON = JSON.parse(e.target.result);
                document.getElementById('receivedSubmissionsTextArea').value = JSON.stringify(receivedSubmissionsJSON, null, 2);
                console.log("Received Submissions JSON:", receivedSubmissionsJSON);
            } catch (error) {
                alert("Error parsing Received Submissions JSON file");
            }
        };
        reader.readAsText(file);
    }
});

function mergeAndRecalculate(allData, newSubmission) {
    const existingIndex = allData.findIndex(item =>
        item.GameType === newSubmission.GameType &&
        item.Prompt === newSubmission.Prompt &&
        item.LLM1stPlayer === newSubmission.LLM1stPlayer &&
        item.LLM2ndPlayer === newSubmission.LLM2ndPlayer
    );

    if (existingIndex !== -1) {
        const existingData = allData[existingIndex];

        // Update Wins and Draws
        existingData["Wins-1st"] += newSubmission["Wins-1st"];
        existingData["Wins-2nd"] += newSubmission["Wins-2nd"];
        existingData.Draws += newSubmission.Draws;

        // Update Disqualifications
        existingData["Disqualifications-1st"] += newSubmission["Disqualifications-1st"];
        existingData["Disqualifications-2nd"] += newSubmission["Disqualifications-2nd"];

        // Calculate total games
        const totalGames = existingData["Wins-1st"] + existingData["Wins-2nd"] + existingData.Draws;

        // Recalculate Win Ratios
        existingData["WinRatio-1st"] = (existingData["Wins-1st"] / totalGames).toFixed(2);
        existingData["WinRatio-2nd"] = (existingData["Wins-2nd"] / totalGames).toFixed(2);

        // Recalculate Invalid Moves Ratios
        const totalInvalidMoves1st = (existingData["InvalidMovesRatio-1st"] * existingData["TotalMoves-1st"]) + (newSubmission["InvalidMovesRatio-1st"] * newSubmission["TotalMoves-1st"]);
        const totalInvalidMoves2nd = (existingData["InvalidMovesRatio-2nd"] * existingData["TotalMoves-2nd"]) + (newSubmission["InvalidMovesRatio-2nd"] * newSubmission["TotalMoves-2nd"]);
        const totalMoves1st = existingData["TotalMoves-1st"] + newSubmission["TotalMoves-1st"];
        const totalMoves2nd = existingData["TotalMoves-2nd"] + newSubmission["TotalMoves-2nd"];
        existingData["InvalidMovesRatio-1st"] = (totalInvalidMoves1st / totalMoves1st).toFixed(2);
        existingData["InvalidMovesRatio-2nd"] = (totalInvalidMoves2nd / totalMoves2nd).toFixed(2);

        // Update Total Moves
        existingData["TotalMoves-1st"] = totalMoves1st;
        existingData["TotalMoves-2nd"] = totalMoves2nd;

        // Update ProviderEmail by adding new emails if they don't already exist
        let emails = new Set(existingData.ProviderEmail.split(', ').concat(newSubmission.ProviderEmail.split(', ')));
        existingData.ProviderEmail = Array.from(emails).join(', ');

        // Handle multiple submission dates and UUIDs
        let dates = new Set(existingData.SubmissionDate.split(', ').concat(newSubmission.SubmissionDate.split(', ')));
        existingData.SubmissionDate = Array.from(dates).join(', ');

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
