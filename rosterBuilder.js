let gridData = [];
let headers = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('uploadButton').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('addRow').onclick = addRow;
    document.getElementById('generateRoster').onclick = generateRoster;
    document.getElementById('clearGrid').onclick = clearGrid;
    loadGridData();
});

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.error('No file selected!');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: function(results) {
            gridData = results.data;
            headers = results.meta.fields;

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

    const headerRow = grid.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    const actionTh = document.createElement('th');
    actionTh.textContent = 'Action';
    headerRow.appendChild(actionTh);

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
    }
}

function clearGrid() {
    gridData = [];
    headers = [];
    localStorage.removeItem('gridData');
    localStorage.removeItem('headers');
    document.getElementById('fileInput').value = '';
    document.getElementById('memberGrid').innerHTML = '';
}

function generateRoster() {
    const attendingPlayers = gridData.filter(player => player.Attendance === "1");

    const forwards = attendingPlayers.filter(player => player.Defense !== "1");
    const defensemen = attendingPlayers.filter(player => player.Defense === "1");

    // Shuffle players for randomness
    shuffleArray(forwards);
    shuffleArray(defensemen);

    const teamSize = Math.min(forwards.length, defensemen.length) / 2; // Ensure even teams
    const teams = { Red: [], White: [] };

    for (let i = 0; i < teamSize; i++) {
        teams.Red.push(forwards.pop());
        teams.Red.push(defensemen.pop());
        teams.White.push(forwards.pop());
        teams.White.push(defensemen.pop());
    }

    displayRosters(teams);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayRosters(teams) {
    const redList = document.getElementById('redTeam');
    const whiteList = document.getElementById('whiteTeam');
    redList.innerHTML = '';
    whiteList.innerHTML = '';

    teams.Red.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.First} ${player.Last} (Skill: ${player.Skill})`;
        redList.appendChild(li);
    });

    teams.White.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.First} ${player.Last} (Skill: ${player.Skill})`;
        whiteList.appendChild(li);
    });
}
