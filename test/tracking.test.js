const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateRating,
  validateStatus,
  applyStatusChange,
  ValidationError,
} = require('../src/services/tracking');

test('validateRating accepte un entier de 1 à 10', () => {
  assert.equal(validateRating(1), 1);
  assert.equal(validateRating(10), 10);
  assert.equal(validateRating(7), 7);
});

test('validateRating accepte null (pas de note)', () => {
  assert.equal(validateRating(null), null);
  assert.equal(validateRating(undefined), null);
});

test('validateRating rejette hors bornes et non-entiers', () => {
  assert.throws(() => validateRating(0), ValidationError);
  assert.throws(() => validateRating(11), ValidationError);
  assert.throws(() => validateRating(7.5), ValidationError);
  assert.throws(() => validateRating('8'), ValidationError);
});

test('validateStatus rejette un statut inconnu', () => {
  assert.equal(validateStatus('DONE'), 'DONE');
  assert.throws(() => validateStatus('WATCHING'), ValidationError);
});

// --- applyStatusChange : le cœur de la logique métier ---

const NOW = new Date('2026-07-16T20:00:00Z');

test('passer IN_PROGRESS horodate le début', () => {
  const patch = applyStatusChange({ startedAt: null, finishedAt: null }, 'IN_PROGRESS', NOW);
  assert.equal(patch.status, 'IN_PROGRESS');
  assert.equal(patch.startedAt, NOW);
});

test('repasser IN_PROGRESS n\'écrase pas la date de début existante', () => {
  const before = new Date('2026-01-01T00:00:00Z');
  const patch = applyStatusChange({ startedAt: before, finishedAt: null }, 'IN_PROGRESS', NOW);
  assert.equal(patch.startedAt, undefined);   // on n'y touche pas
});

test('passer DONE horodate la fin', () => {
  const before = new Date('2026-01-01T00:00:00Z');
  const patch = applyStatusChange({ startedAt: before, finishedAt: null }, 'DONE', NOW);
  assert.equal(patch.finishedAt, NOW);
});

test('un film vu d\'une traite reçoit un début ET une fin', () => {
  const patch = applyStatusChange({ startedAt: null, finishedAt: null }, 'DONE', NOW);
  assert.equal(patch.startedAt, NOW);
  assert.equal(patch.finishedAt, NOW);
});

test('sortir de DONE efface la date de fin', () => {
  const current = { startedAt: NOW, finishedAt: NOW };
  const patch = applyStatusChange(current, 'IN_PROGRESS', NOW);
  assert.equal(patch.finishedAt, null);
});

test('applyStatusChange rejette un statut invalide', () => {
  assert.throws(() => applyStatusChange({}, 'FINI', NOW), ValidationError);
});