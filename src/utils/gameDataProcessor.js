import dbClient from './dbClient';

export const processTeam = async (teamData) => {
    let findTeamResponse = await dbClient.get('/teams', {params: {name: teamData.Nosaukums}});

    if (findTeamResponse.data.length === 0) {
        let postResponse = await dbClient.post('/teams', {name: teamData.Nosaukums});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
        
        // Izveidojam teamStats ierakstu jaunajai komandai
        await dbClient.post('/teamStats', {
            teamId: postResponse.data.id,
            gamesPlayed: 0,
            goals: 0,
            goalsAgainst: 0,
            wins: 0,
            winsOT: 0,
            losesOT: 0,
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

            // Izveidojam playerStats
            await dbClient.post('/playerStats', {
                playerId: postResponse.data.id,
                position: player.Loma,
                gamesPlayed: 0,
                gamesStarted: 0,
                minutesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                goalsAgainst: 0 // Vārstargu statistikas rādītājs - ielaistie vārti
            })

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

    console.log('aaaa: ', dbGameObject);

    try {

        // maiņas
        let firstTeamSubstitutions = gameData.Komanda[0].Mainas;
        if (typeof(firstTeamSubstitutions) === "object") {
            if (Array.isArray(firstTeamSubstitutions.Maina)) {
                for (const substitution of firstTeamSubstitutions.Maina) {
                    await processSubstitution(dbGameObject.id, firstTeam.id, substitution);
                }
            } else {
                await processSubstitution(dbGameObject.id, firstTeam.id, firstTeamSubstitutions.Maina);
            }
        }
        // maiņas
        let secondTeamSubstitutions = gameData.Komanda[1].Mainas;
        if (typeof(secondTeamSubstitutions) === "object") {
            if (Array.isArray(secondTeamSubstitutions.Maina)) {
                for (const substitution of secondTeamSubstitutions.Maina) {
                    await processSubstitution(dbGameObject.id, secondTeam.id, substitution);
                }
            } else {
                await processSubstitution(dbGameObject.id, secondTeam.id, secondTeamSubstitutions.Maina);
            }
        }

        // apstrādā pirmās komandas gameEvents
        // sodi
        // vārti
        let firstTeamGoals = gameData.Komanda[0].Varti;
        if (typeof(firstTeamGoals) === "object") {
            if (Array.isArray(firstTeamGoals.VG)) {
                for (const goal of firstTeamGoals.VG) {
                    await processGoal(dbGameObject.id, firstTeam.id, firstTeamPlayers, goal);
                }
            } else {
                await processGoal(dbGameObject.id, firstTeam.id, firstTeamPlayers, firstTeamGoals.VG);
            }
        }



        // apstrādā otrās komandas gameEvents
        // sodi
        // vārti
        let secondTeamGoals = gameData.Komanda[1].Varti;
        if (typeof(secondTeamGoals) === "object") {
            if (Array.isArray(secondTeamGoals.VG)){
                for (const goal of secondTeamGoals.VG) {
                    await processGoal(dbGameObject.id, secondTeam.id, secondTeamPlayers, goal);
                }
            } else {
                await processGoal(dbGameObject.id, secondTeam.id, secondTeamPlayers, secondTeamGoals.VG);
            }
        }


        // Apstrādā goalieStats
        // Salīdzina abu komandu sniegumus un papildina teamStats
    } catch (err) {
        await dbClient.delete('/games/' + dbGameObject.id); // Ja ir notikusi kļūda apstrādājot spēles notikumus, tad izdzēš spēli, lai protokolu būtu iespējams augšupielādēt vēlreiz
        console.error(err);
        throw err;
    }
}

const processSubstitution = async (gameId, teamId, substitutionData) => {
    console.log({gameId, teamId, substitutionData});

    // Izveido maiņas notikumu
    await dbClient.post('/gameEvents', {
        gameId: gameId,
        teamId: teamId,
        offPlayer: substitutionData.Nr1,
        onPlayer: substitutionData.Nr2,
        type: 'S',
        time: substitutionData.Laiks
    });
}

const processGoal = async (gameId, teamId, players, goalData) => {
    console.log('gooal: ', {players, goalData});
    let assists = [];

    // Apstrādā rezultatīvās piespēles
    if (goalData.P && typeof (goalData.P) === "object") {
        if (Array.isArray(goalData.P)) {
            for (const assist of goalData.P) {
                assists.push(players.filter(player => parseInt(assist.Nr) === parseInt(player.nr))[0].id);
            }
        } else {
            assists.push(players.filter(player => parseInt(goalData.P.Nr) === parseInt(player.nr))[0].id);
        }
    }

    // Izveido vārtu gūšanas notikumu
    await dbClient.post('/gameEvents', {
        gameId: gameId,
        teamId: teamId,
        playerId: players.filter(player => parseInt(goalData.Nr) === parseInt(player.nr))[0].id,
        type: 'G',
        time: goalData.Laiks,
        assists: assists,
        goalType: goalData.Sitiens
    });

    // Apstrādā spēlētāju statistikas - vārti un piespēles
    for (const assister of assists) {
        let statsBeforeRequest = await dbClient.get('/playerStats', {params: {playerId: assister}});
        statsBeforeRequest = statsBeforeRequest.data[0];
        console.log('stats before request: ', statsBeforeRequest);
        await dbClient.patch(`/playerStats/${statsBeforeRequest.id}`, {...statsBeforeRequest, assists: statsBeforeRequest.assists + 1});
    }

    // Vārtus ieskaita vārtu guvējam

    // Vārtu zaudējumu ieskaita vārstargam, kas tajā brīdī atrodas laukumā
}

/**
 * Nosaka, vai pirmais ievadītais laiks ir pēc otrā laika
 */
const compareTime = (firstTime, secondTime) => {
    console.log({firstTime, secondTime});
}

export default {
    processTeam,
    processPlayers,
    processMainReferee,
    processAssistantReferees,
    processGame
};
