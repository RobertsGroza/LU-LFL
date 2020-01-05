import dbClient from './dbClient';

export const processTeam = async (teamData) => {
    let findTeamResponse = await dbClient.get('/teams', {params: {name: teamData.Nosaukums}});

    if (findTeamResponse.data.length === 0) {
        let postResponse = await dbClient.post('/teams', {name: teamData.Nosaukums});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
        
        // Izveidojam teamStats ierakstu jaunajai komandai
        await dbClient.post('/teamStats', {
            teamId: postResponse.data.id,
            gamesPlayed: 0,
            wins: 0,
            OTWins: 0,
            OTLoses: 0,
            loses: 0,
            points: 0
        })

        teamData.id = postResponse.data.id;
    } else {
        teamData.id = findTeamResponse.data[0].id; 
    }

    return teamData;
}

export const processPlayers = async (playerData, teamId) => {
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

            // Izveidojam playerStats vai goalieStats ierakstu jaunajam spēlētājam (atkarībā no pozīcijas)
            if (player.Loma === 'V') {
                await dbClient.post('/goalieStats', {
                    playerId: postResponse.data.id,
                    goalsAgainst: 0,
                    gamesPlayed: 0
                })
            } else {
                await dbClient.post('/playerStats', {
                    playerId: postResponse.data.id,
                    gamesPlayed: 0,
                    gamesStarted: 0,
                    minutesPlayed: 0,
                    goals: 0,
                    assists: 0,
                    yellowCards: 0,
                    redCards: 0
                })
            }

            teamPlayers.push(postResponse.data);   // nodrošina, ka arī jaunie spēlētāji ir ielasīti data objektā (vēlāk varēs tikt izmantots statistikas apstrādāšanai)
        }
    }

    return teamPlayers;
}

export const processMainReferee = async (mainReferee) => {
    let findMainRefereeResponse = await dbClient.get('/referees', {params: {name: mainReferee.Vards, lastName: mainReferee.Uzvards}});

    if (findMainRefereeResponse.data.length === 0) {
        let postResponse = await dbClient.post('/referees', {name: mainReferee.Vards, lastName: mainReferee.Uzvards});  // Ja datu bāzē nav ieraksta par tiesnesi, tad izveido tādu
        mainReferee.id = postResponse.data.id;
    } else {
        mainReferee.id = findMainRefereeResponse.data[0].id; 
    }

    return mainReferee;
}

export const processAssistantReferees = async (referees) => {
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

export const processGame = async (gameData, firstTeam, firstTeamPlayers, secondTeam, secondTeamPlayers, mainReferee, assistantReferees) => {
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

export default {
    processTeam,
    processPlayers,
    processMainReferee,
    processAssistantReferees,
    processGame
};
