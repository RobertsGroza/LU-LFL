import {compareTime} from 'utils/timeMethods';

export const scoringLeadersColumns = [
    {
        title: 'Vieta',
        dataIndex: 'place',
        key: 'place',
    },
    {
        title: 'Spēlētājs',
        dataIndex: 'player',
        key: 'player',
    },
    {
        title: 'Piespēles',
        dataIndex: 'assists',
        key: 'assists'
    },
    {
        title: 'Vārti',
        dataIndex: 'goals',
        key: 'goals'
    }
];

export const rudestPlayersColumns = [
    {
        title: 'Vieta',
        dataIndex: 'place',
        key: 'place',
    },
    {
        title: 'Spēlētājs',
        dataIndex: 'player',
        key: 'player',
    },
    {
        title: 'Dzeltenās kartītes',
        dataIndex: 'yellowCards',
        key: 'yellowCards'
    },
    {
        title: 'Sarkanās kartītes',
        dataIndex: 'redCards',
        key: 'redCards'
    },
    {
        title: 'Noteikumu pārkāpumi',
        dataIndex: 'fouls',
        key: 'fouls'
    },
];

export const playerStatsColumns = (teams) => [
    {
        title: 'Spēlētājs',
        dataIndex: 'player',
        key: 'player',
    },
    {
        title: 'Komanda',
        dataIndex: 'team',
        key: 'team',
        filters: teams.map(team => ({text: team.name, value: team.name})),
        onFilter: (value, record) => record.team === value
    },
    {
        title: 'Pozīcija',
        dataIndex: 'position',
        key: 'position',
        filters: [
            { text: "U", value: "U" },
            { text: "A", value: "A" },
            { text: "V", value: "V" },
        ],
        onFilter: (value, record) => record.position === value
    },
    {
        title: 'P',
        dataIndex: 'assists',
        key: 'assists',
        sorter: (a, b) => a.assists - b.assists,
    },
    {
        title: 'V',
        dataIndex: 'goals',
        key: 'goals',
        sorter: (a, b) => a.goals - b.goals,
    },
    {
        title: 'S',
        dataIndex: 'gamesPlayed',
        key: 'gamesPlayed',
        sorter: (a, b) => a.gamesPlayed - b.gamesPlayed,
    },
    {
        title: 'SS',
        dataIndex: 'gamesStarted',
        key: 'gamesStarted',
        sorter: (a, b) => a.gamesStarted - b.gamesStarted,
    },
    {
        title: 'L',
        dataIndex: 'timePlayed',
        key: 'timePlayed',
        sorter: (a, b) => compareTime(a.timePlayed, b.timePlayed) ? 1 : -1
    },
    {
        title: 'DZK',
        dataIndex: 'yellowCards',
        key: 'yellowCards',
        sorter: (a, b) => a.yellowCards - b.yellowCards,
    },
    {
        title: 'SK',
        dataIndex: 'redCards',
        key: 'redCards',
        sorter: (a, b) => a.yellowCards - b.yellowCards,
    },
];

export default {
    scoringLeadersColumns,
    rudestPlayersColumns,
    playerStatsColumns
};
