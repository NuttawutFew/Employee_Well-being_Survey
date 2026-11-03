const { ERROR_CODES } = require('@mental-health/shared-contracts');

function createAdminAuthMiddleware({ adminService }) {
  return async function adminAuthMiddleware(req, res, next) {
    try {
      // 1. Check HTTP-only cookie (__Host-admin-session or admin_session)
      let sessionToken = req.cookies?.['__Host-admin-session'] || req.cookies?.['admin_session'];

      // 2. Fallback to Authorization: Bearer <token>
      if (!sessionToken && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
          sessionToken = parts[1];
        }
      }

      if (!sessionToken) {
        const err = new Error('Admin authentication required');
        err.status = 401;
        err.code = ERROR_CODES.UNAUTHORIZED;
        return next(err);
      }

      const session = await adminService.validateSession(sessionToken);
      if (!session) {
        const err = new Error('Admin session expired or invalid');
        err.status = 401;
        err.code = ERROR_CODES.UNAUTHORIZED;
        return next(err);
      }

      req.admin = session;
      req.adminSessionToken = sessionToken;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'กรุณาเข้าสู่ระบบ'
    });
  }
  const role = (req.admin.role || '').toLowerCase();
  if (role !== 'super_admin') {
    return res.status(403).json({
      code: ERROR_CODES.FORBIDDEN,
      message: 'ต้องมีสิทธิ์ระดับ Super Admin เท่านั้นจึงจะเข้าถึงฟังก์ชันนี้ได้'
    });
  }
  next();
}

function requirePermission(permission) {
  return function permissionMiddleware(req, res, next) {
    if (!req.admin) {
      return res.status(401).json({
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'กรุณาเข้าสู่ระบบ'
      });
    }
    // Super Admin has all permissions implicitly
    const role = (req.admin.role || '').toLowerCase();
    if (role === 'super_admin') {
      return next();
    }
    const perms = req.admin.permissions || [];
    if (!perms.includes(permission)) {
      return res.status(403).json({
        code: ERROR_CODES.EXPORT_PERMISSION_DENIED || ERROR_CODES.FORBIDDEN,
        message: `ท่านไม่มีสิทธิ์การเข้าถึงฟังก์ชันนี้ (ต้องการสิทธิ์: ${permission})`
      });
    }
    next();
  };
}

module.exports = {
  createAdminAuthMiddleware,
  requireSuperAdmin,
  requirePermission
};
