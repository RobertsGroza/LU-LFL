import React, {useState, useEffect} from 'react';
import dbClient from 'utils/dbClient';
import { Table, Tooltip } from 'antd';

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
            title: <Tooltip title="Spēles">S</Tooltip>,
            dataIndex: 'gamesPlayed',
            key: 'gamesPlayed'
        },
        {
            title: <Tooltip title="Uzvaras">U</Tooltip>,
            dataIndex: 'wins',
            key: 'wins'
        },
        {
            title: <Tooltip title="Uzvaras papildlaikā">UP</Tooltip>,
            dataIndex: 'winsOT',
            key: 'winsOT'
        },
        {
            title: <Tooltip title="Zaudējumi papildlaikā">ZP</Tooltip>,
            dataIndex: 'losesOT',
            key: 'losesOT'
        },
        {
            title: <Tooltip title="Zaudējumi">Z</Tooltip>,
            dataIndex: 'loses',
            key: 'loses'
        },
        {
            title: <Tooltip title="Gūtie vārti">GV</Tooltip>,
            dataIndex: 'goals',
            key: 'goals'
        },
        {
            title: <Tooltip title="Zaudētie vārti">ZV</Tooltip>,
            dataIndex: 'goalsAgainst',
            key: 'goalsAgainst'
        },
        {
            title: 'Punkti',
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
