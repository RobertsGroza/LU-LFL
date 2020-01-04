import React from 'react';
import Home from 'components/Home/Home';
import Standings from 'components/Standings/Standings';
import Stats from 'components/Stats/Stats';
import Administration from 'components/Administration/Administration';
import Login from 'components/Login/Login';
import { Switch, Route, Redirect, withRouter, NavLink } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import PrivateRoute from "PrivateRoute";

const { Header, Content, Footer } = Layout;

const Main = () => <>
  <Layout className="layout" style={{ height: '100vh' }}>
    <Header>
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
      </Menu>
    </Header>
    <Content style={{ padding: '0 50px' }}>
        <Switch>
            <PrivateRoute exact path="/admin" component={Administration} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/standings" component={Standings} />
            <Route exact path="/stats" component={Stats} />
            <Route exact path="/" component={Home} />
            <Redirect to="/" />
        </Switch> 
    </Content>
    <Footer style={{ textAlign: 'center' }}>Autors: Roberts Groza rg11080</Footer>
  </Layout>
</>

export default withRouter(Main);
