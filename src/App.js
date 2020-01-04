import React from 'react';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import Main from 'components/Main/Main';
import { AuthProvider } from "./Auth";

const App = () => 
    <AuthProvider>
        <BrowserRouter>
            <Main/>
        </BrowserRouter>
    </AuthProvider>

export default App;
