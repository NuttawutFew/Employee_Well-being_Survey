require('dotenv').config();
const { getMongoDatabase } = require('./db/mongo-client');
const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;
const SERVICE_ROLE = process.env.SERVICE_ROLE || 'all';
const dbName = process.env.MONGODB_DB_NAME || 'mental_health_assessment';

const db = getMongoDatabase(dbName);
console.log(`[Database] MongoDB Document Store initialized (database: ${dbName}, mode: ${db.isSimulated ? 'Simulated In-Memory Document Store' : 'Connected'})`);

const app = createApp({ db, seedMock: true, serviceRole: SERVICE_ROLE });

const server = app.listen(PORT, () => {
  console.log(`Mental Health Assessment API [Role: ${SERVICE_ROLE}] listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
  });
});
