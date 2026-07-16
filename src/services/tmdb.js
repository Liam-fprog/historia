const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

/**
 * Traduit un film TMDb vers NOTRE format.
 * Fonction PURE : pas de réseau, pas de base. Donc testable directement.
 */
function mapMovie(raw) {
  return {
    externalSource: 'tmdb',
    externalId: String(raw.id),
    type: 'MOVIE',
    title: raw.title,
    year: raw.release_date ? Number(raw.release_date.slice(0, 4)) : null,
    posterUrl: raw.poster_path ? `${IMAGE_BASE}${raw.poster_path}` : null,
    overview: raw.overview || null,
    genreIds: raw.genre_ids || [],
  };
}

/**
 * Appel générique à TMDb. Centralise la clé, la langue et la gestion d'erreur.
 */
async function tmdbFetch(path, params = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY manquante');
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'fr-FR');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url);

  if (!res.ok) {
    const err = new Error(`TMDb a répondu ${res.status}`);
    // 4xx = notre faute, 5xx = la leur → on ne renvoie pas 500 au client
    // si c'est nous qui avons mal demandé.
    err.status = res.status === 404 ? 404 : 502;
    throw err;
  }

  return res.json();
}

async function searchMovies(query) {
  const data = await tmdbFetch('/search/movie', {
    query,
    include_adult: 'false',
  });
  return data.results.map(mapMovie);
}

async function getMovie(id) {
  const raw = await tmdbFetch(`/movie/${id}`);
  // /movie/{id} renvoie `genres: [{id, name}]`, pas `genre_ids`.
  // On normalise pour que le reste de l'app voie toujours la même forme.
  return {
    ...mapMovie(raw),
    genreIds: (raw.genres || []).map((g) => g.id),
    genreNames: (raw.genres || []).map((g) => g.name),
  };
}

module.exports = { mapMovie, searchMovies, getMovie };