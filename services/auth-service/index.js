//const { app } = require('./app');
const express = require('express');
const connectDB = require('./config/db');
const router = require('./app');

const app = express();

app.use(express.json());
// Conectar ao banco
connectDB();

app.use(router);

module.exports = app;

