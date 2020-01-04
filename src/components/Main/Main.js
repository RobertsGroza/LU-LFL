import React, { useContext } from "react";
import Home from 'components/Home/Home';
import Standings from 'components/Standings/Standings';
import Stats from 'components/Stats/Stats';
import Administration from 'components/Administration/Administration';
import Login from 'components/Login/Login';
import { Switch, Route, Redirect, withRouter, NavLink } from 'react-router-dom';
import { Layout, Menu, Icon, Row, Col } from 'antd';
import PrivateRoute from "PrivateRoute";
import { AuthContext } from "Auth";
import app from "../../base";
import './Main.css';

const { Header, Content, Footer } = Layout;

const Main = ({ history }) => {
  const { currentUser } = useContext(AuthContext);

  const logOut = async () => {
    await app.auth().signOut();
    history.push("/");
  }

  return <>
    <Layout style={{ height: '100vh' }}>
      <Header>
        <div className="logo">
          <img src="ball.png" height="30"/>
          <p>LFL</p>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          style={{ lineHeight: '64px' }}
        >
          <Menu.Item key="1">
              <NavLink to="/">
                  Sākums
              </NavLink>
          </Menu.Item>
          <Menu.Item key="2">
              <NavLink to="/standings">
                  Turnīra tabula
              </NavLink>
          </Menu.Item>
          <Menu.Item key="3">
              <NavLink to="/stats">
                  Spēlētāju statistika
              </NavLink>
          </Menu.Item>
          {
            currentUser ?
              <Menu.Item key="4">
                <NavLink to="/admin">
                    Administrācija
                </NavLink>
              </Menu.Item>
            : null
          }
          {
            currentUser ?
              <Menu.Item key="5" style={{float: 'right'}} onClick={() => logOut()}>
                <Icon type="logout" />
                Iziet
              </Menu.Item>
            : null
          }
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Row>
          <Col span={20} offset={2} className="container">
            <Switch>
                <PrivateRoute exact path="/admin" component={Administration} />
                <Route exact path="/login" component={Login} />
                <Route exact path="/standings" component={Standings} />
                <Route exact path="/stats" component={Stats} />
                <Route exact path="/" component={Home} />
                <Redirect to="/" />
            </Switch> 
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Autors: Roberts Groza rg11080</Footer>
    </Layout>
  </>
}

export default withRouter(Main);
