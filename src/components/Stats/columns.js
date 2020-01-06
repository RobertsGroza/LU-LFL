import React from 'react';

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

export const playerStatsColumns = [
    {
        title: 'Spēlētājs',
        dataIndex: 'teamName',
        key: 'teamName',
    },
];

export default {
    scoringLeadersColumns,
    rudestPlayersColumns,
    playerStatsColumns
};
