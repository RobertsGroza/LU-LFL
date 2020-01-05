import React, {useState, useEffect} from 'react';
import dbClient from 'utils/dbClient';
import './Home.css';
import moment from 'moment';
import { Spin, Row, Col } from 'antd';

const Home = () => {
    const [actualGames, setActualGames] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadActualGames();
    }, []);

    const loadActualGames = async () => {
        setLoading(true);
        let teamsResponse = await dbClient('/teams');   // Ielasa komandas, lai varētu veiksmīgi atrādīt komandu nosaukumus, kas piedalās aktuālajās spēlēs
        setTeams(teamsResponse.data);
        let games = await dbClient('/games');
        games = games.data.sort((a, b) => (new Date(a.date) > new Date(b.date)) ? -1 : 1);  // Sakārto spēles distošā secībā pēc notikšanas laika
        setActualGames(games.slice(0, 3));  // Uzstāda 3 jaunākās spēles kā aktuālās
        setLoading(false);
    }

    return <>
        <div className="banner">
            <img src="background.jpg" alt="background"/>
            <h1>LIELĀ FUTBOLA LĪGA</h1>
        </div>
        <Spin spinning={loading} size="large">
            {actualGames.length > 0 ?
                <>
                    <h1 style={{fontSize: '48px', textAlign: 'center'}}>Aktuālās spēles</h1>
                    {actualGames.map(game =>
                        <div className="game-row">
                            <h5>{moment(game.date).format("DD.MM.YYYY")}</h5>
                            <p>{game.arena}</p>
                            <Row type="flex" align="middle">
                                <Col span={4} offset={7} style={{textAlign: 'center'}}>
                                    <h1>{teams.filter(team => team.id === game.team1Id)[0].name}</h1>
                                    <h3>{game.team1Goals}</h3>
                                </Col>
                                <Col span={2} style={{textAlign: 'center'}}>
                                    <h1>:</h1>
                                </Col>
                                <Col span={4} style={{textAlign: 'center'}}>
                                    <h1>{teams.filter(team => team.id === game.team2Id)[0].name}</h1>
                                    <h3>{game.team2Goals}</h3>
                                </Col>
                            </Row>
                        </div>
                    )}
                </>
            : 
                null
            }
        </Spin>
    </>
}

export default Home;
