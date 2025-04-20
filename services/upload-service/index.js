const { app, connectRabbitMQ } = require('./app');

connectRabbitMQ().then(() => {
  app.listen(3002, () => {
    console.log('🚀 Upload Service rodando na porta 3002');
  });
});