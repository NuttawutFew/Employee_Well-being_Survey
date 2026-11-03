function employeeAuthMiddleware(req, res, next) {
  // Support cookie or header bypass for development / testing
  const employeeId =
    req.cookies?.['__Host-emp-session'] ||
    req.cookies?.['emp_session'] ||
    req.headers['x-employee-id'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null) ||
    (process.env.NODE_ENV !== 'production' ? 'EMP-DEV-001' : null);

  if (!employeeId) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'กรุณายืนยันตัวตนพนักงานก่อนเข้าใช้งาน'
    });
  }

  req.employee = { employeeId };
  next();
}

module.exports = { employeeAuthMiddleware };
