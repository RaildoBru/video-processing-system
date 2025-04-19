// upload-service logic here
const express = require('express');
const amqp = require('amqplib');
const multer = require('multer');
const fs = require('fs');
const app = express();

const upload = multer({ dest: 'uploads/' });

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

let channel = null;

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('video_upload');
    await channel.assertQueue('video_error');
    console.log('✅ Conectado ao RabbitMQ');
  } catch (err) {
    console.error('❌ Erro ao conectar no RabbitMQ:', err.message);
    setTimeout(connectRabbitMQ, 5000); // tenta novamente em 5s
  }
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  app.get('/', (req, res) => {
    res.send('Upload Service está no ar 🚀');
  });
  

app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });

  const { filename, path } = req.file;

  if (!channel) {
    return res.status(500).json({ error: 'Serviço de mensageria indisponível' });
  }

  try {
    await channel.sendToQueue('video_upload', Buffer.from(JSON.stringify({ filename, path })));
    res.json({ message: 'Enviado com sucesso', filename  });
  } catch (err) {
    console.log('simulando envio de email pra erro!');
    /*channel.sendToQueue('video_error', Buffer.from(JSON.stringify({
      email: 'raildobruno@gmail.com', // pode vir junto do request original
      filename,
      error: err.message
    })));*/
    res.status(500).json({ error: 'Erro ao enviar para a fila' });
  }
});

connectRabbitMQ().then(() => {
  app.listen(3002, () => {
    console.log('🚀 Upload Service rodando na porta 3002');
  });
});
