const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function createAdminDatabaseRouter({ adminService, db }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  router.use(adminAuth);

  // GET /api/admin/database/overview - MongoDB database status, collections, counts, and indexes
  router.get('/overview', async (req, res, next) => {
    try {
      if (!db || typeof db.getOverview !== 'function') {
        return res.json({
          database: 'mental_health_assessment',
          type: 'MongoDB Document Store',
          status: 'ready',
          collectionsCount: 0,
          collections: {}
        });
      }

      const overview = await db.getOverview();
      res.json(overview);
    } catch (err) {
      next(err);
    }
  });

  // GET /api/admin/database/collections/:name - Sample documents in a MongoDB collection
  router.get('/collections/:name', async (req, res, next) => {
    try {
      const { name } = req.params;
      const { limit = 20, page = 1 } = req.query;
      const p = Math.max(1, parseInt(page, 10) || 1);
      const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

      if (!db || typeof db.collection !== 'function') {
        return res.json({ collection: name, items: [], totalCount: 0 });
      }

      const col = db.collection(name);
      const totalCount = await col.countDocuments();
      const indexes = await col.getIndexes();

      // PDPA & Security projections
      let projection = {};
      if (name === 'assessment_attempts') {
        projection = { answers: 0 };
      } else if (name === 'admin_users') {
        projection = { passwordHash: 0 };
      }

      const items = await col
        .find({})
        .project(projection)
        .skip((p - 1) * lim)
        .limit(lim)
        .toArray();

      res.json({
        collection: name,
        items,
        indexes,
        pagination: {
          page: p,
          limit: lim,
          totalCount,
          totalPages: Math.ceil(totalCount / lim) || 1
        }
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminDatabaseRouter };
