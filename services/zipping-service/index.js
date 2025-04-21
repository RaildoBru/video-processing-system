const { start, sendError } = require('./app');

start().then(() => {
  console.log('🚀 [ZIPPING-SERVICE] Iniciado com sucesso');
});
