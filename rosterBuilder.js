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

    // Sort players by skill level (assuming higher number means higher skill)
    forwards.sort((a, b) => parseInt(b.Skill) - parseInt(a.Skill));
    defensemen.sort((a, b) => parseInt(b.Skill) - parseInt(a.Skill));

    const teams = { Red: [], White: [] };

    // Distribute forwards
    distributePlayers(forwards, teams, 'Red', 'White');

    // Distribute defensemen
    distributePlayers(defensemen, teams, 'White', 'Red');

    // Balance teams if needed
    balanceTeams(teams);

    displayRosters(teams);
}

function distributePlayers(players, teams, team1, team2) {
    for (let i = 0; i < players.length; i++) {
        if (i % 2 === 0) {
            teams[team1].push(players[i]);
        } else {
            teams[team2].push(players[i]);
        }
    }
}

function balanceTeams(teams) {
    const getTeamSkill = (team) => team.reduce((sum, player) => sum + parseInt(player.Skill), 0);

    let redSkill = getTeamSkill(teams.Red);
    let whiteSkill = getTeamSkill(teams.White);

    while (Math.abs(redSkill - whiteSkill) > 2) { // Allow small difference
        if (redSkill > whiteSkill) {
            swapPlayers(teams.Red, teams.White);
        } else {
            swapPlayers(teams.White, teams.Red);
        }
        
        redSkill = getTeamSkill(teams.Red);
        whiteSkill = getTeamSkill(teams.White);
    }
}

function swapPlayers(fromTeam, toTeam) {
    const highestSkill = fromTeam.reduce((max, player) => Math.max(max, parseInt(player.Skill)), 0);
    const lowestSkill = toTeam.reduce((min, player) => Math.min(min, parseInt(player.Skill)), Infinity);

    const playerToSwap1 = fromTeam.find(player => parseInt(player.Skill) === highestSkill);
    const playerToSwap2 = toTeam.find(player => parseInt(player.Skill) === lowestSkill);

    fromTeam[fromTeam.indexOf(playerToSwap1)] = playerToSwap2;
    toTeam[toTeam.indexOf(playerToSwap2)] = playerToSwap1;
}

function displayRosters(teams) {
    const redList = document.getElementById('redTeam');
    const whiteList = document.getElementById('whiteTeam');
    redList.innerHTML = '';
    whiteList.innerHTML = '';

    displayTeamRoster(teams.Red, redList);
    displayTeamRoster(teams.White, whiteList);
}

function displayTeamRoster(team, listElement) {
    const forwards = team.filter(player => player.Defense !== "1");
    const defensemen = team.filter(player => player.Defense === "1");

    listElement.innerHTML += '<h3>Forwards</h3>';
    forwards.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.First} ${player.Last} (Skill: ${player.Skill})`;
        listElement.appendChild(li);
    });

    listElement.innerHTML += '<h3>Defensemen</h3>';
    defensemen.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.First} ${player.Last} (Skill: ${player.Skill})`;
        listElement.appendChild(li);
    });
}
