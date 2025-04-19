const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
let channel;

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue('video_upload');
    await channel.assertQueue('video_error');
    await channel.assertQueue('video_processed');

    console.log('✅ [PROCESSING] Conectado ao RabbitMQ');
    startProcessing();
  } catch (err) {
    console.error('❌ [PROCESSING] Erro ao conectar no RabbitMQ:', err.message);
    setTimeout(connectToRabbitMQ, 5000); // tenta novamente após 5s
  }
}

function startProcessing() {
  console.log('⏳ Aguardando vídeos na fila...');

  channel.consume('video_upload', async (msg) => {
    const data = JSON.parse(msg.content.toString());
    const { filename, path: filepath, email } = data;

    console.log(`📦 Processando vídeo: ${filename} em ${filepath}`);

    try {
      const outputDir = await processVideo(filepath, filename);

      channel.sendToQueue(
        'video_processed',
        Buffer.from(JSON.stringify({ filename, outputDir }))
      );

      console.log(`📤 Enviado para fila "video_processed"`);
      channel.ack(msg);

    } catch (error) {
      console.error(`❌ Erro ao processar vídeo ${filename}:`, error.message);

      try {
        channel.sendToQueue('video_error', Buffer.from(JSON.stringify({
          email: email || 'raildobruno@gmail.com', // fallback
          filename,
          error: error.message
        })));
        console.log(`📨 Notificação de erro enviada para fila "video_error"`);
      } catch (sendErr) {
        console.error('❌ Falha ao enviar para fila "video_error":', sendErr.message);
      }

      channel.ack(msg); // evita travar a fila
    }
  });
}

async function processVideo(filepath, filename) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(__dirname, 'frames', filename);
    fs.mkdirSync(outputPath, { recursive: true });

    ffmpeg(filepath)
      .on('start', () => {
        console.log(`🎬 Iniciando extração de frames para ${filename}`);
      })
      .on('end', () => {
        console.log(`✅ Extração de frames finalizada: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`❌ Erro ao extrair frames: ${err.message}`);
        reject(err);
      })
      .output(path.join(outputPath, `${filename}-%04d.png`))
      .run();
  });
}

connectToRabbitMQ().then(() => {
  console.log('🚀 [PROCESSING-SERVICE] Iniciado com sucesso');
});


/*const amqp = require('amqplib');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
let channel;

async function connectToRabbitMQ() {
    try {
      const connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue('video_upload');
      await channel.assertQueue('video_error');
      await channel.assertQueue('video_processed');
  
      console.log('✅ [PROCESSING] Conectado ao RabbitMQ');
      sendQueueProcessing();
      
    } catch (err) {
      console.error('❌ [PROCESSING] Erro ao conectar no RabbitMQ:', err.message);
      setTimeout(connectToRabbitMQ, 5000); // tenta de novo em 5s
    }
  }

  function sendQueueProcessing() {
    console.log('processando');
    try {
      channel.consume('video_upload', async (msg) => {
        const data = JSON.parse(msg.content.toString());
        const { filename, path: filepath } = data;
  
        console.log(`📦 Processando  s vídeo: ${filename} em ${filepath}`);
                
        const outputDir = await processVideo(filepath, filename);
        console.log(outputDir);

        channel.sendToQueue(
            'video_processed',
            Buffer.from(JSON.stringify({ filename, outputDir }))
        );

        console.log(`📤 Mensagem enviada para fila "video_processed"`);
        channel.ack(msg);

      });
      
    } catch (error) {
      console.error('❌ Erro ao extrair frames');
      channel.sendToQueue('video_error', Buffer.from(JSON.stringify({
        email: 'raildobruno@gmail.com', // pode vir junto do request original
        filename,
        error: err.message
      })));
    }
  }
  
  async function processVideo(filepath,filename) {

    let filepaths = '';
    return new Promise((resolve, reject) => {
        const outputPath = path.join(__dirname, 'frames', filename);
        fs.mkdirSync(outputPath, { recursive: true });
        ffmpeg(filepaths)
        .on('start', () => {
            console.log(`🎬 Iniciando extração de frames para ${filename}`);
        })
        .on('end', () => {
            console.log(`✅ Extração de frames finalizada: ${outputPath}`);
            resolve(outputPath);
        })
        .on('error', (err) => {
            console.error(`❌ Erro ao extrair frames: ${err.message}`);
            reject(err);
        })
        .output(path.join(outputPath, filename + '-%04d.png'))
        .run();
    });
  }

  connectToRabbitMQ().then(() => {
      console.log('🚀 Upload Service');
  });
*/