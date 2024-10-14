let gridData = [], headers = [];
let currentView = 'builder';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('uploadButton').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('addRow').onclick = addRow;
    document.getElementById('generateRoster').onclick = generateRoster;
    document.getElementById('clearGrid').onclick = clearGrid;
    loadGridData();
});

function toggleView() {
    if (currentView === 'builder') {
        document.getElementById('builderSection').classList.remove('visible');
        document.getElementById('rosterSection').classList.add('visible');
        document.getElementById('toggleButton').textContent = 'Back to Builder';
        currentView = 'roster';
    } else {
        document.getElementById('builderSection').classList.add('visible');
        document.getElementById('rosterSection').classList.remove('visible');
        document.getElementById('toggleButton').textContent = 'View Roster';
        currentView = 'builder';
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) {
        console.error('No file selected!');
        return;
    }

    // Parse the CSV
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            console.log('CSV Parsing Results:', results); // Debugging

            // Check if headers are present and data is valid
            if (results.meta.fields.length === 0) {
                console.error('No headers found in the CSV!');
                alert('Error: No headers found in the CSV file. Please check the file.');
                return;
            }

            // Store the parsed data and headers
            gridData = results.data;
            headers = results.meta.fields;

            // Debug: Check parsed grid data
            console.log('Parsed gridData:', gridData);
            console.log('Parsed headers:', headers);

            // Save data and render the grid
            saveGridData();
            renderGrid();
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
        }
    });
}
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

function renderGrid() {
    const grid = document.getElementById('memberGrid');
    grid.innerHTML = '';

    if (!headers || headers.length === 0) {
        console.warn('No headers to display!');
        return;
    }

    // Create the header row
    const headerRow = grid.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.textContent = 'Action';
    headerRow.appendChild(actionTh);

    // Create rows for each entry
    gridData.forEach((row, index) => {
        const tr = grid.insertRow();

        headers.forEach(header => {
            const td = tr.insertCell();
            const input = document.createElement('input');
            input.type = 'text';
            input.value = row[header] || '';
            input.addEventListener('change', e => {
                gridData[index][header] = e.target.value;
                saveGridData();
            });
            td.appendChild(input);
        });

        // Action buttons
        const actionCell = tr.insertCell();
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteRow(index);
        actionCell.appendChild(deleteButton);
    });
}

function addRow() {
    gridData.push(Object.fromEntries(headers.map(header => [header, ''])));
    saveGridData();
    renderGrid();
}

function deleteRow(index) {
    gridData.splice(index, 1);
    saveGridData();
    renderGrid();
}

function saveGridData() {
    localStorage.setItem('gridData', JSON.stringify(gridData));
    localStorage.setItem('headers', JSON.stringify(headers));
}

function loadGridData() {
    const savedGridData = localStorage.getItem('gridData');
    const savedHeaders = localStorage.getItem('headers');
    if (savedGridData && savedHeaders) {
        gridData = JSON.parse(savedGridData);
        headers = JSON.parse(savedHeaders);
        renderGrid();
        document.getElementById('builderSection').classList.add('visible');
    }
}

function clearGrid() {
    // Clear the grid data and headers
    gridData = [];
    headers = [];
    localStorage.removeItem('gridData');
    localStorage.removeItem('headers');

    // Reset the file input so a new file can be uploaded
    document.getElementById('fileInput').value = '';

    // Clear the member grid and hide the roster section
    document.getElementById('memberGrid').innerHTML = '';
    document.getElementById('rosterSection').style.display = 'none';

    // Clear the rosters
    ['redForward', 'redDefense', 'whiteForward', 'whiteDefense'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });

    console.log('Grid and rosters cleared.');
}


function generateRosters(gridData) {
    const attendingPlayers = gridData.filter(player => player.Attendance === "1");
    if (attendingPlayers.length === 0) {
        console.warn("No attending players found. Cannot generate rosters.");
        return [];
    }

    attendingPlayers.forEach(player => {
        player.Skill = parseFloat(player.Skill);
        player.position = player.Defense === "1" ? "Defense" : "Forward";
    });

    const teams = { Red: [], White: [] };
    const teamScores = { Red: 0, White: 0 };

    const sortedPlayers = attendingPlayers.sort((a, b) => b.Skill - a.Skill);

    sortedPlayers.forEach((player, index) => {
        const team = index % 2 === 0 ? 'Red' : 'White';
        teams[team].push({
            First: player.First,
            Last: player.Last,
            position: player.position,
            team: team,
            Skill: player.Skill
        });
        teamScores[team] += player.Skill;
    });

    return [...teams.Red, ...teams.White];
}

function generateRoster() {
    const rosters = generateRosters(gridData);

    console.log('Generated Rosters:', rosters); // Debugging log to check if rosters are being generated

    if (rosters.length > 0) {
        displayRosters(rosters);
        document.getElementById('rosterSection').style.display = 'block'; // Show the roster section
        scrollToTop(); // Optionally scroll to the top of the page
    } else {
        alert("No rosters generated. Please check the player data.");
        document.getElementById('rosterSection').style.display = 'none'; // Hide the roster section if no roster is generated
    }
}


function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function displayRosters(teamData) {
    // Clear existing roster lists
    ['redForward', 'redDefense', 'whiteForward', 'whiteDefense'].forEach(id => {
        document.getElementById(id).innerHTML = '';
    });

    // Populate the roster lists with players
    teamData.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.First} ${player.Last} (Skill: ${player.Skill})`;

        // Use the correct list ID based on team and position
        const listId = `${player.team.toLowerCase()}${player.position.toLowerCase()}`;
        
        const listElement = document.getElementById(listId);
        if (listElement) {
            listElement.appendChild(li); // Append player to the correct team and position
        } else {
            console.warn(`No list found for ${listId}`); // Log if the list is not found
        }
    });
}
