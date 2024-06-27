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
            const analysisResults = performAnalysis(data, data.GameType);
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

function analyzeBulkRunMoves() {
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
    console.log("Move row and column: " + row + " " + col);
    board[row][col] = symbol;
    console.log(`Board updated at [${move.Row},${move.Column}] with ${symbol}`); 
}

function performAnalysis(data, gameType) {
    let rows, cols;
    if (gameType === 'connect-four') {
        rows = 6;
        cols = 7;
    } else if (gameType === 'gomoku') {
        rows = 15;
        cols = 15;
    } else if (gameType === 'tic-tac-toe') {
        rows = 3;
        cols = 3;
    }

    const results = { missedWins: [], missedBlocks: [] };
    const board = initializeBoard(rows, cols);
    const potentialWinsMap = new Map(); // Track potential wins for each player

    let lastValidMoveIndex = -1; // Index of the last valid move
    let currentPlayerLastMoveIndex = { 1: -1, 2: -1 }; // Track the last valid move for each player
    let effectiveMoveNumber = 0; // Effective move number to handle invalid moves

    data.Moves.forEach((move, index) => {
        if (move.Outcome !== "Valid") {
            console.log(`Skipping invalid move number ${move.MoveNumber} by Player ${move.Player}`);
            // Increment effectiveMoveNumber for invalid moves as well to keep track
            effectiveMoveNumber++;
            return; // Skip invalid moves
        }

        effectiveMoveNumber++; // Increment the effective move number for valid moves
        console.log(`Processing move number ${move.MoveNumber} by Player ${move.Player}`);
        console.log('Current board state before move:');
        console.table(board);

        // Check if the current move blocks any potential winning positions
        const opponentPlayer = move.Player === 1 ? 2 : 1;
        let opponentPotentialWins;
        try {
            opponentPotentialWins = checkPotentialWins(board, opponentPlayer, gameType);

        }
        catch(error) {
            alert(error);
        }

        // Update the board with the current move
        updateBoard(board, move);
        console.log('Board state after move:');
        console.table(board);

        // Check if the current move resulted in a win
        const isWinningMove = canWin(board, move.Player, gameType);
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
                    results.missedWins.push(`Player ${playerToCheck} missed a chance to win at move number ${move.MoveNumber} by not placing at ${missedWins.map(pos => `[${pos.row},${pos.col}]`).join(', ')}`);
                    console.log(`Player ${playerToCheck} missed a chance to win at move number ${move.MoveNumber}`);
                }
            }
            potentialWinsMap.delete(playerToCheck); // Reset after checking
        }

        // Track potential wins for the current player for their next turn
        if (!isWinningMove) {
            const potentialWins = checkPotentialWins(board, move.Player, gameType);
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

function canWin(board, player, gameType) {
    const symbol = player === 1 ? 'X' : 'O';
    const win = checkLineConditions(board, symbol, gameType);
    console.log(`Checking win conditions for player ${player} with symbol ${symbol}: ${win}`);
    return win;
}

function checkLineConditions(board, symbol, gameType) {
    return checkLines(board, symbol, gameType) || checkDiagonals(board, symbol, gameType);
}

function checkLines(board, symbol, gameType) {
    let size = board.length;
    for (let i = 0; i < size; i++) {
        let row = board[i];
        let column = board.map(row => row[i]);
        if (checkWin(row, symbol, gameType) || checkWin(column, symbol, gameType)) {
            console.log(`Winning line found for ${symbol}`);
            return true;
        }
    }
    return false;
}

function checkDiagonals(board, symbol, gameType) {
    let size = board.length;
    let diag1 = [], diag2 = [];
    for (let i = 0; i < size; i++) {
        diag1.push(board[i][i]); // Main diagonal
        diag2.push(board[i][size - i - 1]); // Counter diagonal
    }
    if (checkWin(diag1, symbol, gameType) || checkWin(diag2, symbol, gameType)) {
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

function checkPotentialWins(board, player, gameType) {
    const symbol = player === 1 ? 'X' : 'O';
    const potentialWins = [];
    
    const logBoard = (board) => {
        for (let row = 0; row < board.length; row++) {
            console.log(board[row].map(cell => cell === null ? 'e' : cell).join(' '));
        }
    };
    
    console.log(`Checking potential wins for player ${player} (${symbol}) in ${gameType}`);
    logBoard(board);

    if (gameType === 'connect-four') {
        // Connect Four logic for checking three in a row
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                if (board[row][col] === null) {
                    // Check if the position is accessible
                    if (row < 5 && board[row + 1][col] === null) {
                        continue;
                    }

                    // Check vertically
                    if (row <= 2 && board[row + 1][col] === symbol && board[row + 2][col] === symbol && board[row + 3][col] === symbol) {
                        potentialWins.push({ row: row + 1, col: col + 1 });
                        console.log(`Found vertical win at [${row + 1},${col + 1}]`);
                    }
                    // Check horizontally
                    if ((col <= 3 && board[row][col + 1] === symbol && board[row][col + 2] === symbol && board[row][col + 3] === symbol) || // (empty) symbol symbol symbol
                        (col >= 1 && col <= 4 && board[row][col - 1] === symbol && board[row][col + 1] === symbol && board[row][col + 2] === symbol) || // symbol (empty) symbol symbol
                        (col >= 2 && col <= 5 && board[row][col - 2] === symbol && board[row][col - 1] === symbol && board[row][col + 1] === symbol) || // symbol symbol (empty) symbol
                        (col >= 3 && board[row][col - 3] === symbol && board[row][col - 2] === symbol && board[row][col - 1] === symbol) // symbol symbol symbol (empty)
                    ) {
                        potentialWins.push({ row: row + 1, col: col + 1 });
                        console.log(`Found horizontal win at [${row + 1},${col + 1}]`);
                    }
                    // Check diagonally (top-left to bottom-right)
                    if ((row <= 2 && col <= 3 && board[row + 1][col + 1] === symbol && board[row + 2][col + 2] === symbol && board[row + 3][col + 3] === symbol) || // (empty) symbol symbol symbol
                        (row >= 1 && row <= 3 && col >= 1 && col <= 4 && board[row - 1][col - 1] === symbol && board[row + 1][col + 1] === symbol && board[row + 2][col + 2] === symbol) || // symbol (empty) symbol symbol
                        (row >= 2 && row <= 4 && col >= 2 && col <= 5 && board[row - 2][col - 2] === symbol && board[row - 1][col - 1] === symbol && board[row + 1][col + 1] === symbol) || // symbol symbol (empty) symbol
                        (row >= 3 && col >= 3 && board[row - 3][col - 3] === symbol && board[row - 2][col - 2] === symbol && board[row - 1][col - 1] === symbol) // symbol symbol symbol (empty)
                    ) {
                        potentialWins.push({ row: row + 1, col: col + 1 });
                        console.log(`Found diagonal win at [${row + 1},${col + 1}]`);
                    }
                    // Check diagonally (bottom-left to top-right)
                    if ((row >= 3 && col <= 3 && board[row - 1][col + 1] === symbol && board[row - 2][col + 2] === symbol && board[row - 3][col + 3] === symbol) || // (empty) symbol symbol symbol
                        (row >= 2 && row <= 4 && col >= 1 && col <= 4 && board[row + 1][col - 1] === symbol && board[row - 1][col + 1] === symbol && board[row - 2][col + 2] === symbol) || // symbol (empty) symbol symbol
                        (row >= 1 && row <= 3 && col >= 2 && col <= 5 && board[row + 2][col - 2] === symbol && board[row + 1][col - 1] === symbol && board[row - 1][col + 1] === symbol) || // symbol symbol (empty) symbol
                        (row <= 2 && col >= 3 && board[row + 3][col - 3] === symbol && board[row + 2][col - 2] === symbol && board[row + 1][col - 1] === symbol) // symbol symbol symbol (empty)
                    ) {
                        potentialWins.push({ row: row + 1, col: col + 1 });
                        console.log(`Found anti-diagonal win at [${row + 1},${col + 1}]`);
                    }
                }
            }
        }
    } else if (gameType === 'gomoku') {
        const potentialWinsSet = new Set();

        const checkDirection = (startRow, startCol, dRow, dCol) => {
            for (let i = -4; i <= 0; i++) {
                let count = 0;
                let emptyCell = null;
                for (let j = 0; j < 5; j++) {
                    const newRow = startRow + (i + j) * dRow;
                    const newCol = startCol + (i + j) * dCol;
                    if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
                        if (board[newRow][newCol] === symbol) {
                            count++;
                        } else if (board[newRow][newCol] === null && emptyCell === null) {
                            emptyCell = { row: newRow + 1, col: newCol + 1 };
                        } else {
                            break;
                        }
                    } else {
                        break;
                    }
                }
                if (count === 4 && emptyCell) {
                    potentialWinsSet.add(`${emptyCell.row},${emptyCell.col}`);
                    console.log(`Found Gomoku potential win at [${emptyCell.row},${emptyCell.col}]`);
                }
            }
        };

        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                if (board[row][col] === null) {
                    checkDirection(row, col, 0, 1); // Check horizontally
                    checkDirection(row, col, 1, 0); // Check vertically
                    checkDirection(row, col, 1, 1); // Check diagonally (bottom-left to top-right)
                    checkDirection(row, col, 1, -1); // Check diagonally (bottom-right to top-left)
                }
            }
        }

        potentialWins.push(...Array.from(potentialWinsSet).map(pos => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        }));
    } else if (gameType === 'tic-tac-toe') {
        // Tic-Tac-Toe logic for checking two in a row
        for (let i = 1; i <= 3; i++) {
            // Check rows
            let row = board[i - 1];
            let emptyCellsRow = row.reduce((acc, cell, idx) => cell === null ? acc.concat([[i, idx + 1]]) : acc, []);
            if (row.filter(cell => cell === symbol).length === 2 && emptyCellsRow.length === 1) {
                potentialWins.push({ row: emptyCellsRow[0][0], col: emptyCellsRow[0][1] });
                console.log(`Found Tic-Tac-Toe row win at [${emptyCellsRow[0][0]},${emptyCellsRow[0][1]}]`);
            }

            // Check columns
            let col = board.map(row => row[i - 1]);
            let emptyCellsCol = col.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, i]]) : acc, []);
            if (col.filter(cell => cell === symbol).length === 2 && emptyCellsCol.length === 1) {
                potentialWins.push({ row: emptyCellsCol[0][0], col: emptyCellsCol[0][1] });
                console.log(`Found Tic-Tac-Toe column win at [${emptyCellsCol[0][0]},${emptyCellsCol[0][1]}]`);
            }
        }

        // Check diagonals for potential wins
        let diag1 = [board[0][0], board[1][1], board[2][2]];
        let emptyCellsDiag1 = diag1.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, idx + 1]]) : acc, []);
        if (diag1.filter(cell => cell === symbol).length === 2 && emptyCellsDiag1.length === 1) {
            potentialWins.push({ row: emptyCellsDiag1[0][0], col: emptyCellsDiag1[0][1] });
            console.log(`Found Tic-Tac-Toe diagonal win at [${emptyCellsDiag1[0][0]},${emptyCellsDiag1[0][1]}]`);
        }

        let diag2 = [board[0][2], board[1][1], board[2][0]];
        let emptyCellsDiag2 = diag2.reduce((acc, cell, idx) => cell === null ? acc.concat([[idx + 1, 3 - idx]]) : acc, []);
        if (diag2.filter(cell => cell === symbol).length === 2 && emptyCellsDiag2.length === 1) {
            potentialWins.push({ row: emptyCellsDiag2[0][0], col: emptyCellsDiag2[0][1] });
            console.log(`Found Tic-Tac-Toe anti-diagonal win at [${emptyCellsDiag2[0][0]},${emptyCellsDiag2[0][1]}]`);
        }
    }
    else {
        alert("The game type in the log file you provided has not been implemented in this move analyzer.");
    }

    console.log(`Potential wins for player ${player} with symbol ${symbol}: ${potentialWins.length > 0 ? potentialWins.map(pos => `[${pos.row},${pos.col}]`).join(', ') : 'None'}`);
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
        const gameType = parts[1]; 

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
        const combinedMoves = { Moves: data[key], GameType: gameType };
        const combinedAnalysisResults = performAnalysis(combinedMoves, gameType);

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