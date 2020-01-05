import axios from 'axios';

const dbClient = axios.create({
    baseURL: process.env.REACT_APP_DB_URL
});

export default dbClient;
