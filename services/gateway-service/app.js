const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/swagger.yaml');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get('/validate', auth, (req, res) => {
  res.json({
    message: 'Token válido',
    user: req.user
  });
});

app.use('/upload', auth, createProxyMiddleware({ 
  target: 'http://upload-service:3002',
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('x-user-id', req.user.id);
      proxyReq.setHeader('x-user-username', req.user.username);
      proxyReq.setHeader('x-user-email', req.user.email);
    }
  }

}));

const zipPath = path.join(__dirname, 'zips');

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const file = path.join(zipPath, `${filename}.zip`);

  res.download(file, `${filename}.zip`, (err) => {
    if (err) {
      console.error('❌ Erro ao fazer download:', err);
      res.status(500).send('Erro ao baixar o arquivo.');
    }
  });
});

module.exports = app;
