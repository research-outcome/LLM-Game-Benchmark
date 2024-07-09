function formatDecimal(value) {
    let number = parseFloat(value);
    return Number.isInteger(number) ? number : number.toFixed(2);
}

// Sanitize the column names to create valid and consistent IDs
function sanitizeColumnName(name) {
    return name.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();
}

function populateDropdown(columnIndex, listId, table) {
    let columnData = table.column(columnIndex).data().unique().sort();
    let list = $(listId);
    list.empty();
    // Add Select All option
    let selectAllItem = $('<li class="item">')
        .append('<span class="checkbox"><i class="fa-solid fa-check check-icon"></i></span>')
        .append('<span class="item-text">Select All</span>')
        .click(function(event) {
            let isChecked = $(this).hasClass('checked');
            event.stopPropagation(); // Prevent dropdown from closing
            if (isChecked) {
                list.find('.item').removeClass('checked');
                list.find('.checkbox').removeClass('checked');
            } else {
                list.find('.item').addClass('checked');
                list.find('.checkbox').addClass('checked');
            }
            filterTable();
        });
    list.append(selectAllItem);

    columnData.each(function(value) {
        let item = $('<li class="item">')
            .append('<span class="checkbox"><i class="fa-solid fa-check check-icon"></i></span>')
            .append('<span class="item-text">' + value + '</span>')
            .click(function(event) {
                event.stopPropagation(); // Prevent dropdown from closing
                $(this).toggleClass('checked');
                $(this).find('.checkbox').toggleClass('checked');
                filterTable(table);
            });
        list.append(item);
    });
}

function filterTable(table) {
    table.columns().every(function(index) {
        let column = this;
        // Create the appropriate ID for the dropdown list based on the column header text
        // This ensures that the dropdown list ID matches the column header it is filtering
        let headerTitle = sanitizeColumnName(column.header().textContent);
        let selectedFilters = [];
        $(`#${headerTitle}List .checked .item-text`).each(function() {
            selectedFilters.push($.fn.dataTable.util.escapeRegex($(this).text()));
        });
        let regex = selectedFilters.length ? selectedFilters.join('|') : '';
        console.log(`Filtering column ${index} with regex: ${regex}`);
        column.search(regex ? '^(' + regex + ')$' : '', true, false).draw();
    });
}

// Function to close all dropdowns
function closeAllDropdowns() {
    $('.list-items').hide();
}

// Function to empty the table's HTML in preparation for updating the table's data.
function emptyTableHTML() {
    // Create a new placeholder column to store each column in the aggregated JSON file.
    document.getElementById("mytable").innerHTML = "<table id=\"mytable\" class=\"display\">\n" +
        "   <thead>\n" +
        "      <tr>\n" +
        "      </tr>\n" +
        "      </thead>\n" +
        "</table>\n";
}

function showOriginalTable() {
    let jsonURL = './leaderboard-data.json'; //'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/newLeaderboard.json';

    $.getJSON(jsonURL, function(data) {
        let formattedData = data.map(item => [
            item.LLM1stPlayer,
            item.LLM2ndPlayer,
            item.PromptType,
            item.PromptVersion,
            item.GameType,
            formatDecimal(item["WinRatio-1st"]),
            formatDecimal(item["WinRatio-2nd"]),
            item["Wins-1st"],
            item["Wins-2nd"],
            item["Disqualifications-1st"],
            item["Disqualifications-2nd"],
            item.Draws,
            formatDecimal(item["InvalidMovesRatio-1st"]),
            formatDecimal(item["InvalidMovesRatio-2nd"]),
            item["TotalMoves-1st"],
            item["TotalMoves-2nd"],
            item.ProviderEmail,
            item.DateTime,
            item.UUID
        ]);

        emptyTableHTML(formattedData);

        let table = $('#mytable').DataTable({
            data: formattedData,
            columns: [
                { title: "LLM (1st)" },
                { title: "LLM (2nd)" },
                { title: "Prompt Type" },
                { title: "Prompt Version" },
                { title: "Game Type"},
                { title: "Win Ratio (1st)" },
                { title: "Win Ratio (2nd)"},
                { title: "Wins (1st)" },
                { title: "Wins (2nd)" },
                { title: "DQ (1st)" },
                { title: "DQ (2nd)" },
                { title: "Draws" },
                { title: "Invalid Moves (1st)" },
                { title: "Invalid Moves (2nd)" },
                { title: "Total Moves (1st)" },
                { title: "Total Moves (2nd)" },
                { title: "Provider Email" },
                { title: "Date-Time" },
                { title: "UUID" }
            ],
            // Adjust positioning of dom to move search bar and
            dom: 'frtlpi',
            columnDefs: [
                { targets: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17], className: 'dt-body-right' },
                { targets: [0, 1, 2, 3, 4, 16], className: 'dt-body-center' },
                { targets: [3, 16, 17, 18], visible: false}
            ]
        });

        populateDropdown(0, '#llm1stList', table);
        populateDropdown(1, '#llm2ndList', table);
        populateDropdown(2, '#prompttypeList', table);
        populateDropdown(3, '#promptversionList', table);
        populateDropdown(4, '#gametypeList', table);

        // Toggle dropdown visibility on select button click
        $('.select-btn').click(function(event) {
            event.stopPropagation();
            $(this).next('.list-items').toggle();
            $('.list-items').not(list).hide(); // Close other dropdowns
        });

        // Close dropdowns when clicking outside
        $(document).click(function() {
            closeAllDropdowns();
        });
    }).fail(function() {
        console.error("An error occurred while fetching the JSON data.");
    });
}

$(document).ready(function() {
    showOriginalTable();
});

document.getElementById('downloadBtn').addEventListener('click', function() {
    // URL of the file to be downloaded
    let fileUrl = './leaderboard-data.json';
    // Name of the file to be saved as
    let fileName = 'leaderboard-data.json';

    // Create an anchor element
    let a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

document.getElementById("aggregate-gametype-prompttype-llm2-btn").addEventListener('click', function() {
    $("#mytable").DataTable().destroy(); // Delete the existing table.

    // If the button's text does not start with "De-", or in other words, it doesn't say "De-Aggregate", then aggregate the data. Otherwise, de-aggregate the data.
    if (!document.getElementById("aggregate-gametype-prompttype-llm2-btn").innerText.startsWith("De-")) {
        // Update button name and disable other aggregation buttons.
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").innerText = "De-" + document.getElementById("aggregate-gametype-prompttype-llm2-btn").innerText;
        document.getElementById("aggregate-gametype-btn").disabled = true;
        document.getElementById("aggregate-gametype-prompttype-btn").disabled = true;

        let jsonURL = './leaderboard-data-agg-gametype-prompttype-llm2.json'; //'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/newLeaderboard.json';

        $.getJSON(jsonURL, function(data) {
            let formattedData = data.map(item => [
                item.LLM1stPlayer,
                item["Wins-1st"],
                item["Disqualifications-1st"],
                item["Disqualifications-2nd"],
                item.Draws,
                item["InvalidMoves-1st"],
                item["InvalidMoves-2nd"],
                item["TotalMoves-1st"],
                item["TotalMoves-2nd"],
            ]);

            emptyTableHTML(formattedData);

            // Create a new table with the columns available in the aggregated data JSON file.
            let table = $('#mytable').DataTable({
                data: formattedData,
                columns: [
                    { title: "LLM (1st)" },
                    { title: "Wins (1st)" },
                    { title: "DQ (1st)" },
                    { title: "DQ (2nd)" },
                    { title: "Draws" },
                    { title: "Invalid Moves (1st)" },
                    { title: "Invalid Moves (2nd)" },
                    { title: "Total Moves (1st)" },
                    { title: "Total Moves (2nd)" },
                ],
                // Adjust positioning of dom to move search bar and
                dom: 'frtlpi',
                columnDefs: [
                    { targets: [1, 2, 3, 4, 5, 6, 7, 8], className: 'dt-body-right' },
                    { targets: [0], className: 'dt-body-center' },
                ]
            });

            populateDropdown(0, '#llm1stList', table);
            $('.container').each(function () {
                if ($(this).text().includes('LLM (2nd)') || $(this).text().includes('Prompt Type') || $(this).text().includes('Game Type')) {
                    $(this).hide();
                }
            });

            // Toggle dropdown visibility on select button click
            $('.select-btn').click(function(event) {
                event.stopPropagation();
                $(this).next('.list-items').toggle();
                $('.list-items').not(list).hide(); // Close other dropdowns
            });

            // Close dropdowns when clicking outside
            $(document).click(function() {
                closeAllDropdowns();
            });
        }).fail(function() {
            console.error("An error occurred while fetching the JSON data.");
        });
    }
    else {
        // If we are de-aggregating the data, update the button's title, re-enable other aggregation buttons, un-hide the applicable select dropdowns, and re-show the original table.
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").innerText = document.getElementById("aggregate-gametype-prompttype-llm2-btn").innerText.replace("De-", "");

        document.getElementById("aggregate-gametype-btn").disabled = false;
        document.getElementById("aggregate-gametype-prompttype-btn").disabled = false;

        $('.container').each(function () {
            if ($(this).text().includes('LLM (2nd)') || $(this).text().includes('Prompt Type') || $(this).text().includes('Game Type')) {
                $(this).show();
            }
        });

        showOriginalTable();
    }
});

document.getElementById("aggregate-gametype-prompttype-btn").addEventListener('click', function() {
    $("#mytable").DataTable().destroy(); // Delete the existing table.

    // If the button's text does not start with "De-", or in other words, it doesn't say "De-Aggregate", then aggregate the data. Otherwise, de-aggregate the data.
    if (!document.getElementById("aggregate-gametype-prompttype-btn").innerText.startsWith("De-")) {
        // Update button name and disable other aggregation buttons.
        document.getElementById("aggregate-gametype-prompttype-btn").innerText = "De-" + document.getElementById("aggregate-gametype-prompttype-btn").innerText;
        document.getElementById("aggregate-gametype-btn").disabled = true;
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").disabled = true;

        let jsonURL = './leaderboard-data-agg-gametype-prompttype.json'; //'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/newLeaderboard.json';

        $.getJSON(jsonURL, function(data) {
            let formattedData = data.map(item => [
                item.LLM1stPlayer,
                item.LLM2ndPlayer,
                item["Wins-1st"],
                item["Wins-2nd"],
                item["Disqualifications-1st"],
                item["Disqualifications-2nd"],
                item.Draws,
                item["InvalidMoves-1st"],
                item["InvalidMoves-2nd"],
                item["TotalMoves-1st"],
                item["TotalMoves-2nd"],
            ]);

            emptyTableHTML(formattedData);

            // Create a new table with the columns available in the aggregated data JSON file.
            let table = $('#mytable').DataTable({
                data: formattedData,
                columns: [
                    { title: "LLM (1st)" },
                    { title: "LLM (2nd)" },
                    { title: "Wins (1st)" },
                    { title: "Wins (2nd)" },
                    { title: "DQ (1st)" },
                    { title: "DQ (2nd)" },
                    { title: "Draws" },
                    { title: "Invalid Moves (1st)" },
                    { title: "Invalid Moves (2nd)" },
                    { title: "Total Moves (1st)" },
                    { title: "Total Moves (2nd)" },
                ],
                // Adjust positioning of dom to move search bar and
                dom: 'frtlpi',
                columnDefs: [
                    { targets: [2, 3, 4, 5, 6, 7, 8, 9, 10], className: 'dt-body-right' },
                    { targets: [0, 1], className: 'dt-body-center' },
                ]
            });

            populateDropdown(0, '#llm1stList', table);
            populateDropdown(1, '#llm2ndList', table);
            $('.container').each(function () {
                if ($(this).text().includes('Game Type') || $(this).text().includes('Prompt Type')) {
                    $(this).hide();
                }
            });

            // Toggle dropdown visibility on select button click
            $('.select-btn').click(function(event) {
                event.stopPropagation();
                $(this).next('.list-items').toggle();
                $('.list-items').not(list).hide(); // Close other dropdowns
            });

            // Close dropdowns when clicking outside
            $(document).click(function() {
                closeAllDropdowns();
            });
        }).fail(function() {
            console.error("An error occurred while fetching the JSON data.");
        });
    }
    else {
        // If we are de-aggregating the data, update the button's title, re-enable other aggregation buttons, un-hide the applicable select dropdowns, and re-show the original table.
        document.getElementById("aggregate-gametype-prompttype-btn").innerText = document.getElementById("aggregate-gametype-prompttype-btn").innerText.replace("De-", "");

        document.getElementById("aggregate-gametype-btn").disabled = false;
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").disabled = false;

        $('.container').each(function () {
            if ($(this).text().includes('Game Type') || $(this).text().includes('Prompt Type')) {
                $(this).show();
            }
        });

        showOriginalTable();
    }
});

document.getElementById("aggregate-gametype-btn").addEventListener('click', function() {
    $("#mytable").DataTable().destroy(); // Delete the existing table.

    // If the button's text does not start with "De-", or in other words, it doesn't say "De-Aggregate", then aggregate the data. Otherwise, de-aggregate the data.
    if (!document.getElementById("aggregate-gametype-btn").innerText.startsWith("De-")) {
        // Update button name and disable other aggregation buttons.
        document.getElementById("aggregate-gametype-btn").innerText = "De-" + document.getElementById("aggregate-gametype-btn").innerText;
        document.getElementById("aggregate-gametype-prompttype-btn").disabled = true;
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").disabled = true;

        let jsonURL = './leaderboard-data-agg-gametype.json'; //'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/newLeaderboard.json';

        $.getJSON(jsonURL, function(data) {
            let formattedData = data.map(item => [
                item.LLM1stPlayer,
                item.LLM2ndPlayer,
                item.PromptType,
                item["Wins-1st"],
                item["Wins-2nd"],
                item["Disqualifications-1st"],
                item["Disqualifications-2nd"],
                item.Draws,
                item["InvalidMoves-1st"],
                item["InvalidMoves-2nd"],
                item["TotalMoves-1st"],
                item["TotalMoves-2nd"],
            ]);

            emptyTableHTML(formattedData);

            // Create a new table with the columns available in the aggregated data JSON file.
            let table = $('#mytable').DataTable({
                data: formattedData,
                columns: [
                    { title: "LLM (1st)" },
                    { title: "LLM (2nd)" },
                    { title: "Prompt Type" },
                    { title: "Wins (1st)" },
                    { title: "Wins (2nd)" },
                    { title: "DQ (1st)" },
                    { title: "DQ (2nd)" },
                    { title: "Draws" },
                    { title: "Invalid Moves (1st)" },
                    { title: "Invalid Moves (2nd)" },
                    { title: "Total Moves (1st)" },
                    { title: "Total Moves (2nd)" },
                ],
                // Adjust positioning of dom to move search bar and
                dom: 'frtlpi',
                columnDefs: [
                    { targets: [3, 4, 5, 6, 7, 8, 9, 10, 11], className: 'dt-body-right' },
                    { targets: [0, 1, 2], className: 'dt-body-center' },
                ]
            });

            populateDropdown(0, '#llm1stList', table);
            populateDropdown(1, '#llm2ndList', table);
            populateDropdown(2, '#prompttypeList', table);
            $('.container').each(function () {
                if ($(this).text().includes('Game Type')) {
                    $(this).hide();
                }
            });

            // Toggle dropdown visibility on select button click
            $('.select-btn').click(function(event) {
                event.stopPropagation();
                $(this).next('.list-items').toggle();
                $('.list-items').not(list).hide(); // Close other dropdowns
            });

            // Close dropdowns when clicking outside
            $(document).click(function() {
                closeAllDropdowns();
            });
        }).fail(function() {
            console.error("An error occurred while fetching the JSON data.");
        });
    }
    else {
        // If we are de-aggregating the data, update the button's title, re-enable other aggregation buttons, un-hide the applicable select dropdowns, and re-show the original table.
        document.getElementById("aggregate-gametype-btn").innerText = document.getElementById("aggregate-gametype-btn").innerText.replace("De-", "");

        document.getElementById("aggregate-gametype-prompttype-btn").disabled = false;
        document.getElementById("aggregate-gametype-prompttype-llm2-btn").disabled = false;

        $('.container').each(function () {
            if ($(this).text().includes('Game Type')) {
                $(this).show();
            }
        });

        showOriginalTable();
    }
});

