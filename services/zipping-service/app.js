const amqp = require('amqplib');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const ZIP_DIR = path.join(__dirname, 'zips');

if (!fs.existsSync(ZIP_DIR)) {
  fs.mkdirSync(ZIP_DIR);
}

async function start() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('video_processed');
    await channel.assertQueue('video_error');

    console.log('✅ [ZIPPING] Aguardando vídeos processados...');

    channel.consume('video_processed', async (msg) => {
      let data;

      try {
        data = JSON.parse(msg.content.toString());
        const { filename, outputDir, email } = data;

        if (!outputDir || !fs.existsSync(outputDir)) {
          throw new Error(`Diretório de saída inválido: ${outputDir}`);
        }

        const zipPath = path.join(ZIP_DIR, `${filename}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        let outputDirs;
        archive.pipe(output);
        archive.directory(outputDirs, false);

        output.on('close', () => {
          console.log(`✅ ZIP criado: ${zipPath} (${archive.pointer()} bytes)`);
          channel.ack(msg);
        });

        archive.on('error', async (err) => {
          console.error(`❌ Erro ao criar ZIP: ${err.message}`);
          await sendError(channel, filename, email, err.message);
          channel.ack(msg); // não fica tentando para sempre
        });

        await archive.finalize();

      } catch (error) {
        console.error(`❌ Erro ao processar zipping-service: ${error.message}`);
        const filename = data?.filename || 'desconhecido';
        const email = data?.email || 'raildobruno@gmail.com';
        await sendError(channel, filename, email, error.message);
        channel.ack(msg); // garante continuidade
      }
    });

  } catch (err) {
    console.error('❌ Erro ao conectar ao RabbitMQ:', err.message);
    setTimeout(start, 5000); // tenta novamente
  }
}

async function sendError(channel, filename, email, message) {
  try {
    const payload = {
      filename,
      email: email || 'raildobruno@gmail.com',
      error: message
    };
    channel.sendToQueue('video_error', Buffer.from(JSON.stringify(payload)));
    console.log(`📨 Erro enviado para fila "video_error"`);
  } catch (err) {
    console.error('❌ Falha ao enviar erro para fila "video_error":', err.message);
  }
}

start();
