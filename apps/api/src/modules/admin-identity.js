const crypto = require('crypto');
const { argon2id } = require('hash-wasm');
const { ERROR_CODES } = require('@mental-health/shared-contracts');

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  return argon2id({
    password,
    salt,
    iterations: 2,
    memorySize: 4096,
    hashLength: 32,
    parallelism: 1,
    outputType: 'encoded'
  });
}

async function verifyPassword(password, encodedHash) {
  if (!encodedHash || typeof encodedHash !== 'string') return false;
  const parts = encodedHash.split('$');
  // Format: ['', 'argon2id', 'v=19', 'm=4096,t=2,p=1', 'saltBase64', 'hashBase64']
  if (parts.length !== 6 || parts[1] !== 'argon2id') return false;
  const paramParts = parts[3].split(',');
  const m = parseInt(paramParts[0].split('=')[1], 10);
  const t = parseInt(paramParts[1].split('=')[1], 10);
  const p = parseInt(paramParts[2].split('=')[1], 10);
  const saltBuf = Buffer.from(parts[4], 'base64');

  const computed = await argon2id({
    password,
    salt: saltBuf,
    iterations: t,
    memorySize: m,
    hashLength: 32,
    parallelism: p,
    outputType: 'encoded'
  });
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(encodedHash));
}

class AdminIdentityService {
  constructor({ db = null, auditService = null } = {}) {
    this.db = db;
    this.auditService = auditService;
    this.usersCollection = db?.collection ? db.collection('admin_users') : null;
    this.sessionsCollection = db?.collection ? db.collection('admin_sessions') : null;
    this.adminAccounts = new Map(); // username -> AdminAccount
    this.sessions = new Map(); // sessionToken -> { adminId, username, role, expiresAt }
    this._initialized = false;
  }

  async initDefaultAdmin() {
    if (this._initialized) return;

    const defaultSeedAccounts = [
      {
        adminId: 'admin-export-0000-0000',
        username: process.env.ADMIN_DEFAULT_USER || 'admin',
        password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456!',
        fullName: 'เจ้าหน้าที่ HR (มีสิทธิ์ Export)',
        email: 'hr_admin@company.com',
        role: 'admin',
        permissions: ['can_export'],
        status: 'active'
      },
      {
        adminId: 'admin-super-0000-0000',
        username: process.env.SUPERADMIN_DEFAULT_USER || 'superadmin',
        password: process.env.SUPERADMIN_DEFAULT_PASSWORD || 'SuperAdmin@123456!',
        fullName: 'ผู้ดูแลระบบสูงสุด (Super Admin)',
        email: 'superadmin@company.com',
        role: 'super_admin',
        permissions: ['can_export', 'manage_admins'],
        status: 'active'
      },
      {
        adminId: 'admin-view-0000-0000',
        username: process.env.ADMIN_VIEW_USER || 'admin_view',
        password: process.env.ADMIN_VIEW_PASSWORD || 'Admin@123456!',
        fullName: 'เจ้าหน้าที่ HR (ไม่มีสิทธิ์ Export)',
        email: 'hr_view@company.com',
        role: 'admin',
        permissions: [],
        status: 'active'
      }
    ];

    for (const seed of defaultSeedAccounts) {
      const passwordHash = await hashPassword(seed.password);
      const adminDoc = {
        adminId: seed.adminId,
        username: seed.username,
        fullName: seed.fullName,
        email: seed.email,
        passwordHash,
        role: seed.role,
        permissions: seed.permissions,
        status: seed.status,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.adminAccounts.set(seed.username, adminDoc);

      if (this.usersCollection) {
        await this.usersCollection.updateOne(
          { username: seed.username },
          { $set: adminDoc },
          { upsert: true }
        );
      }
    }

    this._initialized = true;
  }

  async authenticate(username, password) {
    await this.initDefaultAdmin();

    if (!username || !password) {
      const err = new Error('กรุณาระบุชื่อผู้ใช้และรหัสผ่าน');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      throw err;
    }

    const account = this.adminAccounts.get(username);
    if (!account) {
      const err = new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      err.status = 401;
      err.code = ERROR_CODES.UNAUTHORIZED;
      throw err;
    }

    if (account.status === 'inactive') {
      const err = new Error('บัญชีนี้ถูกระงับสิทธิ์การใช้งาน กรุณาติดต่อ Super Admin');
      err.status = 403;
      err.code = ERROR_CODES.FORBIDDEN;
      throw err;
    }

    const now = Date.now();
    // Check if account is temporarily locked
    if (account.lockedUntil) {
      const lockExpiry = new Date(account.lockedUntil).getTime();
      if (now < lockExpiry) {
        const remainingMinutes = Math.ceil((lockExpiry - now) / (60 * 1000));
        const err = new Error(`บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกินกำหนด กรุณาลองใหม่อีกครั้งใน ${remainingMinutes} นาที`);
        err.status = 423; // 423 Locked
        err.code = 'ACCOUNT_LOCKED';
        err.remainingMinutes = remainingMinutes;
        throw err;
      } else {
        // Lockout expired, reset counter
        account.failedLoginAttempts = 0;
        account.lockedUntil = null;
      }
    }

    // Verify Argon2id password hash
    const isValid = await verifyPassword(password, account.passwordHash);
    if (!isValid) {
      account.failedLoginAttempts += 1;
      account.updatedAt = new Date().toISOString();

      if (this.usersCollection) {
        await this.usersCollection.updateOne(
          { username: account.username },
          { $set: { failedLoginAttempts: account.failedLoginAttempts, lockedUntil: account.lockedUntil, updatedAt: account.updatedAt } }
        );
      }

      if (account.failedLoginAttempts >= LOCKOUT_THRESHOLD) {
        account.lockedUntil = new Date(now + LOCKOUT_DURATION_MS).toISOString();
        if (this.usersCollection) {
          await this.usersCollection.updateOne(
            { username: account.username },
            { $set: { lockedUntil: account.lockedUntil } }
          );
        }
        const err = new Error('บัญชีถูกระงับชั่วคราวเป็นเวลา 15 นาที เนื่องจากใส่รหัสผ่านไม่ถูกต้องติดต่อกัน 5 ครั้ง');
        err.status = 423;
        err.code = 'ACCOUNT_LOCKED';
        err.remainingMinutes = 15;
        throw err;
      }

      const attemptsRemaining = LOCKOUT_THRESHOLD - account.failedLoginAttempts;
      const err = new Error(`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (สามารถลองได้อีก ${attemptsRemaining} ครั้งก่อนถูกระงับ)`);
      err.status = 401;
      err.code = ERROR_CODES.UNAUTHORIZED;
      err.attemptsRemaining = attemptsRemaining;

      if (this.auditService) {
        await this.auditService.logEvent({
          actor: username,
          actorRole: account.role || 'ADMIN',
          action: 'admin_login_failed',
          target: account.adminId,
          status: 'FAILED',
          purpose: 'การเข้าสู่ระบบสำหรับผู้ดูแล (ยืนยันรหัสผ่านไม่ผ่าน)',
          context: { failedLoginAttempts: account.failedLoginAttempts }
        });
      }

      throw err;
    }

    // Success: reset failures
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    account.updatedAt = new Date().toISOString();

    if (this.usersCollection) {
      await this.usersCollection.updateOne(
        { username: account.username },
        { $set: { failedLoginAttempts: 0, lockedUntil: null, updatedAt: account.updatedAt } }
      );
    }

    // Create session (valid for 8 hours)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now + 8 * 60 * 60 * 1000).toISOString();
    const sessionData = {
      adminId: account.adminId,
      username: account.username,
      fullName: account.fullName || account.username,
      role: account.role,
      permissions: account.permissions || [],
      expiresAt
    };
    this.sessions.set(sessionToken, sessionData);

    if (this.sessionsCollection) {
      await this.sessionsCollection.insertOne({
        sessionToken,
        ...sessionData,
        createdAt: new Date().toISOString()
      });
    }

    if (this.auditService) {
      const isSuper = (account.role || '').toLowerCase().includes('super');
      const action = isSuper ? 'super_admin_login' : 'admin_login';
      const actorRole = isSuper ? 'Super Admin' : 'Admin';
      await this.auditService.logEvent({
        actor: account.username,
        actorName: account.fullName || account.username,
        actorRole,
        action,
        target: account.adminId,
        status: 'SUCCESS',
        purpose: 'การเข้าสู่ระบบสำหรับผู้ดูแลระบบ',
        context: { role: account.role, permissions: account.permissions }
      });
    }

    return {
      sessionToken,
      admin: {
        adminId: account.adminId,
        username: account.username,
        fullName: account.fullName || account.username,
        role: account.role,
        permissions: account.permissions || []
      }
    };
  }

  async validateSession(sessionToken) {
    if (!sessionToken) return null;
    const session = this.sessions.get(sessionToken);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(sessionToken);
      if (this.sessionsCollection) {
        await this.sessionsCollection.deleteOne({ sessionToken });
      }
      return null;
    }

    return session;
  }

  async destroySession(sessionToken) {
    if (sessionToken) {
      const session = this.sessions.get(sessionToken);
      this.sessions.delete(sessionToken);
      if (this.sessionsCollection) {
        await this.sessionsCollection.deleteOne({ sessionToken });
      }
      if (this.auditService && session) {
        const isSuper = (session.role || '').toLowerCase().includes('super');
        await this.auditService.logEvent({
          actor: session.username,
          actorName: session.fullName || session.username,
          actorRole: isSuper ? 'Super Admin' : 'Admin',
          action: 'admin_logout',
          target: session.adminId,
          status: 'SUCCESS',
          purpose: 'ออกจากระบบผู้ดูแล'
        });
      }
    }
    return { success: true };
  }

  async verifyAdminPassword(username, password) {
    await this.initDefaultAdmin();
    if (!username || !password) return false;
    let account = null;
    if (this.usersCollection) {
      account = await this.usersCollection.findOne({ username });
    }
    if (!account) {
      account = this.adminAccounts.get(username);
    }
    if (!account || !account.passwordHash) return false;
    return await verifyPassword(password, account.passwordHash);
  }

  async listAdmins() {
    await this.initDefaultAdmin();
    let accounts = [];
    if (this.usersCollection) {
      accounts = await this.usersCollection.find({}).toArray();
    } else {
      accounts = Array.from(this.adminAccounts.values());
    }

    return accounts.map(acc => ({
      adminId: acc.adminId,
      username: acc.username,
      fullName: acc.fullName || acc.username,
      email: acc.email || '',
      role: acc.role,
      permissions: acc.permissions || [],
      status: acc.status || 'active',
      createdAt: acc.createdAt,
      updatedAt: acc.updatedAt
    }));
  }

  async createAdmin({ username, password, role = 'ADMIN', permissions = [], fullName = '', email = '' }, actor = 'superadmin') {
    await this.initDefaultAdmin();
    if (!username || !password) {
      const err = new Error('กรุณาระบุ Username และ Password');
      err.status = 400;
      err.code = ERROR_CODES.VALIDATION_FAILED;
      throw err;
    }

    if (this.adminAccounts.has(username)) {
      const err = new Error('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว');
      err.status = 409;
      err.code = 'USERNAME_EXISTS';
      throw err;
    }

    const adminId = 'admin-' + crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const newAdmin = {
      adminId,
      username,
      fullName: fullName || username,
      email: email || '',
      passwordHash,
      role: role.toUpperCase(),
      permissions: Array.isArray(permissions) ? permissions : [],
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.adminAccounts.set(username, newAdmin);
    if (this.usersCollection) {
      await this.usersCollection.insertOne(newAdmin);
    }

    if (this.auditService) {
      await this.auditService.logEvent({
        actor,
        actorRole: 'SUPER_ADMIN',
        action: 'admin_create',
        target: adminId,
        status: 'SUCCESS',
        purpose: 'สร้างบัญชีผู้ดูแลระบบใหม่',
        context: { username, role: newAdmin.role, permissions: newAdmin.permissions }
      });
    }

    return {
      adminId: newAdmin.adminId,
      username: newAdmin.username,
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      role: newAdmin.role,
      permissions: newAdmin.permissions,
      status: newAdmin.status,
      createdAt: newAdmin.createdAt
    };
  }

  async updateAdmin(adminId, { role, permissions, status, fullName, email, password }, actor = 'superadmin') {
    await this.initDefaultAdmin();
    let target = null;
    for (const acc of this.adminAccounts.values()) {
      if (acc.adminId === adminId) {
        target = acc;
        break;
      }
    }

    if (!target && this.usersCollection) {
      target = await this.usersCollection.findOne({ adminId });
    }

    if (!target) {
      const err = new Error('ไม่พบข้อมูลผู้ดูแลระบบที่ระบุ');
      err.status = 404;
      err.code = ERROR_CODES.NOT_FOUND;
      throw err;
    }

    const oldRole = target.role;
    const oldPermissions = [...(target.permissions || [])];

    if (role) target.role = role.toUpperCase();
    if (permissions !== undefined) target.permissions = Array.isArray(permissions) ? permissions : [];
    if (status) target.status = status;
    if (fullName !== undefined) target.fullName = fullName;
    if (email !== undefined) target.email = email;
    if (password) {
      target.passwordHash = await hashPassword(password);
    }
    target.updatedAt = new Date().toISOString();

    this.adminAccounts.set(target.username, target);
    if (this.usersCollection) {
      await this.usersCollection.updateOne({ adminId }, { $set: target });
    }

    if (this.auditService) {
      const isRoleChanged = role && role.toUpperCase() !== oldRole;
      const isPermChanged = permissions !== undefined && JSON.stringify(permissions) !== JSON.stringify(oldPermissions);

      await this.auditService.logEvent({
        actor,
        actorRole: 'SUPER_ADMIN',
        action: isRoleChanged ? 'admin_update_role' : (isPermChanged ? 'admin_update_permission' : 'admin_update'),
        target: adminId,
        status: 'SUCCESS',
        purpose: 'แก้ไขสิทธิ์หรือข้อมูลผู้ดูแลระบบ',
        context: {
          targetUsername: target.username,
          oldRole,
          newRole: target.role,
          oldPermissions,
          newPermissions: target.permissions,
          status: target.status
        }
      });
    }

    return {
      adminId: target.adminId,
      username: target.username,
      fullName: target.fullName,
      email: target.email,
      role: target.role,
      permissions: target.permissions,
      status: target.status,
      updatedAt: target.updatedAt
    };
  }
}


module.exports = {
  AdminIdentityService,
  hashPassword,
  verifyPassword
};
