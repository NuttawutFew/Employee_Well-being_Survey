class RetentionWorker {
  constructor({ sessionService, auditService = null, retentionYears = 1, auditRetentionYears = 2 } = {}) {
    this.sessionService = sessionService;
    this.auditService = auditService;
    this.retentionYears = retentionYears;
    this.auditRetentionYears = auditRetentionYears;
  }

  async runRetentionJob() {
    const result = await this.sessionService.anonymizeOldAssessments(this.retentionYears);
    return {
      success: true,
      timestamp: new Date().toISOString(),
      retentionYears: this.retentionYears,
      auditRetentionYears: this.auditRetentionYears,
      anonymizedCount: result.anonymizedCount
    };
  }
}


module.exports = { RetentionWorker };
