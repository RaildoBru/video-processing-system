// __tests__/gateway.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../app');

jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: () => (req, res) => res.status(200).send('Proxy funcionando')
}));

describe('API Gateway', () => {
  const token = jwt.sign({ id: 1, username: 'teste' }, 'secret');

  describe('🔐 /upload (autenticado)', () => {
    it('deve bloquear acesso sem token', async () => {
      const res = await request(app).get('/upload');
      expect(res.status).toBe(401);
    });

    it('deve bloquear com token inválido', async () => {
      const res = await request(app)
        .get('/upload')
        .set('Authorization', 'Bearer token-invalido');
      expect(res.status).toBe(403);
    });

    it('deve permitir com token válido', async () => {
      const res = await request(app)
        .get('/upload')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.text).toBe('Proxy funcionando');
    });
  });

  describe('📥 /download/:filename', () => {
    const zipsDir = path.join(__dirname, '..', 'zips');
    const zipFile = path.join(zipsDir, 'exemplo.zip');

    beforeAll(() => {
      if (!fs.existsSync(zipsDir)) fs.mkdirSync(zipsDir);
      fs.writeFileSync(zipFile, 'conteudo');
    });

    afterAll(() => {
      if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
    });

    it('deve fazer download de arquivo existente', async () => {
      const res = await request(app).get('/download/exemplo');
      expect(res.status).toBe(200);
      expect(res.header['content-disposition']).toContain('attachment');
    });

    it('deve retornar 500 se arquivo não existir', async () => {
      const res = await request(app).get('/download/inexistente');
      expect(res.status).toBe(500);
      expect(res.text).toContain('Erro ao baixar o arquivo');
    });
  });
});
