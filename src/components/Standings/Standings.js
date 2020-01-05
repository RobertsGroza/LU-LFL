import React, {useState, useEffect} from 'react';
import dbClient from 'utils/dbClient';
import { Spin, Table } from 'antd';

const Standings = () => {
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTeamStats();
    }, []);

    const loadTeamStats = async () => {
        setLoading(true);
        let teams = await dbClient('/teams');
        let teamStats = await dbClient('/teamStats?_sort=points,wins&_order=desc,desc');    // Iegūst komandas dilstošā secībā pēc punktiem (ja punkti vienādi, tad pēc uzvarām pamatlaikā)
        teams = teams.data;
        teamStats = teamStats.data;
        setTableData(teamStats.map(el => ({...el, teamName: teams.filter(team => team.id === el.teamId)[0].name})));
        setLoading(false);
    }

    const columns = [
        {
            title: 'Komanda',
            dataIndex: 'teamName',
            key: 'teamName',
        },
        {
            title: 'GP',
            dataIndex: 'gamesPlayed',
            key: 'gamesPlayed'
        },
        {
            title: 'W',
            dataIndex: 'wins',
            key: 'wins'
        },
        {
            title: 'OTW',
            dataIndex: 'winsOT',
            key: 'winsOT'
        },
        {
            title: 'OTL',
            dataIndex: 'losesOT',
            key: 'losesOT'
        },
        {
            title: 'L',
            dataIndex: 'loses',
            key: 'loses'
        },
        {
            title: 'G',
            dataIndex: 'goals',
            key: 'goals'
        },
        {
            title: 'GA',
            dataIndex: 'goalsAgainst',
            key: 'goalsAgainst'
        },
        {
            title: 'PTS',
            dataIndex: 'points',
            key: 'points'
        }
    ];

    return <>
        <h1>Turnīra tabula</h1>
        <Table
            style={{paddingTop: '5px', paddingBottom: '35px'}}
            dataSource={tableData}
            columns={columns}
            loading={loading}
            rowKey='id'
            pagination={false}
        />

    </>
}

export default Standings;
