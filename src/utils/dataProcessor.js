import dbClient from './dbClient';
import { processFoul, processGoal, processSubstitution, processTeamAndPlayerStats } from './statsProcessor';

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
                position: player.Loma,
                teamId: teamId
            })

            // Izveidojam playerStats
            await dbClient.post('/playerStats', {
                playerId: postResponse.data.id,
                teamId: teamId,
                position: player.Loma,
                gamesPlayed: 0,
                gamesStarted: 0,
                timePlayed: "00:00",
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
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
        assistantReferees: assistantReferees.map(ref => ref.id),
        deleted: false
    });

    let dbGameObject = postResponse.data;

    try {
        let firstTeamSubstitutions = gameData.Komanda[0].Mainas;
        let secondTeamSubstitutions = gameData.Komanda[1].Mainas;
        let firstTeamFouls = gameData.Komanda[0].Sodi;
        let secondTeamFouls = gameData.Komanda[1].Sodi;
        let firstTeamGoals = gameData.Komanda[0].Varti;
        let secondTeamGoals = gameData.Komanda[1].Varti;

        // Apstrādā abu komandu maiņas
        if (typeof(firstTeamSubstitutions) === "object") {
            if (Array.isArray(firstTeamSubstitutions.Maina)) {
                for (const substitution of firstTeamSubstitutions.Maina) {
                    await processSubstitution(dbGameObject.id, firstTeam.id, firstTeamPlayers, substitution);
                }
            } else {
                await processSubstitution(dbGameObject.id, firstTeam.id, firstTeamPlayers, firstTeamSubstitutions.Maina);
            }
        }

        if (typeof(secondTeamSubstitutions) === "object") {
            if (Array.isArray(secondTeamSubstitutions.Maina)) {
                for (const substitution of secondTeamSubstitutions.Maina) {
                    await processSubstitution(dbGameObject.id, secondTeam.id, secondTeamPlayers, substitution);
                }
            } else {
                await processSubstitution(dbGameObject.id, secondTeam.id, secondTeamPlayers, secondTeamSubstitutions.Maina);
            }
        }

        // Apstrādā abu komandu noteikumu pārkāpumus
        if (typeof(firstTeamFouls) === "object") {
            if (Array.isArray(firstTeamFouls.Sods)) {
                for (const foul of firstTeamFouls.Sods) {
                    await processFoul(dbGameObject.id, firstTeam.id, firstTeamPlayers, foul);
                }
            } else {
                await processFoul(dbGameObject.id, firstTeam.id, firstTeamPlayers, firstTeamFouls.Sods);
            }
        }

        if (typeof(secondTeamFouls) === "object") {
            if (Array.isArray(secondTeamFouls.Sods)) {
                for (const foul of secondTeamFouls.Sods) {
                    await processFoul(dbGameObject.id, secondTeam.id, secondTeamPlayers, foul);
                }
            } else {
                await processFoul(dbGameObject.id, secondTeam.id, secondTeamPlayers, secondTeamFouls.Sods);
            }
        }

        // apstrādā abu komandu gūtos vārtus
        if (typeof(firstTeamGoals) === "object") {
            if (Array.isArray(firstTeamGoals.VG)) {
                for (const goal of firstTeamGoals.VG) {
                    await processGoal(dbGameObject.id, firstTeam.id, firstTeamPlayers, goal);
                }
            } else {
                await processGoal(dbGameObject.id, firstTeam.id, firstTeamPlayers, firstTeamGoals.VG);
            }
        }

        if (typeof(secondTeamGoals) === "object") {
            if (Array.isArray(secondTeamGoals.VG)){
                for (const goal of secondTeamGoals.VG) {
                    await processGoal(dbGameObject.id, secondTeam.id, secondTeamPlayers, goal);
                }
            } else {
                await processGoal(dbGameObject.id, secondTeam.id, secondTeamPlayers, secondTeamGoals.VG);
            }
        }
    } catch (err) {
        // Ja ir notikusi kļūda apstrādājot spēles notikumus, tad izdzēš spēli, lai protokolu būtu iespējams augšupielādēt vēlreiz, bet izdzēš "mīksti", lai jaunās spēles id būtu atšķirīgs
        await dbClient.patch(`/games/${dbGameObject.id}`, {...dbGameObject, deleted: true});

        console.error(err);
        throw err;
    }

    await processTeamAndPlayerStats(dbGameObject);
}

export default {
    processTeam,
    processPlayers,
    processMainReferee,
    processAssistantReferees,
    processGame
};
