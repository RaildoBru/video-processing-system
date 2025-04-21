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

    try {
      ffmpeg(filepath)
        .on('start', () => {
          console.log(`🎬 Iniciando extração de frames para ${filename}`);
        })
        .on('end', () => {
          console.log(`✅ Extração de frames finalizada: ${outputPath}`);
          resolve(outputPath); // Resolve a promise após a extração ser concluída
        })
        .on('error', (err) => {
          console.error(`❌ Erro ao extrair frames`);
          reject(err); // Rejeita a promise caso ocorra um erro
        })
        .output(path.join(outputPath, `${filename}-%04d.png`))
        .run();
    } catch (err) {
      // Se ocorrer um erro fora do ffmpeg (ex.: problema no diretório de saída)
      console.error(`❌ Erro inesperado ao processar o vídeo: ${err.message}`);
      reject(err);
    }
  });
}

connectToRabbitMQ().then(() => {
  console.log('🚀 [PROCESSING-SERVICE] Iniciado com sucesso');
});


module.exports = {
  connectToRabbitMQ, startProcessing, processVideo
}
