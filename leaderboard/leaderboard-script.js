$(document).ready(function() {
    const jsonURL = 'https://raw.githubusercontent.com/research-outcome/LLM-Game-Benchmark/main/leaderboard/merged_data.json';

    $.getJSON(jsonURL, function(data) {
        const formattedData = data.map(item => [
            item.GameType,
            item.Prompt,
            item.LLM1stPlayer,
            item.LLM2ndPlayer,
            item["WinRatio-1st"],
            item["WinRatio-2nd"],
            item["Wins-1st"],
            item["Wins-2nd"],
            item.Draws,
            item["InvalidMovesRatio-1st"],
            item["InvalidMovesRatio-2nd"],
            item["TotalMoves-1st"],
            item["TotalMoves-2nd"],
            item.ProviderEmail
        ]);

        const table = $('#mytable').DataTable({
            data: formattedData,
            columns: [
                { title: "Game Type" },
                { title: "Prompt" },
                { title: "LLM (1st)" },
                { title: "LLM (2nd)" },
                { title: "Win Ratio (1st)" },
                { title: "Win Ratio (2nd)" },
                { title: "Wins (1st)" },
                { title: "Wins (2nd)" },
                { title: "Draws" },
                { title: "Invalid Moves Ratio (1st)" },
                { title: "Invalid Moves Ratio (2nd)" },
                { title: "Total Moves (1st)" },
                { title: "Total Moves (2nd)" },
                { title: "Provider Email" }
            ],
            //searching: false,
            //paging: false,
            //info: false
        });

         // Sanitize the column names to create valid and consistent IDs
        function sanitizeColumnName(name) {
            return name.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();
        }

        function populateDropdown(columnIndex, listId) {
            const columnData = table.column(columnIndex).data().unique().sort();
            const list = $(listId);
            list.empty();
            columnData.each(function(value) {
                const item = $('<li class="item">')
                    .append('<span class="checkbox"><i class="fa-solid fa-check check-icon"></i></span>')
                    .append('<span class="item-text">' + value + '</span>')
                    .click(function() {
                        $(this).toggleClass('checked');
                        $(this).find('.checkbox').toggleClass('checked');
                        filterTable();
                    });
                list.append(item);
            });
        }

        populateDropdown(0, '#gametypeList');
        populateDropdown(1, '#promptList');
        populateDropdown(2, '#llm1stList');
        populateDropdown(3, '#llm2ndList');

        $('.select-btn').click(function() {
            $(this).next('.list-items').toggle();
        });

        function filterTable() {
            table.columns().every(function(index) {
                const column = this;
                // Create the appropriate ID for the dropdown list based on the column header text
                // This ensures that the dropdown list ID matches the column header it is filtering
                const headerTitle = sanitizeColumnName(column.header().textContent);
                const selectedFilters = [];
                $(`#${headerTitle}List .checked .item-text`).each(function() {
                    selectedFilters.push($.fn.dataTable.util.escapeRegex($(this).text()));
                });
                const regex = selectedFilters.length ? selectedFilters.join('|') : '';
                console.log(`Filtering column ${index} with regex: ${regex}`);
                column.search(regex ? '^(' + regex + ')$' : '', true, false).draw();
            });
        }
    }).fail(function() {
        console.error("An error occurred while fetching the JSON data.");
    });
});
