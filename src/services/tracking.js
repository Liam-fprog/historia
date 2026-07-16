const STATUSES = ['TO_WATCH', 'IN_PROGRESS', 'DONE'];

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;   // repris par le gestionnaire d'erreurs central
  }
}

function validateStatus(status) {
  if (!STATUSES.includes(status)) {
    throw new ValidationError(`Statut invalide : ${status}`);
  }
  return status;
}

function validateRating(rating) {
  if (rating === null || rating === undefined) return null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    throw new ValidationError('La note doit être un entier entre 1 et 10');
  }
  return rating;
}

/**
 * Décide des dates à partir du changement de statut.
 * Renvoie les champs à écrire — n'écrit rien elle-même.
 */
function applyStatusChange(current, nextStatus, now = new Date()) {
  validateStatus(nextStatus);

  const patch = { status: nextStatus };

  // On démarre : on horodate, mais on n'écrase pas une date existante
  // (repasser en cours après avoir fini ne doit pas réinitialiser startedAt)
  if (nextStatus === 'IN_PROGRESS' && !current.startedAt) {
    patch.startedAt = now;
  }

  if (nextStatus === 'DONE') {
    patch.finishedAt = now;
    if (!current.startedAt) patch.startedAt = now;  // vu d'une traite
  }

  // On retire de "fini" → la date de fin n'a plus de sens
  if (nextStatus !== 'DONE' && current.finishedAt) {
    patch.finishedAt = null;
  }

  return patch;
}

module.exports = {
  STATUSES,
  ValidationError,
  validateStatus,
  validateRating,
  applyStatusChange,
};