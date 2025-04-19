const amqp = require('amqplib');
const nodemailer = require('nodemailer');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('video_error');

    console.log('✅ Conectado ao RabbitMQ');
    console.log('📨 Aguardando mensagens de erro...');

    channel.consume('video_error', async (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log('⚠️ Erro recebido:', data);

      await sendEmail(data.email, data.filename, data.error);
      channel.ack(msg);
    });

  } catch (err) {
    console.error('❌ Erro no notification-service:', err);
    setTimeout(connectRabbitMQ, 5000); // Tenta reconectar após 5s
  }
}

async function sendEmail(to, filename, errorMessage) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER, // coloque no .env
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"FIAP X - Notificação de Erro" <${process.env.EMAIL_USER}>`,
    to,
    subject: '❌ Erro ao processar seu vídeo',
    html: `
      <h3>Olá,</h3>
      <p>Houve um erro ao processar seu vídeo <strong>${filename}</strong>.</p>
      <p>Por favor, tente novamente mais tarde.</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
  console.log(`📧 Email enviado para ${to}`);
}

connectRabbitMQ();
