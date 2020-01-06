import React, {useState, useEffect} from 'react';
import dbClient from 'utils/dbClient';
import { Tabs, Table } from 'antd';
import { scoringLeadersColumns, rudestPlayersColumns, playerStatsColumns } from './columns';

const { TabPane } = Tabs;

const Stats = () => {
    const [scoringLeaders, setScoringLeaders] = useState([]);
    const [rudestPlayers, setRudestPlayers] = useState([]);
    const [playerStats, setPlayerStats] = useState([]);
    const [scoringLeadersLoading, setScoringLeadersLoading] = useState(false);
    const [rudestPlayersLoading, setRudestPlayersLoading] = useState(false);
    const [playerStatsLoading, setPlayerStatsLoading] = useState(false);

    useEffect(() => {
        loadScoringLeaders();
    }, []);

    const loadScoringLeaders = async() => {
        setScoringLeadersLoading(true);
        let players = await dbClient('/players');
        let playerStatsResponse = await dbClient('/playerStats?_sort=goals,assists&_order=desc,desc&_limit=10');    // Iegūst spēlētāju statistikas rādītājus dilstošā secībā pēc vārtiem, piespēlēm
        players = players.data;
        playerStatsResponse = playerStatsResponse.data;
        setScoringLeaders(playerStatsResponse.map((el, index) => {
            let player = players.filter(player => player.id === el.playerId)[0];
            return ({
                ...el,
                place: index + 1,
                player: `${player.name} ${player.lastName}`
            });
        }));
        setScoringLeadersLoading(false);
    }

    const loadRudestPlayers = async() => {
        setRudestPlayersLoading(true);
        let players = await dbClient('/players');
        let playerStatsResponse = await dbClient('/playerStats');
        players = players.data;
        playerStatsResponse = playerStatsResponse.data;

        // Katram spēlētājam aprēķina to cik reizes viņš pārkāpis noteikumus
        let rudestPlayers = playerStatsResponse
            .map((el) => {
                let player = players.filter(player => player.id === el.playerId)[0];
                return ({
                    ...el,
                    player: `${player.name} ${player.lastName}`,
                    fouls: el.yellowCards + el.redCards * 2
                })
            })
            .sort((a, b) => a.fouls > b.fouls ? -1 : 1)
            .slice(0, 10).map((el, index) => ({...el, place: index + 1}));  

        setRudestPlayers(rudestPlayers); // Sakārto spēlētājus dilstošā secībā pēc pārkāpumiem un paņem 10 rupjākos
        setRudestPlayersLoading(false);
    }

    const loadPlayerStats = async() => {

    }

    const tabChanged = (key) => {
        switch(key) {
            case "1":
                loadScoringLeaders();
                break;
            case "2":
                loadRudestPlayers();
                break;
            case "3":
                loadPlayerStats();
                break;
        }
    }

    return <>
        <h1>Spēlētāju statistika</h1>
        <Tabs defaultActiveKey="1" onChange={tabChanged} type="card">
            <TabPane tab="10 Rezultatīvākie spēlētāji" key="1">
                <Table
                    style={{paddingTop: '5px', paddingBottom: '35px'}}
                    dataSource={scoringLeaders}
                    columns={scoringLeadersColumns}
                    loading={scoringLeadersLoading}
                    rowKey='id'
                    pagination={false}
                />
            </TabPane>
            <TabPane tab="10 Rupjākie spēlētāji" key="2">
                <Table
                    style={{paddingTop: '5px', paddingBottom: '35px'}}
                    dataSource={rudestPlayers}
                    columns={rudestPlayersColumns}
                    loading={rudestPlayersLoading}
                    rowKey='id'
                    pagination={false}
                />
            </TabPane>
            <TabPane tab="Pilna spēlētāju statistika" key="3">
                <Table
                    style={{paddingTop: '5px', paddingBottom: '35px'}}
                    dataSource={playerStats}
                    columns={playerStatsColumns}
                    loading={playerStatsLoading}
                    rowKey='id'
                />
            </TabPane>
        </Tabs>
    </>
}

export default Stats;
