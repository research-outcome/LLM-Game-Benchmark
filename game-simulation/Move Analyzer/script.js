function analyzeMoves() {
    const fileInput = document.getElementById('fileInput');
    const resultsContainer = document.getElementById('results');
    const bulkResultsContainer = document.getElementById('bulkResults');

    // Clear both previous results
    resultsContainer.innerHTML = '';
    bulkResultsContainer.innerHTML = '';

    if (fileInput.files.length === 0) {
        alert('Please upload a file!');
        return;
    }

    const file = fileInput.files[0];
    if (!file.name.endsWith('.json')) {
        alert('Invalid file type. Please upload a JSON file.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.Moves || !Array.isArray(data.Moves) || data.Moves.length === 0) {
                alert('Invalid JSON file. The JSON does not contain the required "Moves" array or it is empty.');
                return;
            }
            if (!data.Moves.every(move => move.hasOwnProperty('Row') && move.hasOwnProperty('Column') && move.hasOwnProperty('Player'))) {
                alert('Invalid JSON file. Not all moves have the required "Row", "Column", and "Player" properties.');
                return;
            }
            const analysisResults = performAnalysis(data);
            displayResults(analysisResults);
        } catch (error) {
            alert('Invalid file. There was an error processing your file. Please ensure it is a valid JSON.');
            console.error('Error reading or parsing the file:', error);
        }
    };

    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };

    reader.readAsText(file);
}

function bulkRun() {
    const bulkFileInput = document.getElementById('bulkFileInput');
    const resultsContainer = document.getElementById('results');
    const bulkResultsContainer = document.getElementById('bulkResults');

    // Clear both previous results
    resultsContainer.innerHTML = '';
    bulkResultsContainer.innerHTML = '';

    if (bulkFileInput.files.length === 0) {
        alert('Please upload files!');
        return;
    }

    const results = {};
    let processedFiles = 0;

    for (let i = 0; i < bulkFileInput.files.length; i++) {
        const file = bulkFileInput.files[i];
        if (!file.name.endsWith('.json')) {
            alert('Invalid file type. Please upload JSON files.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                analyzeBulkData(data, results);
                processedFiles++;

                if (processedFiles === bulkFileInput.files.length) {
                    displayBulkResults(results);
                }
            } catch (error) {
                alert('Invalid file. There was an error processing your file. Please ensure it is a valid JSON.');
                console.error('Error reading or parsing the file:', error);
            }
        };

        reader.onerror = function() {
            alert('Error reading the file. Please try again.');
        };

        reader.readAsText(file);
    }
}

function initializeBoard(rows, cols) {
    return Array.from(Array(rows), () => new Array(cols).fill(null));
}

function updateBoard(board, move) {
    const symbol = move.Player === 1 ? 'X' : 'O';
    const row = move.Row - 1;
    const col = move.Column - 1;
    board[row][col] = symbol;
    console.log(`Board updated at [${move.Row},${move.Column}] with ${symbol}`); // Logging the move with 1-based indexing
}

function performAnalysis(data) {
    const results = { missedWins: [], missedBlocks: [] };
    const board = initializeBoard(3, 3); // 3x3 board for Tic-Tac-Toe
    const potentialWinsMap = new Map(); // To track potential wins for each player

    let lastValidMoveIndex = -1; // Index of the last valid move
    let currentPlayerLastMoveIndex = { 1: -1, 2: -1 }; // Track the last valid move for each player

    data.Moves.forEach((move, index) => {
        if (move.Outcome !== "Valid") {
            console.log(`Skipping invalid move number ${move.MoveNumber} by Player ${move.Player}`);
            return; // Skip invalid moves
        }

        console.log(`Processing move number ${move.MoveNumber} by Player ${move.Player}`);
        console.log('Current board state before move:');
        console.table(board);

        // Check if the current move blocks any potential winning positions
        const opponentPlayer = move.Player === 1 ? 2 : 1;
        const opponentPotentialWins = checkTwoInARow(board, opponentPlayer);

        // Update the board with the current move
        updateBoard(board, move);
        console.log('Board state after move:');
        console.table(board);

        // Check if the current move resulted in a win
        const isWinningMove = canWin(board, move.Player);
        console.log(`Is move number ${move.MoveNumber} a winning move? ${isWinningMove}`);

        // Skip analysis for the last move
        if (index === data.Moves.length - 1) {
            return;
        }

        // Check for missed win opportunities for the previous turn of the current player
        const playerToCheck = move.Player;
        if (currentPlayerLastMoveIndex[playerToCheck] > -1 && !isWinningMove) {
            const previousPlayerMove = data.Moves[currentPlayerLastMoveIndex[playerToCheck]];
            const potentialWins = potentialWinsMap.get(playerToCheck);
            if (potentialWins && potentialWins.length > 0) {
                const missedWins = potentialWins.filter(pos => board[pos.row - 1][pos.col - 1] === null);
                if (missedWins.length > 0) {
                    results.missedWins.push(`Player ${playerToCheck} missed a chance to win at move number ${previousPlayerMove.MoveNumber + 2} by not placing at ${missedWins.map(pos => `[${pos.row},${pos.col}]`).join(', ')}`);
                    console.log(`Player ${playerToCheck} missed a chance to win at move number ${previousPlayerMove.MoveNumber + 2}`);
                }
            }
            potentialWinsMap.delete(playerToCheck); // Reset after checking
        }

        // Track potential wins for the current player for their next turn
        if (!isWinningMove) {
            const potentialWins = checkTwoInARow(board, move.Player);
            if (potentialWins.length > 0) {
                potentialWinsMap.set(move.Player, potentialWins);
                console.log(`Potential wins for player ${move.Player}:`, potentialWins);
            }
        }

        // Check if the previous player missed a block opportunity
        if (lastValidMoveIndex > -1) {
            const previousMove = data.Moves[lastValidMoveIndex];
            const previousPlayer = previousMove.Player;
            const currentPlayer = move.Player;

            if (previousPlayer !== currentPlayer) {
                console.log(`Evaluating potential missed block after move ${move.MoveNumber} by Player ${currentPlayer}`);

                // Determine if the current move blocked any of the opponent's potential winning moves
                const blockMade = opponentPotentialWins.some(pos => pos.row === move.Row && pos.col === move.Column);

                if (blockMade) {
                    console.log(`Player ${currentPlayer} successfully blocked a winning move at ${move.Row},${move.Column}`);
                } else if (opponentPotentialWins.length > 0) {
                    results.missedBlocks.push(`Player ${currentPlayer} missed a chance to block at move number ${move.MoveNumber} by not placing at ${opponentPotentialWins.map(pos => `[${pos.row},${pos.col}]`).join(', ')}`);
                    console.log(`Player ${currentPlayer} missed a chance to block at move number ${move.MoveNumber}`);
                } else {
                    console.log(`No missed block detected after move ${move.MoveNumber} for Player ${currentPlayer}`);
                }
            }
        }

        lastValidMoveIndex = index; // Update the last valid move index
        currentPlayerLastMoveIndex[move.Player] = index; // Update the last valid move index for the current player
    });

    console.log('Final results:', results);
    return results;
}

function canWin(board, player) {
    const symbol = player === 1 ? 'X' : 'O';
    const win = checkLineConditions(board, symbol);
    console.log(`Checking win conditions for player ${player} with symbol ${symbol}: ${win}`);
    return win;
}

function checkLineConditions(board, symbol) {
    return checkLines(board, symbol) || checkDiagonals(board, symbol);
}

function checkLines(board, symbol) {
    let size = board.length;
    for (let i = 0; i < size; i++) {
        let row = board[i];
        let column = board.map(row => row[i]);
        if (checkWin(row, symbol) || checkWin(column, symbol)) {
            console.log(`Winning line found for ${symbol}`);
            return true;
        }
    }
    return false;
}

function checkDiagonals(board, symbol) {
    let size = board.length;
    let diag1 = [], diag2 = [];
    for (let i = 0; i < size; i++) {
        diag1.push(board[i][i]); // Main diagonal
        diag2.push(board[i][size - i - 1]); // Counter diagonal
    }
    if (checkWin(diag1, symbol) || checkWin(diag2, symbol)) {
        console.log(`Winning diagonal found for ${symbol}`);
        return true;
    }
    return false;
}

function checkWin(line, symbol) {
    let win = line.every(cell => cell === symbol);
    console.log(`Line check for win: ${line.join(',')}, Result: ${win}`);
    return win;
}

function checkTwoInARow(board, player) {
    const symbol = player === 1 ? 'X' : 'O';
    const potentialWins = [];

    // Check rows and columns for potential wins
    for (let i = 1; i <= 3; i++) {
        // Check rows
        let row = board[i - 1];
        let emptyCellsRow = row.reduce((acc, cell, idx) => cell === null ? acc.concat([[i, idx + 1]]) : acc, []);
        if (row.filter(cell => cell === symbol).length === 2 && emptyCellsRow.length === 1) {
            potentialWins.push({ row: emptyCellsRow[0][0], col: emptyCellsRow[0][1] });
        }

        // Check columns
        let col = board.map(row => row[i - 1]);
        let emptyCellsCol = col.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, i]]) : acc, []);
        if (col.filter(cell => cell === symbol).length === 2 && emptyCellsCol.length === 1) {
            potentialWins.push({ row: emptyCellsCol[0][0], col: emptyCellsCol[0][1] });
        }
    }

    // Check diagonals for potential wins
    let diag1 = [board[0][0], board[1][1], board[2][2]];
    let emptyCellsDiag1 = diag1.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, idx + 1]]) : acc, []);
    if (diag1.filter(cell => cell === symbol).length === 2 && emptyCellsDiag1.length === 1) {
        potentialWins.push({ row: emptyCellsDiag1[0][0], col: emptyCellsDiag1[0][1] });
    }

    let diag2 = [board[0][2], board[1][1], board[2][0]];
    let emptyCellsDiag2 = diag2.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, 3 - idx]]) : acc, []);
    if (diag2.filter(cell => cell === symbol).length === 2 && emptyCellsDiag2.length === 1) {
        potentialWins.push({ row: emptyCellsDiag2[0][0], col: emptyCellsDiag2[0][1] });
    }

    console.log(`Two in a row check complete for player ${player} with symbol ${symbol}. Potential wins: ${potentialWins.length > 0 ? potentialWins.map(pos => `[${pos.row},${pos.col}]`).join(', ') : 'None'}`);
    return potentialWins;
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `<h3>Missed Opportunities:</h3>
        <p>Missed Wins: ${results.missedWins.length ? results.missedWins.join(', ') : 'None'}</p>
        <p>Missed Blocks: ${results.missedBlocks.length ? results.missedBlocks.join(', ') : 'None'}</p>`;
}

function analyzeBulkData(data, results) {
    for (const key in data) {
        const parts = key.split('_');
        const llm1 = parts[3];
        const llm2 = parts[4];

        if (!results[llm1]) {
            results[llm1] = {
                totalGames: 0,
                missedWinsP1: 0,
                missedWinsP2: 0,
                missedBlocksP1: 0,
                missedBlocksP2: 0
            };
        }
        if (!results[llm2]) {
            results[llm2] = {
                totalGames: 0,
                missedWinsP1: 0,
                missedWinsP2: 0,
                missedBlocksP1: 0,
                missedBlocksP2: 0
            };
        }

        results[llm1].totalGames += 1;
        results[llm2].totalGames += 1;

        console.log(`[LOG] Analyzing game ${key} for ${llm1} and ${llm2}`);

        // Analyze the combined moves for capturing missed wins and blocks
        const combinedMoves = { Moves: data[key] };
        const combinedAnalysisResults = performAnalysis(combinedMoves);

        console.log(`[LOG] Results for game ${key}:`);
        console.log(combinedAnalysisResults);

        results[llm1].missedWinsP1 += combinedAnalysisResults.missedWins.filter(miss => miss.includes('Player 1')).length;
        results[llm2].missedWinsP2 += combinedAnalysisResults.missedWins.filter(miss => miss.includes('Player 2')).length;
        results[llm1].missedBlocksP1 += combinedAnalysisResults.missedBlocks.filter(block => block.includes('Player 1')).length;
        results[llm2].missedBlocksP2 += combinedAnalysisResults.missedBlocks.filter(block => block.includes('Player 2')).length;
    }
}

function displayBulkResults(results) {
    const resultsContainer = document.getElementById('bulkResults');
    let tableHtml = `
        <table style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">LLM</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">Total Games</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">Number of Win Opportunities Missed As Player 1</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">Number of Win Opportunities Missed As Player 2</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">Number of Block Opportunities Missed As Player 1</th>
                    <th style="border: 1px solid black; padding: 8px; text-align: right;">Number of Block Opportunities Missed As Player 2</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (const llm in results) {
        tableHtml += `
            <tr>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${llm}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${results[llm].totalGames}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${results[llm].missedWinsP1}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${results[llm].missedWinsP2}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${results[llm].missedBlocksP1}</td>
                <td style="border: 1px solid black; padding: 8px; text-align: right;">${results[llm].missedBlocksP2}</td>
            </tr>
        `;
    }

    tableHtml += `
            </tbody>
        </table>
    `;

    resultsContainer.innerHTML = tableHtml;
}