const express = require('express');
const { searchMovies } = require('../services/tmdb');

const router = express.Router();

router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q) {
      return res.status(400).json({ error: 'Le paramètre q est requis' });
    }

    const results = await searchMovies(q);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;