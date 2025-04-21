const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('./models/user');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body;

  try {

    const existingEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    if (existingEmail || existingUsername) {
      return res.status(409).json({ message: 'Email ou username já existente' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      id: uuidv4(),
      email,
      username,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (err) {
    console.error('❌ Erro ao registrar:', err);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
});

router.post('/login', async (req, res) => {

  const { username, email, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ username }, { email }]
    });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    const payload = { id: user.id, username : user.username, email: user.email }
    const token = jwt.sign(payload, JWT_SECRET,{ expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error('❌ Erro no login:', err);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

module.exports = router;

/*
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const user = require('../models/user');

const app = express();
app.use(bodyParser.json());

const users = [];

app.post('/register', async (req, res) => {
  //const { username, password } = req.body;
  const { email, username, password } = req.body;

  console.log('sdasdas');
  if (users.find(u => u.username === username)) return res.status(409).json({ message: "Usuário já existe" });
  const hashed = await bcrypt.hash(password, 10);
  users.push({ id: users.length + 1, username, password: hashed });
  res.status(201).json({ message: "Registrado" });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Inválido" });
  const token = jwt.sign({ id: user.id, username }, 'secret');
  res.json({ token });
});

module.exports = { app, users };
*/