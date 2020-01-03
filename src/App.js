import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import Main from 'components/Main/Main';

const App = () => <BrowserRouter>
    <Main/>
</BrowserRouter>

export default App;
