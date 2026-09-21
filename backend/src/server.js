require('dotenv').config();

const app = require('./app');

const PORT = Number(process.env.PORT) || 4000;

// F Vercel maki-khdmch app.listen, dkechi 3lach ndiro had l-chert:
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🏪 نظام التعاونية API v2.0');
    console.log(`🌐 http://127.0.0.1:${PORT}`);
    console.log('='.repeat(50));
  });
}

// ⚠️ STAR MOHIM L VERCEL:
module.exports = app;