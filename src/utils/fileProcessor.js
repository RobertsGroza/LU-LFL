import moment from 'moment';
import dbClient from './dbClient';
import { processTeam, processPlayers, processMainReferee, processAssistantReferees, processGame } from './dataProcessor'

const getFileJSON = file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(JSON.parse(reader.result));
});

const fileProcessor = async (fileList) => {
    for (const [index, file] of fileList.entries()) {
        console.info(`Apstrādā ${index + 1}. protokolu no ${fileList.length}`);

        let data = await getFileJSON(file.originFileObj);
        let result = await processJSON(data);

        await dbClient.post('/protocolHistory', {
            time: moment().format('DD.MM.YYYY HH:mm:ss'),
            fileName: file.name,
            status: result.successful ? 'success' : 'error',
            error: result.error
        });
    }
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
        let findGameResponse = await dbClient.get('/games', {params: {
            date: data.Spele.Laiks,
            team1Id: [firstTeam.id, secondTeam.id],
            team2Id: [firstTeam.id, secondTeam.id],
            deleted: false
        }});
        
        // Ja spēle nav apstrādāta, tad veic apstrādi
        if (findGameResponse.data.length === 0) {
            // Apstrādājam spēlētājus
            let firstTeamPlayers = await processPlayers(firstTeam.Speletaji.Speletajs, firstTeam.id);
            let secondTeamPlayers = await processPlayers(secondTeam.Speletaji.Speletajs, secondTeam.id);

            // Apstrādājam tiesnešus
            let mainReferee = await processMainReferee(data.Spele.VT);
            let assistantReferees = await processAssistantReferees(data.Spele.T);

            await processGame(data.Spele, firstTeam, firstTeamPlayers, secondTeam, secondTeamPlayers, mainReferee, assistantReferees);

            return {successful: true, error: null};
        } else {
            return {successful: false, error: 'Protokols par šo spēli ir bijis apstrādāts!'};
        }
    } catch (err) {
        console.error(err);
        return {successful: false, error: 'Notikusi kļūda apstrādājot protokolu!'};
    }
}

export default fileProcessor;
