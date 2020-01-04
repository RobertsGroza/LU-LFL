import axios from 'axios';

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
        await processJSON(data);
    }
}

const processJSON = async (data) => {
    // Apstrādājam komandas
    console.log('data: ', data);

    let firstTeam = data.Spele.Komanda[0];
    let secondTeam = data.Spele.Komanda[1];

    // Apstrādājam pirmo komandu
    let firstTeamRecordResponse = await dbClient.get('/teams', {params: {name: firstTeam.Nosaukums}});

    if (firstTeamRecordResponse.data.length === 0) {
        let postResponse = await dbClient.post('/teams', {name: firstTeam.Nosaukums});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
        firstTeam.id = postResponse.data.id;
    } else {
        firstTeam.id = firstTeamRecordResponse.data[0].id; 
    }

    // Apstrādājam otro komandu
    let secondTeamRecordResponse = await dbClient.get('/teams', {params: {name: secondTeam.Nosaukums}});

    if (secondTeamRecordResponse.data.length === 0) {
        let postResponse = await dbClient.post('/teams', {name: secondTeam.Nosaukums});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
        secondTeam.id = postResponse.data.id;
    } else {
        secondTeam.id = secondTeamRecordResponse.data[0].id; 
    }

    // Apstrādājam spēlētājus
    // Pirmās komandas spēlētāji
    // Datubāzē atrod visus komandas spēlētājus... Tālāk iterē cauri norādītajiem spēlētājiem, un ja spēlētājs netiek atrasts datubāzes komandas spēlētājos, tad tas tiek pievienots
    let firstTeamPlayersResponse = await dbClient.get('/players', {params: {teamId: firstTeam.id}});
    let firstTeamPlayers = firstTeamPlayersResponse.data;
    for (const player of firstTeam.Speletaji.Speletajs) {
        let playerExists = firstTeamPlayers.find(el => parseInt(el.nr) === parseInt(player.Nr));
        if (!playerExists) {
            let postResponse = await dbClient.post('/players', {
                name: player.Vards,
                lastName: player.Uzvards,
                nr: player.Nr,
                role: player.Loma,
                teamId: firstTeam.id
            })
            firstTeamPlayers.push(postResponse.data);   // nodrošina, ka arī jaunie spēlētāji ir ielasīti teamPlayers objektā (vēlāk varēs tikt izmantots statistikas apstrādāšanai)
        }
    }

    // Otrās komandas spēlētāji
    let secondTeamPlayersResponse = await dbClient.get('/players', {params: {teamId: secondTeam.id}});
    let secondTeamPlayers = secondTeamPlayersResponse.data;
    for (const player of secondTeam.Speletaji.Speletajs) {
        let playerExists = secondTeamPlayers.find(el => parseInt(el.nr) === parseInt(player.Nr));
        if (!playerExists) {
            let postResponse = await dbClient.post('/players', {
                name: player.Vards,
                lastName: player.Uzvards,
                nr: player.Nr,
                role: player.Loma,
                teamId: secondTeam.id
            })
            secondTeamPlayers.push(postResponse);   // nodrošina, ka arī jaunie spēlētāji ir ielasīti teamPlayers objektā (vēlāk varēs tikt izmantots statistikas apstrādāšanai)
        }
    }
    
    console.log('Teams & players: ', {firstTeam, secondTeam, firstTeamPlayers, secondTeamPlayers});   // Šinī momentā mums vajadzētu būt tā, ka ir pieejami visi spēlētāji jau ar id'iem

    // Apstrādājam tiesnešus
    // Apstrādājam galveno tiesnesi
    let mainReferee = data.Spele.VT;
    let assistantReferees = data.Spele.T;

    let findMainRefereeResponse = await dbClient.get('/referees', {params: {name: data.Spele.VT.Vards, lastName: data.Spele.VT.Uzvards}});
    if (findMainRefereeResponse.data.length === 0) {
        let postResponse = await dbClient.post('/referees', {name: data.Spele.VT.Vards, lastName: data.Spele.VT.Uzvards});  // Ja datu bāzē nav ieraksta par tiesnesi, tad izveido tādu
        mainReferee.id = postResponse.data.id;
    } else {
        mainReferee.id = findMainRefereeResponse.data[0].id; 
    }

    // Apstrādājma asistentus
    for (const [index, referee] of assistantReferees.entries()) {
        let findRefereeResponse = await dbClient.get('/referees', {params: {name: referee.Vards, lastName: referee.Uzvards}});

        if (findRefereeResponse.data.length === 0) {
            let postResponse = await dbClient.post('/referees', {name: referee.Vards, lastName: referee.Uzvards});  // Ja datu bāzē nav ieraksta par komandu, tad izveido tādu
            assistantReferees[index].id = postResponse.data.id;
        } else {
            assistantReferees[index].id = findRefereeResponse.data[0].id; 
        }
    }

    console.log('refereees: ', {mainReferee, assistantReferees});

    // Apstrādajam spēles
    // Spēļu parādīšanos datubāzē jāčeko pēc datuma un pēc abām iesaisītajām komandām
}

export default fileProcessor;
