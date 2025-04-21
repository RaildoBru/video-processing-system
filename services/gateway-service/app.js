const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, 'secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use('/upload', auth, createProxyMiddleware({ target: 'http://upload-service:3002', changeOrigin: true }));
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
