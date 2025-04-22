
const request = require('supertest');
const mockingoose = require('mockingoose');
const app = require('../index'); // Ajuste o caminho para o seu app
const bcrypt = require('bcrypt');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('Auth Service', () => {

  const user = {
    username: 'teste',
    email: 'teste@example.com',
    password: '123456'
  };

  beforeAll(() => {
    mockingoose(User).toReturn(null, 'findOne');
  });

  it('deve registrar um novo usuário', async () => {
    mockingoose(User).toReturn({
      ...user,
      save: jest.fn().mockResolvedValue(user)
    }, 'save');

    const res = await request(app)
      .post('/register')
      .send(user);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Usuário registrado com sucesso");
  });

  it('não deve permitir registrar usuário com email ou username duplicados', async () => {
    mockingoose(User).toReturn({ email: 'teste@example.com' }, 'findOne');

    const res = await request(app)
      .post('/register')
      .send(user);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email ou username já existente");
  });

  it('deve permitir login com credenciais válidas', async () => {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Simula um usuário válido no banco
    mockingoose(User).toReturn({
      ...user,
      password: hashedPassword
    }, 'findOne');

    const res = await request(app)
      .post('/login')
      .send({ username: user.username, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = jwt.verify(res.body.token, 'secret');  // 'secret' deve ser o valor do JWT_SECRET
    expect(decoded.username).toBe(user.username);
  });

  it('não deve permitir login com senha incorreta', async () => {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Simula um usuário válido no banco
    mockingoose(User).toReturn({
      ...user,
      password: hashedPassword
    }, 'findOne');

    const res = await request(app)
      .post('/login')
      .send({ username: user.username, password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });

  it('não deve permitir login com usuário inexistente', async () => {
    // Simula um usuário não encontrado
    mockingoose(User).toReturn(null, 'findOne');

    const res = await request(app)
      .post('/login')
      .send({ username: 'naoexiste', password: 'qualquer' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });
});
