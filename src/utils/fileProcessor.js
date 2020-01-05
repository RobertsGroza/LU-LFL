import axios from 'axios';
import moment from 'moment';

const dbClient = axios.create({
    baseURL: process.env.REACT_APP_DB_URL
});

const getFileJSON = file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(JSON.parse(reader.result));
});

const fileProcessor = async (fileList) => {
    for (const file of fileList) {
        let data = await getFileJSON(file.originFileObj);
        console.log({data, file});
        let result = await processJSON(data);

        await dbClient.post('/protocolHistory', {
            time: moment().format('DD.MM.YYYY HH:mm:ss'),
            fileName: file.name,
            status: result.successful ? 'success' : 'error',
            error: result.error
        });
    }
}

const processTeam = async (teamData) => {
    let findTeamResponse = await dbClient.get('/teams', {params: {name: teamData.Nosaukums}});

    if (findTeamResponse.data.length === 0) {
        let postResponse = await dbClient.post('/teams', {name: teamData.Nosaukums});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
        teamData.id = postResponse.data.id;
    } else {
        teamData.id = findTeamResponse.data[0].id; 
    }

    return teamData;
}

const processPlayers = async (playerData, teamId) => {
    let teamPlayersResponse = await dbClient.get('/players', {params: {teamId: teamId}});   // Iegūst visus komandas datubāzē saglabātos spēlētājus
    let teamPlayers = teamPlayersResponse.data;

    for (const player of playerData) {
        let playerExists = teamPlayers.find(el => parseInt(el.nr) === parseInt(player.Nr));
        if (!playerExists) {
            let postResponse = await dbClient.post('/players', {
                name: player.Vards,
                lastName: player.Uzvards,
                nr: player.Nr,
                role: player.Loma,
                teamId: teamId
            })
            teamPlayers.push(postResponse.data);   // nodrošina, ka arī jaunie spēlētāji ir ielasīti data objektā (vēlāk varēs tikt izmantots statistikas apstrādāšanai)
        }
    }

    return teamPlayers;
}

const procerssMainReferee = async (mainReferee) => {
    let findMainRefereeResponse = await dbClient.get('/referees', {params: {name: mainReferee.Vards, lastName: mainReferee.Uzvards}});

    if (findMainRefereeResponse.data.length === 0) {
        let postResponse = await dbClient.post('/referees', {name: mainReferee.Vards, lastName: mainReferee.Uzvards});  // Ja datu bāzē nav ieraksta par tiesnesi, tad izveido tādu
        mainReferee.id = postResponse.data.id;
    } else {
        mainReferee.id = findMainRefereeResponse.data[0].id; 
    }

    return mainReferee;
}

const processAssistantReferees = async (referees) => {
    for (const [index, referee] of referees.entries()) {
        let findRefereeResponse = await dbClient.get('/referees', {params: {name: referee.Vards, lastName: referee.Uzvards}});

        if (findRefereeResponse.data.length === 0) {
            let postResponse = await dbClient.post('/referees', {name: referee.Vards, lastName: referee.Uzvards});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
            referees[index].id = postResponse.data.id;
        } else {
            referees[index].id = findRefereeResponse.data[0].id; 
        }
    }

    return referees;
}

const processGame = async (gameData, firstTeam, firstTeamPlayers, secondTeam, secondTeamPlayers, mainReferee, assistantReferees) => {
    console.log({gameData, firstTeam, firstTeamPlayers, secondTeam, secondTeamPlayers});

    let postResponse = await dbClient.post('/games', {
        date: gameData.Laiks,
        attendees: gameData.Skatitaji,
        arena: gameData.Vieta,
        team1Id: firstTeam.id,
        team2Id: secondTeam.id,
        team1Starters: firstTeam.Pamatsastavs.Speletajs.map(el => {
            let test = firstTeamPlayers.filter(player => parseInt(player.nr) === parseInt(el.Nr))
            return Array.isArray(test) && test[0] && test[0].id;
        }),
        team2Starters: secondTeam.Pamatsastavs.Speletajs.map(el => {
            let test = secondTeamPlayers.filter(player => parseInt(player.nr) === parseInt(el.Nr))
            return Array.isArray(test) && test[0] && test[0].id;
        }),
        mainRefereeId: mainReferee.id,
        assistantReferees: assistantReferees.map(ref => ref.id)
    });

    let dbGameObject = postResponse.data;

    // process game events && stats
}

const processJSON = async (data) => {
    try {
        // Šeit vajadzētu, ka pārbauda iesaistītās komandas un datumu, lai noskaidrotu, vai spēle jau nav ierakstīta datubāzē
        let firstTeam = data.Spele.Komanda[0];
        let secondTeam = data.Spele.Komanda[1];

        // Apstrādājam abas komandas un iegūstam to id datubāzē, lai varētu meklēt, vai spēle eksistē
        firstTeam = await processTeam(firstTeam);
        secondTeam = await processTeam(secondTeam);

        // Apstrādajam spēles un čeko vai spēle eksistē
        let findGameResponse = await dbClient.get('/games', {params: {date: data.Spele.Laiks, team1Id: [firstTeam.id, secondTeam.id], team2Id: [firstTeam.id, secondTeam.id]}});
        
        // Ja spēle nav apstrādāta, tad veic apstrādi
        if (findGameResponse.data.length === 0) {
            // Apstrādājam spēlētājus
            let firstTeamPlayers = await processPlayers(firstTeam.Speletaji.Speletajs, firstTeam.id);
            let secondTeamPlayers = await processPlayers(secondTeam.Speletaji.Speletajs, secondTeam.id);

            // Apstrādājam tiesnešus
            let mainReferee = await procerssMainReferee(data.Spele.VT);
            let assistantReferees = await processAssistantReferees(data.Spele.T);

            await processGame(data.Spele, firstTeam, firstTeamPlayers, secondTeam, secondTeamPlayers, mainReferee, assistantReferees);

            return {successful: true, error: null};
        } else {
            return {successful: false, error: 'Protokols par šo spēli ir bijis apstrādāts!'};
        }
    } catch (err) {
        return {successful: false, error: 'Notikusi kļūda apstrādājot protokolu!'};
    }
}

export default fileProcessor;
