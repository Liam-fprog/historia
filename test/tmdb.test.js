const test = require('node:test');
const assert = require('node:assert/strict');

const { mapMovie } = require('../src/services/tmdb');

const RAW = {
  id: 438631,
  title: 'Dune - Première partie',
  release_date: '2021-09-15',
  poster_path: '/qpyaW4xUPeIiYA5ckg5zAZFHvsb.jpg',
  overview: 'L\'histoire de Paul Atreides...',
  genre_ids: [878, 12],
};

test('mapMovie traduit une réponse TMDb vers notre format', () => {
  const m = mapMovie(RAW);

  assert.equal(m.externalSource, 'tmdb');
  assert.equal(m.externalId, '438631');       // string, pas number
  assert.equal(m.type, 'MOVIE');
  assert.equal(m.title, 'Dune - Première partie');
  assert.equal(m.year, 2021);                  // extrait de release_date
  assert.ok(m.posterUrl.startsWith('https://image.tmdb.org/'));
  assert.deepEqual(m.genreIds, [878, 12]);
});

test('mapMovie gère une date de sortie absente', () => {
  const m = mapMovie({ ...RAW, release_date: '' });
  assert.equal(m.year, null);
});

test('mapMovie gère une affiche absente', () => {
  const m = mapMovie({ ...RAW, poster_path: null });
  assert.equal(m.posterUrl, null);
});

test('mapMovie gère un synopsis vide', () => {
  const m = mapMovie({ ...RAW, overview: '' });
  assert.equal(m.overview, null);
});