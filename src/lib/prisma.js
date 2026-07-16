const { PrismaClient } = require('@prisma/client');

// Un seul client pour toute l'app : chaque instance ouvre son propre
// pool de connexions, et Neon en gratuit en tolère peu.
const prisma = new PrismaClient();

module.exports = prisma;