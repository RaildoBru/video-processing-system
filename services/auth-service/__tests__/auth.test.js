const request = require('supertest');
const { app, users } = require('../app'); // ajuste o caminho conforme necessário
const jwt = require('jsonwebtoken');

describe('Auth Service', () => {
  const user = { username: 'teste', password: '123456' };

  it('deve registrar um novo usuário', async () => {
    const res = await request(app)
      .post('/register')
      .send(user);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Registrado");
  });

  it('não deve permitir registrar usuário duplicado', async () => {
    const res = await request(app)
      .post('/register')
      .send(user);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Usuário já existe");
  });

  it('deve permitir login com credenciais válidas', async () => {
    const res = await request(app)
      .post('/login')
      .send(user);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();

    const decoded = require('jsonwebtoken').verify(res.body.token, 'secret');
    expect(decoded.username).toBe(user.username);
  });

  it('não deve permitir login com senha incorreta', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: user.username, password: 'errado' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Inválido");
  });

  it('não deve permitir login com usuário inexistente', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: 'naoexiste', password: 'qualquer' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Inválido");
  });
});
