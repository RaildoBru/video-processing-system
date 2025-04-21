//const { app } = require('./app');
const express = require('express');
const connectDB = require('./config/db');
const router = require('./app');

const app = express();

app.use(express.json());
// Conectar ao banco
connectDB();

// Usar rotas de auth
app.use(router);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Auth service rodando na porta ${PORT}`));
