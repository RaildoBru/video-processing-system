// auth-service logic here
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const users = [];

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) return res.status(409).json({ message: "Usuário já existe" });
  const hashed = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, username, password: hashed });
  res.status(201).json({ message: "Registrado" });
});


app.get('/teste', async (req, res) => {
    res.status(200).json({ message: "Teste" });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Inválido" });
  const token = jwt.sign({ id: user.id, username }, 'secret');
  res.json({ token });
});

app.listen(3001, () => console.log('Auth na 3001'));