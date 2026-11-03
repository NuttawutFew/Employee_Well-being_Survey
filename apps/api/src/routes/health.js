const express = require('express');

function createHealthRouter({ db = null } = {}) {
  const router = express.Router();

  router.get('/health', async (req, res) => {
    let dbStatus = 'not_configured';
    let dbInfo = null;

    if (db) {
      try {
        if (typeof db.command === 'function') {
          await db.command({ ping: 1 });
          dbStatus = 'connected';
          dbInfo = {
            type: db.isSimulated ? 'MongoDB Document Store (Simulated In-Memory)' : 'MongoDB Server',
            database: db.databaseName || 'mental_health_assessment'
          };
        } else if (typeof db.query === 'function') {
          await db.query('SELECT 1');
          dbStatus = 'connected';
        } else {
          dbStatus = 'connected';
        }
      } catch (err) {
        dbStatus = 'error: ' + err.message;
      }
    }

    res.status(200).json({
      status: 'ok',
      service: 'mental-health-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      ...(dbInfo ? { databaseDetails: dbInfo } : {})
    });
  });

  return router;
}

module.exports = { createHealthRouter };
