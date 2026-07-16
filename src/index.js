const express = require('express');
const prisma = require('./lib/prisma');

const app = express();

// Middleware : parse le JSON entrant → remplit req.body
app.use(express.json());

// Endpoint de santé : vérifie que le serveur ET la base répondent.
// C'est ce que Render appellera pour savoir si l'app est vivante.
app.get('/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    next(err);   // délègue au gestionnaire d'erreurs
  }
});

// 404 : aucune route n'a matché
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Gestionnaire d'erreurs centralisé.
// Express le reconnaît à ses QUATRE paramètres — c'est la signature qui compte.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Historia API écoute sur http://localhost:${port}`);
});