$(document).ready(function() {
    const jsonURL = 'https://raw.githubusercontent.com/jackson-harper/JSONLLM/main/newLeaderboard.json';

    $.getJSON(jsonURL, function(data) {
        const formattedData = data.map(item => [
            item.GameType,
            item.PromptType,
            item.PromptVersion,
            item.LLM1stPlayer,
            item.LLM2ndPlayer,
            item["WinRatio-1st"],
            item["WinRatio-2nd"],
            item["Wins-1st"],
            item["Wins-2nd"],
            item["Disqualifications-1st"],
            item["Disqualifications-2nd"],
            item.Draws,
            item["InvalidMovesRatio-1st"],
            item["InvalidMovesRatio-2nd"],
            item["TotalMoves-1st"],
            item["TotalMoves-2nd"],
            item.ProviderEmail,
            item.SubmissionDate,
            item.UUID
        ]);

        const table = $('#mytable').DataTable({
            data: formattedData,
            columns: [
                { title: "Game Type"},
                { title: "Prompt Type" },
                { title: "Prompt Version" },
                { title: "LLM (1st)" },
                { title: "LLM (2nd)" },
                { title: "Win Ratio (1st)" },
                { title: "Win Ratio (2nd)"} ,
                { title: "Wins (1st)" },
                { title: "Wins (2nd)" },
                { title: "DQ (1st)" },
                { title: "DQ (2nd)" },
                { title: "Draws" },
                { title: "Invalid Moves Ratio (1st)" },
                { title: "Invalid Moves Ratio (2nd)" },
                { title: "Total Moves (1st)" },
                { title: "Total Moves (2nd)" },
                { title: "Provider Email" },
                { title: "Submission Date" },
                { title: "UUID" }
            ],
            // Adjust positioning of dom to move search bar and 
            dom: 'frtlpi',
            columnDefs: [
                { targets: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,17], className: 'dt-body-right' },
                { targets: [0, 1, 2, 3, 4, 16], className: 'dt-body-center' },
                { targets: [18], visible: false}
            ]
        });

         // Sanitize the column names to create valid and consistent IDs
        function sanitizeColumnName(name) {
            return name.replace(/\s+/g, '').replace(/[()]/g, '').toLowerCase();
        }

        function populateDropdown(columnIndex, listId) {
            const columnData = table.column(columnIndex).data().unique().sort();
            const list = $(listId);
            list.empty();
            // Add Select All option
            const selectAllItem = $('<li class="item">')
                .append('<span class="checkbox"><i class="fa-solid fa-check check-icon"></i></span>')
                .append('<span class="item-text">Select All</span>')
                .click(function(event) {
                    const isChecked = $(this).hasClass('checked');
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
                const item = $('<li class="item">')
                    .append('<span class="checkbox"><i class="fa-solid fa-check check-icon"></i></span>')
                    .append('<span class="item-text">' + value + '</span>')
                    .click(function(event) {
                        event.stopPropagation(); // Prevent dropdown from closing
                        $(this).toggleClass('checked');
                        $(this).find('.checkbox').toggleClass('checked');
                        filterTable();
                    });
                list.append(item);
            });
        }

        populateDropdown(0, '#gametypeList');
        populateDropdown(1, '#prompttypeList');
        populateDropdown(2, '#promptversionList');
        populateDropdown(3, '#llm1stList');
        populateDropdown(4, '#llm2ndList');

        // Function to close all dropdowns
        function closeAllDropdowns() {
            $('.list-items').hide();
        }
        
        // Toggle dropdown visibility on select button click
         $('.select-btn').click(function(event) {
            event.stopPropagation(); 
            const list = $(this).next('.list-items');
            list.toggle();
            $('.list-items').not(list).hide(); // Close other dropdowns
        });

        // Close dropdowns when clicking outside
        $(document).click(function() {
            closeAllDropdowns();
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
