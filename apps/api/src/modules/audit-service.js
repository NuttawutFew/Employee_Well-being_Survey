const crypto = require('crypto');

class AuditService {
  constructor({ db = null } = {}) {
    this.db = db;
    this.auditCollection = db?.collection ? db.collection('audit_logs') : null;
    this.events = [
      {
        eventId: 'EVT-20260903-012',
        id: 'EVT-20260903-012',
        timestamp: '2026-09-03T15:40:22.000Z',
        actor: 'superadmin',
        actorLogin: 'superadmin',
        actorName: 'สรวิชญ์ เมธากุล',
        actorRole: 'Super Admin',
        action: 'create_admin',
        target: 'ADM-004 (กัญญารัตน์ สุขสำราญ)',
        purpose: 'เพิ่มผู้ดูแลระบบคนใหม่ฝ่าย HR Corporate พร้อมสิทธิ์ Export',
        ip: '10.200.4.15',
        status: 'SUCCESS',
        context: {
          targetAdmin: 'ADM-004',
          permissions: { can_export: true },
          hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        }
      },
      {
        eventId: 'EVT-20260903-011',
        id: 'EVT-20260903-011',
        timestamp: '2026-09-03T15:12:05.000Z',
        actor: 'admin',
        actorLogin: 'admin',
        actorName: 'ณภัทร เจริญสุข',
        actorRole: 'Admin',
        action: 'export_results',
        target: 'All Employee Results (52 บริษัท)',
        purpose: 'ดาวน์โหลดรายงานสรุปคะแนนสุขภาพจิตประจำไตรมาส (Excel) โดยผ่านการยืนยันรหัสผ่าน',
        ip: '192.168.12.88',
        status: 'SUCCESS',
        context: {
          format: 'XLSX',
          rowsCount: 1248,
          hash: '7d5be5a2a5ef694ff8a38549e3bb8a04b5059e685f67a6d814ec4cfa6c757c91'
        }
      },
      {
        eventId: 'EVT-20260903-010',
        id: 'EVT-20260903-010',
        timestamp: '2026-09-03T14:45:19.000Z',
        actor: 'admin',
        actorLogin: 'admin',
        actorName: 'ณภัทร เจริญสุข',
        actorRole: 'Admin',
        action: 'view_sensitive_detail',
        target: 'EMP-10412 (กิตติพงษ์ มั่นคง)',
        purpose: 'ติดตามการส่งต่อแพทย์/ผู้เชี่ยวชาญ (กลุ่มความเสี่ยงสูง Burnout & ST-20)',
        ip: '192.168.12.88',
        status: 'SUCCESS',
        context: {
          targetEmployeeId: 'EMP-10412',
          purpose: 'medical_referral_followup',
          hash: 'cb2f8664f346a066914b4382c40c4ec3e6a47a165be8702b8d4f40f2b3b78c89'
        }
      },
      {
        eventId: 'EVT-20260903-009',
        id: 'EVT-20260903-009',
        timestamp: '2026-09-03T14:30:44.000Z',
        actor: 'admin_view',
        actorLogin: 'admin_view',
        actorName: 'รมิดา สิริชัย',
        actorRole: 'Admin',
        action: 'export_denied',
        target: 'Individual Results Table',
        purpose: 'พยายามกดส่งออกเอกสารรายงาน แต่ถูกปฏิเสธเนื่องจากไม่มีสิทธิ์ can_export',
        ip: '192.168.12.92',
        status: 'DENIED',
        context: {
          policyViolation: 'MISSING_EXPORT_PERMISSION',
          hash: '9a6c9e05f2b876a3e639648a1d77a875a6c94a50d2bbbe578c77f88e100e4782'
        }
      },
      {
        eventId: 'EVT-20260903-008',
        id: 'EVT-20260903-008',
        timestamp: '2026-09-03T13:58:30.000Z',
        actor: 'superadmin',
        actorLogin: 'superadmin',
        actorName: 'สรวิชญ์ เมธากุล',
        actorRole: 'Super Admin',
        action: 'reset_attempt',
        target: 'EMP-DEV-001 (ณิชา วัฒนกิจ)',
        purpose: 'พนักงานเกิดข้อผิดพลาดทางเทคนิคระหว่างส่งผลประเมิน (IT Incident #INC-4401)',
        ip: '10.200.4.15',
        status: 'SUCCESS',
        context: {
          targetEmployeeId: 'EMP-DEV-001',
          incidentTicket: 'INC-4401',
          hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
        }
      },
      {
        eventId: 'EVT-20260903-007',
        id: 'EVT-20260903-007',
        timestamp: '2026-09-03T13:15:10.000Z',
        actor: 'admin_view',
        actorLogin: 'admin_view',
        actorName: 'รมิดา สิริชัย',
        actorRole: 'Admin',
        action: 'view_sensitive_detail',
        target: 'EMP-11205 (ภัทรวดี แสงสุวรรณ)',
        purpose: 'ตรวจสอบความถูกต้องของข้อมูลตามคำร้องขอของพนักงาน (Data Subject Request)',
        ip: '192.168.12.92',
        status: 'SUCCESS',
        context: {
          targetEmployeeId: 'EMP-11205',
          purpose: 'data_subject_request',
          hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a'
        }
      },
      {
        eventId: 'EVT-20260903-006',
        id: 'EVT-20260903-006',
        timestamp: '2026-09-03T11:20:00.000Z',
        actor: 'superadmin',
        actorLogin: 'superadmin',
        actorName: 'สรวิชญ์ เมธากุล',
        actorRole: 'Super Admin',
        action: 'export_admins',
        target: 'Admin Accounts Directory',
        purpose: 'ส่งออกรายชื่อผู้ดูแลระบบและสิทธิ์การใช้งานเพื่อแนบรายงานประจำปี ISO 27001',
        ip: '10.200.4.15',
        status: 'SUCCESS',
        context: {
          format: 'XLSX',
          hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d'
        }
      },
      {
        eventId: 'EVT-20260903-005',
        id: 'EVT-20260903-005',
        timestamp: '2026-09-03T10:05:42.000Z',
        actor: 'admin',
        actorLogin: 'admin',
        actorName: 'ณภัทร เจริญสุข',
        actorRole: 'Admin',
        action: 'admin_login',
        target: 'Admin Console (Web Portal)',
        purpose: 'ยืนยันตัวตนสำเร็จผ่าน 2FA SSO องค์กร',
        ip: '192.168.12.88',
        status: 'SUCCESS',
        context: {
          mfaMethod: 'TOTP_AUTHENTICATOR',
          hash: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae'
        }
      },
      {
        eventId: 'EVT-20260903-004',
        id: 'EVT-20260903-004',
        timestamp: '2026-09-03T09:30:15.000Z',
        actor: 'superadmin',
        actorLogin: 'superadmin',
        actorName: 'สรวิชญ์ เมธากุล',
        actorRole: 'Super Admin',
        action: 'admin_login',
        target: 'Super Admin Console',
        purpose: 'ยืนยันตัวตนสำเร็จผ่าน 2FA Hardware Token',
        ip: '10.200.4.15',
        status: 'SUCCESS',
        context: {
          mfaMethod: 'FIDO2_SECURITY_KEY',
          hash: 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9'
        }
      }
    ]; // In-memory store with realistic seed data
  }

  async logEvent({
    actor,
    actorRole = 'ADMIN',
    action,
    target = null,
    status = 'SUCCESS',
    purpose = null,
    ip = null,
    userAgent = null,
    sessionId = null,
    context = {}
  }) {
    // Sensitive data sanitization (PDPA Data Minimization Principle):
    // Strictly filter out sensitive credentials, raw survey answers, or clinical scores from audit logs
    const sanitizedContext = { ...context };
    delete sanitizedContext.password;
    delete sanitizedContext.passwordHash;
    delete sanitizedContext.sessionToken;
    delete sanitizedContext.shareToken;
    delete sanitizedContext.answers;
    delete sanitizedContext.rawAnswers;
    delete sanitizedContext.scores;
    delete sanitizedContext.rawScores;
    delete sanitizedContext.diagnosis;
    delete sanitizedContext.mentalHealthScores;

    const event = {
      eventId: crypto.randomUUID(),
      actor: actor || 'system',
      actorRole: actorRole || 'ADMIN',
      action,
      target,
      status: status || 'SUCCESS',
      purpose: purpose || null,
      ip,
      userAgent: userAgent || null,
      sessionId: sessionId || null,
      context: sanitizedContext,
      timestamp: new Date().toISOString()
    };

    this.events.push(event);

    if (this.auditCollection) {
      try {
        await this.auditCollection.insertOne(event);
      } catch (err) {
        console.error('Failed to write to audit_logs collection:', err);
      }
    }

    if (this.db && typeof this.db.query === 'function') {
      try {
        await this.db.query(
          `INSERT INTO audit_events (event_id, actor, action, target, context, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [event.eventId, event.actor, event.action, event.target, JSON.stringify(event.context), event.timestamp]
        );
      } catch (err) {
        console.error('Failed to write audit event to database:', err);
      }
    }

    return event;
  }

  async getEvents({ actor = null, action = null, status = null, role = null, search = null, page = 1, limit = 50 } = {}) {
    let list = [...this.events];
    if (actor) list = list.filter((e) => e.actor === actor || e.actorLogin === actor);
    if (action) list = list.filter((e) => e.action === action);
    if (status) list = list.filter((e) => e.status === status);
    if (role) {
      list = list.filter((e) => (e.actorRole || '').toLowerCase().includes(role.toLowerCase()));
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        (e.eventId || e.id || '').toLowerCase().includes(q) ||
        (e.actor || e.actorLogin || '').toLowerCase().includes(q) ||
        (e.actorName || '').toLowerCase().includes(q) ||
        (e.target || '').toLowerCase().includes(q) ||
        (e.action || '').toLowerCase().includes(q) ||
        (e.ip || '').toLowerCase().includes(q) ||
        (e.purpose || '').toLowerCase().includes(q)
      );
    }

    const stats = {
      total: this.events.length,
      sensitiveViews: this.events.filter(e => e.action === 'view_sensitive_detail' || e.action === 'admin_view_individual').length,
      exportReports: this.events.filter(e => (e.action.startsWith('export_') || e.action === 'admin_export') && e.status === 'SUCCESS').length,
      permissionsUpdates: this.events.filter(e => ['create_admin', 'update_permissions', 'update_admin_permissions'].includes(e.action)).length
    };

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalCount = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    };
  }
}

module.exports = { AuditService };
