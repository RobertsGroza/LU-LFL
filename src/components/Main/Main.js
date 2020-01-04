import React, { useContext } from "react";
import Home from 'components/Home/Home';
import Standings from 'components/Standings/Standings';
import Stats from 'components/Stats/Stats';
import Administration from 'components/Administration/Administration';
import Login from 'components/Login/Login';
import Container from 'components/Container/Container';
import { Switch, Route, Redirect, withRouter, NavLink } from 'react-router-dom';
import { Layout, Menu, Icon } from 'antd';
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
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="logo">
          <img src="ball.png" alt="ball-logo" height="30"/>
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
      <Content>
        <Switch>
            <PrivateRoute exact path="/admin" component={Administration} />
            <Route exact path="/login">
              <Container><Login/></Container>
            </Route>
            <Route exact path="/standings">
              <Container><Standings/></Container>
            </Route>
            <Route exact path="/stats">
              <Container><Stats/></Container>
            </Route>
            <Route exact path="/" component={Home} />
            <Redirect to="/" />
        </Switch>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Autors: Roberts Groza rg11080</Footer>
    </Layout>
  </>
}

export default withRouter(Main);
