import dbClient from './dbClient';
import {compareTime, subtractTime, addTime} from './timeMethods';

export const processSubstitution = async (gameId, teamId, players, substitutionData) => {
    let offPlayer = players.filter(player => parseInt(substitutionData.Nr1) === parseInt(player.nr))[0].id;
    let onPlayer = players.filter(player => parseInt(substitutionData.Nr2) === parseInt(player.nr))[0].id;

    await dbClient.post('/gameEvents', {
        gameId: gameId,
        teamId: teamId,
        offPlayer: offPlayer,
        onPlayer: onPlayer,
        type: 'S',
        time: substitutionData.Laiks
    });
}

export const processFoul = async (gameId, teamId, players, foulData) => {
    let playerId = players.filter(player => parseInt(foulData.Nr) === parseInt(player.nr))[0].id;

    await dbClient.post('/gameEvents', {
        gameId: gameId,
        teamId: teamId,
        playerId: playerId,
        type: 'F',
        time: foulData.Laiks
    });
}

export const processGoal = async (gameId, teamId, players, goalData) => {
    let assists = [];
    let scorersId = players.filter(player => parseInt(goalData.Nr) === parseInt(player.nr))[0].id;

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
        playerId: scorersId,
        type: 'G',
        time: goalData.Laiks,
        assists: assists,
        goalType: goalData.Sitiens
    });
}

export const processTeamAndPlayerStats = async (gameData) => {
    // No datu bāzes ielasa aktuālos datus - spēles notikumus, komandu statistikas un komandu spēlētāju statistikas
    let getAllGameEventsResponse = await dbClient.get(`/games/${gameData.id}/gameEvents`);
    let firstTeamStats = await dbClient.get(`/teams/${gameData.team1Id}/teamStats`);
    let secondTeamStats = await dbClient.get(`/teams/${gameData.team2Id}/teamStats`);
    let firstTeamPlayerStats = await dbClient.get(`/teams/${gameData.team1Id}/playerStats`);
    let secondTeamPlayerStats = await dbClient.get(`/teams/${gameData.team2Id}/playerStats`);
    firstTeamStats = firstTeamStats.data[0];
    secondTeamStats = secondTeamStats.data[0];
    firstTeamPlayerStats = firstTeamPlayerStats.data;
    secondTeamPlayerStats = secondTeamPlayerStats.data;

    let allEvents = getAllGameEventsResponse.data.sort((a, b) => compareTime(a.time, b.time) ? 1 : -1); // Sakārto visus notikumus hronoloģiskā secībā
    let allGoals = allEvents.filter(el => el.type === 'G');
    let allSubstitutions = allEvents.filter(el => el.type === 'S');
    let allFouls = allEvents.filter(el => el.type === 'F');
    let firstTeamGoals = allGoals.filter(el => el.teamId === gameData.team1Id).length;
    let secondTeamGoals = allGoals.filter(el => el.teamId === gameData.team2Id).length;
    let gameWithOvertime = compareTime(allGoals[allGoals.length - 1].time, "60:00");    // Ja pēdējie vārti gūti laikā pēc 60:00, tas nozīmē, ka spēlei bijis papildlaiks

    // Aktuālie spēles dati
    gameData = {
        ...gameData,
        team1Goals: firstTeamGoals,
        team2Goals: secondTeamGoals,
        timePlayed: gameWithOvertime ? allGoals[allGoals.length - 1].time : '60:00'
    };

    // Statistikas apstrāde
    firstTeamStats = processTeamStats(firstTeamStats, firstTeamGoals, secondTeamGoals, gameWithOvertime);
    secondTeamStats = processTeamStats(secondTeamStats, secondTeamGoals, firstTeamGoals, gameWithOvertime);
    firstTeamPlayerStats = processPlayerStats(firstTeamPlayerStats, gameData, gameData.team1Starters, allGoals, allSubstitutions, allFouls);
    secondTeamPlayerStats = processPlayerStats(secondTeamPlayerStats, gameData, gameData.team2Starters, allGoals, allSubstitutions, allFouls);

    // Augšupielādē jaunos statistikas rādītājus
    await dbClient.patch(`/games/${gameData.id}`, gameData);
    await dbClient.patch(`/teamStats/${firstTeamStats.id}`, firstTeamStats);
    await dbClient.patch(`/teamStats/${secondTeamStats.id}`, secondTeamStats);

    // Augšupielādē abu komandu visu spēlētāju statistikas
    for (const playerStats of firstTeamPlayerStats) {
        await dbClient.patch(`/playerStats/${playerStats.id}`, playerStats);
    }

    for (const playerStats of secondTeamPlayerStats) {
        await dbClient.patch(`/playerStats/${playerStats.id}`, playerStats);
    }
}

const processTeamStats = (teamStats, teamGoals, opponentGoals, gameWithOvertime) => {
    teamStats = {
        ...teamStats,
        gamesPlayed: teamStats.gamesPlayed + 1,
        goals: teamStats.goals + teamGoals,
        goalsAgainst: teamStats.goalsAgainst + opponentGoals
    };

    if (teamGoals > opponentGoals && gameWithOvertime) {
        teamStats.winsOT = teamStats.winsOT + 1;
        teamStats.points = teamStats.points + 3;
    } else if (teamGoals > opponentGoals) {
        teamStats.wins = teamStats.wins + 1;
        teamStats.points = teamStats.points + 5;
    } else if (gameWithOvertime) {
        teamStats.losesOT = teamStats.losesOT + 1;
        teamStats.points = teamStats.points + 2;
    } else {
        teamStats.loses = teamStats.loses + 1;
        teamStats.points = teamStats.points + 1;
    }

    return teamStats;
}

const processPlayerStats = (playerStats, gameData, starters, allGoals, allSubstitutions, allFouls) => {
    for (const [index, player] of playerStats.entries()) {
        let playingStartTime = null;    // laiks, kurā spēlētājs iesaistījies spēlē
        let playingEndTime = null;      // laiks, kurā spēlētājs beidzis spēlēt
        let timePlayed = "00:00";       // kopā nospēlētais laiks spēlē

        let subsIn = allSubstitutions.filter(el => el.onPlayer === player.id);      // Maiņas kurās spēlētājs ir nācis laukumā
        let subsOff = allSubstitutions.filter(el => el.offPlayer === player.id);    // Maiņas kurās spēlētājs ir nogājis no laukuma
        let playerFouls = allFouls.filter(el => el.playerId === player.id);         // Spēlētāja izdarītie pārkāpumi
        let playerGoals = allGoals.filter(el => el.playerId === player.id);         // Spēlētāja gūtie vārti, ja tādu nav tad .length atgriezīs 0
        let playerAssists = allGoals.filter(el => el.assists.includes(player.id));  // Spēlētāja izdarītās rezultatīvās piespēles, ja tādu nav tad .length atgriezīs 0

        // Saskaita nospēlētās spēles, laik + sāktās spēles pamatsastāvā
        if (starters.includes(player.id)) {
            playerStats[index].gamesStarted = player.gamesStarted + 1;
            playerStats[index].gamesPlayed = player.gamesPlayed + 1;
            playingStartTime = "00:00";

            // Ja subsOff ir > 0 tas nozīmē, ka spēlētājs ir ticis nomainīts
            if (subsOff.length > 0) {
                playingEndTime = subsOff[0].time;
                timePlayed = addTime(timePlayed, subtractTime(playingEndTime, playingStartTime));
                playingStartTime = null;    // Nozīmē, ka spēlētājs vairs nespēlē

                // Ja spēlētājs sāka sākumsastāvā un viņam ir subsIn tas nozīmē, ka spēlētājs ir vēlreiz uznācis laukumā pēc maiņas beigām
                if (subsIn.length > 0) {
                    for (const [idx, subIn] of subsIn.entries()) {
                        playingStartTime = subIn.time;
                        playingEndTime = null;
                        if (subsOff[idx + 1]) { // Apstrādā gadījuma, ja pēc atkārtotas uznākšanas treneris atkal viņu noņem no spēles
                            playingEndTime = subsOff[idx].time;
                            timePlayed = addTime(timePlayed, subtractTime(playingEndTime, playingStartTime));
                            playingStartTime = null;    // Nozīmē, ka spēlētājs vairs nespēlē
                        }
                    }
                }
            }
        } else if (subsIn.length > 0) {
            playerStats[index].gamesPlayed = player.gamesPlayed + 1;    // Ja spēlētājs kaut kurā brīdī ir ticis uzmainīts, tad tas nozīmē, ka viņš piedalās spēlē
            playingStartTime = subsIn[0].time;

            // Ja spēlētājam ir subsOff, tad tas nozīmē, ka pēc uzmainīšanas viņš ticis atkal noņemts
            if (subsOff.length > 0) {
                playingEndTime = subsOff[0].time;
                timePlayed = subtractTime(playingEndTime, playingStartTime);
                playingStartTime = null;    // Nozīmē, ka spēlētājs vairs nespēlē

                // Ja spēlētājs tika uzmainīts uz laukuma, un noņemts un viņam ir vēl viens subsIn tas nozīmē, ka spēlētājs ir vēlreiz uznācis laukumā pēc maiņas beigām
                if (subsIn.length > 1) {
                    for (const [idx, subIn] of subsIn.entries()) {
                        playingStartTime = subIn.time;
                        playingEndTime = null;
                        if (subsOff[idx]) { // Apstrādā gadījuma, ja pēc uznākšanas treneris atkal viņu noņem no spēles
                            playingEndTime = subsOff[idx].time;
                            timePlayed = addTime(timePlayed, subtractTime(playingEndTime, playingStartTime));
                            playingStartTime = null;    // Nozīmē, ka spēlētājs vairs nespēlē
                        }
                    }
                }
            }
        }

        // Saskaita nopelnītās dzeltenās un sarkanās kartītes (ja ir tikai viens ieraksts, tas nozīmē, ka spēlētājs ir beidzis spēli ar dzelteno kartīti, ja divi, tad ar sarkano)
        if (playerFouls.length === 1) {
            playerStats[index].yellowCards = player.yellowCards + 1;
        } else if (playerFouls.length === 2) {
            playerStats[index].redCards = player.redCards + 1;
            playingEndTime = playerFouls[1].time;
            timePlayed = subtractTime(playingEndTime, playingStartTime);
            playingStartTime = null;    // Nozīmē, ka spēlētājs vairs nespēlē
        }

        // Ja playingEndTime ir null, tad tas nozīmē, ka spēlētājs ir veiksmīgi nospēlējis līdz spēles beigām
        if (playingEndTime === null && playingStartTime !== null) {
            playingEndTime = gameData.timePlayed;
            timePlayed = subtractTime(playingEndTime, playingStartTime);
        }

        // Statistikai pieskaita nospēlētās minūtes + gūtos vārtus + rezultatīvās piespēles
        playerStats[index].timePlayed = addTime(player.timePlayed, timePlayed);
        playerStats[index].goals = player.goals + playerGoals.length;
        playerStats[index].assists = player.assists + playerAssists.length;
    }

    return playerStats;
}

export default {
    processSubstitution,
    processFoul,
    processGoal,
    processTeamAndPlayerStats
};
