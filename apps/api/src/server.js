require('dotenv').config();
const { getMongoDatabase } = require('./db/mongo-client');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const SERVICE_ROLE = process.env.SERVICE_ROLE || 'all';
const dbName = process.env.MONGODB_DB_NAME || 'mental_health_assessment';

const db = getMongoDatabase(dbName);
console.log(`[Database] MongoDB Document Store initialized (database: ${dbName}, mode: ${db.isSimulated ? 'Simulated In-Memory Document Store' : 'Connected'})`);

// SEED_MOCK controls whether initial mock assessment data is seeded.
// Set SEED_MOCK=false in production to start with a clean database.
const seedMock = process.env.SEED_MOCK !== undefined ? process.env.SEED_MOCK === 'true' : true;

const app = createApp({ db, seedMock, serviceRole: SERVICE_ROLE });

const server = app.listen(PORT, () => {
  console.log(`Mental Health Assessment API [Role: ${SERVICE_ROLE}] listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
  });
});
