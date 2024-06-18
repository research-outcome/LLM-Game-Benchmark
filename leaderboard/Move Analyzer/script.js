function analyzeMoves() {
    const fileInput = document.getElementById('fileInput');
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

    data.Moves.forEach((move, index) => {
        console.log(`Processing move number ${move.MoveNumber} by Player ${move.Player}`);
        console.log('Current board state before move:');
        console.table(board);

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
        if (index > 1 && !isWinningMove) {
            const playerToCheck = move.Player;
            const previousPlayerMove = data.Moves[index - 2];
            if (previousPlayerMove.Player === playerToCheck) {
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
        }

        // Track potential wins for the current player for their next turn
        if (!isWinningMove) {
            const potentialWins = checkTwoInARow(board, move.Player);
            if (potentialWins.length > 0) {
                potentialWinsMap.set(move.Player, potentialWins);
            }
        }

        // Check if the previous player missed a block opportunity
        if (index > 0) {
            const previousMove = data.Moves[index - 1];
            const previousPlayer = previousMove.Player;
            const currentPlayer = move.Player;

            if (previousPlayer !== currentPlayer) {
                console.log(`Evaluating potential missed block after move ${move.MoveNumber} by Player ${currentPlayer}`);
                const missedBlocks = checkTwoInARow(board, previousPlayer);
                if (missedBlocks.length > 0) {
                    results.missedBlocks.push(`Player ${currentPlayer} missed a chance to block at move number ${move.MoveNumber} by not placing at ${missedBlocks.map(pos => `[${pos.row},${pos.col}]`).join(', ')}`);
                    console.log(`Player ${currentPlayer} missed a chance to block at move number ${move.MoveNumber}`);
                } else {
                    console.log(`No missed block detected after move ${move.MoveNumber} for Player ${currentPlayer}`);
                }
            }
        }
    });

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
