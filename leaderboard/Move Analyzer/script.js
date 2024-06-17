function analyzeMoves() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert('Please upload a file!');
        return;
    }

    const file = fileInput.files[0];
    // Check if the file type is JSON by looking at the file extension
    if (!file.name.endsWith('.json')) {
        alert('Invalid file type. Please upload a JSON file.');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            // Validate required fields, checking deeper structure
            if (!data.Moves || !Array.isArray(data.Moves) || data.Moves.length === 0) {
                alert('Invalid JSON file. The JSON does not contain the required "Moves" array or it is empty.');
                return;
            }
            // Validate that each move has the necessary properties
            if (!data.Moves.every(move => move.hasOwnProperty('Row') && move.hasOwnProperty('Column') && move.hasOwnProperty('Player'))) {
                alert('Invalid JSON file. Not all moves have the required "Row", "Column", and "Player" properties.');
                return;
            }
            const analysisResults = performAnalysis(data);
            displayResults(analysisResults);
        } catch (error) {
            // Handle JSON parsing errors
            alert('Invalid file. There was an error processing your file. Please ensure it is a valid JSON.');
            console.error('Error reading or parsing the file:', error);
        }
    };

    reader.onerror = function() {
        alert('Error reading the file. Please try again.');
    };

    reader.readAsText(file);
}

function performAnalysis(data) {
    const results = { missedWins: [], missedBlocks: [] };
    const board = initializeBoard(3, 3); // 3x3 board for Tic-Tac-Toe
    let previousBoardState = null; // Keep track of the previous state to check for missed opportunities

    data.Moves.forEach((move, index) => {
        updateBoard(board, move);
        
        // Store current board state for comparison on next move
        if (previousBoardState && move.Player === data.Moves[index - 1].Player) {
            // Check if the previous move by the same player had a winning opportunity
            if (canWin(previousBoardState, move.Player)) {
                results.missedWins.push(`Player ${move.Player} missed a chance to win at move number ${data.Moves[index - 1].MoveNumber}`);
            }
        }

        // Update previousBoardState with a copy of the current board
        previousBoardState = board.map(row => row.slice());

        // Check for missed block opportunities only if there is a next move
        if (data.Moves[index + 1]) {
            const nextMove = data.Moves[index + 1];
            if (canWin(board, nextMove.Player)) {
                results.missedBlocks.push(`Player ${nextMove.Player} missed a chance to block at move number ${move.MoveNumber}`);
            }
        }
    });

    return results;
}


function initializeBoard(rows, cols) {
    return Array.from(Array(rows), () => new Array(cols).fill(null));
}

function updateBoard(board, move) {
    const symbol = move.Player === 1 ? 'X' : 'O';
    board[move.Row - 1][move.Column - 1] = symbol;
}

function missedOpportunity(board, currentPlayer, nextPlayer) {
    const currentSymbol = currentPlayer === 1 ? 'X' : 'O';
    const nextSymbol = nextPlayer === 1 ? 'X' : 'O';
    if (canWin(board, currentSymbol) || canBlockWin(board, nextSymbol)) {
        return true;
    }
    return false;
}

function canWin(board, player) {
    const symbol = player === 1 ? 'X' : 'O';
    return checkLineConditions(board, symbol);
}

function canBlockWin(board, player) {
    const opponentSymbol = player === 1 ? 'O' : 'X';
    return checkLineConditions(board, opponentSymbol);
}

// Determine whether there are winning conditions met on the board for a given symbol 
function checkLineConditions(board, symbol) {
    // This function aggregates checks across rows, columns, and diagonals
    return checkLines(board, symbol) || checkDiagonals(board, symbol);
}

function checkLines(board, symbol) {
    let size = board.length;
    for (let i = 0; i < size; i++) {
        // Prepare arrays for rows and columns
        let row = board[i];
        let column = board.map(row => row[i]);
        
        // Check both row and column for win conditions
        if (checkPotentialWin(row, symbol) || checkPotentialWin(column, symbol)) {
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
    return checkPotentialWin(diag1, symbol) || checkPotentialWin(diag2, symbol);
}

function checkPotentialWin(line, symbol) {
    // Check for exact conditions that lead to a win
    let count = line.filter(cell => cell === symbol).length;
    let emptyCount = line.filter(cell => cell === null).length;
    
    // A potential win requires exactly two symbols and one empty spot
    return count === 2 && emptyCount === 1;
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = `<h3>Missed Opportunities:</h3>
        <p>Missed Wins: ${results.missedWins.join(', ')}</p>
        <p>Missed Blocks: ${results.missedBlocks.join(', ')}</p>`;
}
