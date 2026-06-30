require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'carregada OK -> ' + process.env.DATABASE_URL : 'AUSENTE');