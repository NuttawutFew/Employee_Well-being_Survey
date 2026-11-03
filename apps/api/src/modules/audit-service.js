const crypto = require('crypto');

class AuditService {
  constructor({ db = null } = {}) {
    this.db = db;
    this.auditCollection = db?.collection ? db.collection('audit_logs') : null;
    this.events = []; // In-memory store for dev/testing
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

  async getEvents({ actor = null, action = null, status = null, page = 1, limit = 50 } = {}) {
    let list = [...this.events];
    if (actor) list = list.filter((e) => e.actor === actor);
    if (action) list = list.filter((e) => e.action === action);
    if (status) list = list.filter((e) => e.status === status);

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalCount = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
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
