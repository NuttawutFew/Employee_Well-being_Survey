const express = require('express');
const { createAdminAuthMiddleware } = require('../middlewares/admin-auth');

function createAdminAuthRouter({ adminService }) {
  const router = express.Router();
  const adminAuth = createAdminAuthMiddleware({ adminService });

  // 1. Admin Login
  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      const { sessionToken, admin } = await adminService.authenticate(username, password);

      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      };

      // Set cookie
      res.cookie('admin_session', sessionToken, cookieOptions);
      if (isProd) {
        res.cookie('__Host-admin-session', sessionToken, cookieOptions);
      }

      res.json({
        success: true,
        admin,
        sessionToken
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. Get Current Admin Session
  router.get('/me', adminAuth, async (req, res) => {
    res.json({
      success: true,
      admin: req.admin
    });
  });

  // 3. Admin Logout
  router.post('/logout', async (req, res, next) => {
    try {
      const sessionToken = req.cookies?.['admin_session'] || 
        req.cookies?.['__Host-admin-session'] || 
        (req.headers.authorization?.split(' ')?.[1]);

      if (sessionToken) {
        await adminService.destroySession(sessionToken);
      }

      res.clearCookie('admin_session', { path: '/' });
      res.clearCookie('__Host-admin-session', { path: '/' });

      res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminAuthRouter };
