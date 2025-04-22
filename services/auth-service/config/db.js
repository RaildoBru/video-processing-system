const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://grupo57:f8gVnpDxb1aiVIgM@local.lpewk3b.mongodb.net/fast_food?authSource=admin');
    console.log('✅ Conectado ao MongoDB');
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    process.exit(1); // encerra o app se não conectar
  }
};

module.exports = connectDB;