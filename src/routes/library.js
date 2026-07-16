const express = require('express');
const prisma = require('../lib/prisma');
const { getMovie } = require('../services/tmdb');
const {
  ValidationError,
  validateStatus,
  validateRating,
  applyStatusChange,
} = require('../services/tracking');

const router = express.Router();

/**
 * POST /api/library
 * Body : { externalId: "438631" }
 * Ajoute un film TMDb à ma bibliothèque.
 */
router.post('/library', async (req, res, next) => {
  try {
    const { externalId } = req.body;
    if (!externalId) {
      throw new ValidationError('externalId est requis');
    }

    const movie = await getMovie(externalId);

    // Une seule transaction : soit tout passe, soit rien.
    const result = await prisma.$transaction(async (tx) => {
      // Les genres : on réutilise ceux qui existent, on crée les autres.
      const genres = await Promise.all(
        movie.genreNames.map((name) =>
          tx.genre.upsert({
            where: { name },
            update: {},
            create: { name },
          })
        )
      );

      // upsert sur la contrainte @@unique : si le film est déjà là,
      // on ne le duplique pas.
      const media = await tx.media.upsert({
        where: {
          externalSource_externalId: {
            externalSource: movie.externalSource,
            externalId: movie.externalId,
          },
        },
        update: {},
        create: {
          type: movie.type,
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          overview: movie.overview,
          externalSource: movie.externalSource,
          externalId: movie.externalId,
          genres: { connect: genres.map((g) => ({ id: g.id })) },
        },
      });

      const existing = await tx.trackedItem.findUnique({
        where: { mediaId: media.id },
      });
      if (existing) {
        throw new ValidationError('Ce média est déjà dans ta bibliothèque');
      }

      return tx.trackedItem.create({
        data: { mediaId: media.id, status: 'TO_WATCH' },
        include: { media: { include: { genres: true } } },
      });
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/library?status=IN_PROGRESS&type=MOVIE
 */
router.get('/library', async (req, res, next) => {
  try {
    const { status, type } = req.query;

    const where = {};
    if (status) where.status = validateStatus(status);
    if (type) where.media = { type };

    const items = await prisma.trackedItem.findMany({
      where,
      include: { media: { include: { genres: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/library/:id
 * Body : { status?: "DONE", rating?: 8 }
 */
router.patch('/library/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new ValidationError('id invalide');
    }

    const current = await prisma.trackedItem.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Non trouvé' });
    }

    let data = {};

    if (req.body.status !== undefined) {
      data = { ...data, ...applyStatusChange(current, req.body.status) };
    }
    if (req.body.rating !== undefined) {
      data.rating = validateRating(req.body.rating);
    }

    if (Object.keys(data).length === 0) {
      throw new ValidationError('Rien à mettre à jour');
    }

    const updated = await prisma.trackedItem.update({
      where: { id },
      data,
      include: { media: { include: { genres: true } } },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/library/:id
 */
router.delete('/library/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.trackedItem.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === 'P2025') {   // Prisma : enregistrement introuvable
      return res.status(404).json({ error: 'Non trouvé' });
    }
    next(err);
  }
});

module.exports = router;