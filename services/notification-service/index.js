const { sendEmail, connectRabbitMQ } = require('./app');

connectRabbitMQ().then(() => {
  console.log('🚀 [NOTIFICATION-SERVICE] Iniciado com sucesso');
});
