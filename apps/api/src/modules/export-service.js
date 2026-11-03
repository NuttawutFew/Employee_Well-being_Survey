const crypto = require('crypto');
const { getTenureYears, getTenureBracket } = require('@mental-health/shared-contracts');

const EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const SENSITIVE_WARNING = 'เอกสารข้อมูลสุขภาพส่วนบุคคลที่มีความอ่อนไหว — ห้ามเผยแพร่ต่อผู้ไม่มีสิทธิ์';

class ExportService {
  constructor({ auditService = null } = {}) {
    this.auditService = auditService;
    this.exports = new Map(); // downloadToken -> { exportId, fileName, contentType, content, expiresAt, adminUsername }
  }

  async createExport({ admin, format = 'csv', filters = {}, attempts = [] }) {
    const adminUsername = admin?.username || 'admin';
    const now = new Date();
    const timestampStr = now.toISOString();

    const exportId = crypto.randomUUID();
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EXPIRATION_MS).toISOString();

    let content = '';
    let contentType = '';
    let fileName = '';

    if (format === 'csv') {
      contentType = 'text/csv; charset=utf-8';
      fileName = `mental-health-report-${now.toISOString().slice(0, 10)}.csv`;

      // BOM for Excel Thai character encoding compatibility
      const bom = '\uFEFF';

      // Header comments and sensitive data warning
      const metadataHeader = [
        `# คำเตือน: ${SENSITIVE_WARNING}`,
        `# ผู้ส่งออก: ${adminUsername}`,
        `# เวลาส่งออก: ${now.toLocaleString('th-TH')}`,
        `# จำนวนรายการ: ${attempts.length} รายการ`,
        `# ข้อกำหนด PDPA: ไม่รวมคำตอบรายข้อ`,
        ''
      ].join('\r\n');

      const csvHeaders = [
        'รหัสพนักงาน',
        'ชื่อ-นามสกุล',
        'บริษัท',
        'แผนก',
        'ตำแหน่ง',
        'พื้นที่ปฏิบัติงาน',
        'เพศ',
        'อายุ',
        'อายุงาน',
        'วันที่ส่ง',
        'สถานะภาพรวม',
        'ภาวะหมดไฟ (Burnout)',
        'ความเครียด (Stress)',
        'โรคซึมเศร้า (9Q)'
      ].join(',');

      const csvRows = attempts.map((a) => {
        const snap = a.snapshot || {};
        const res = a.result || {};
        const tenureYears = getTenureYears(snap.startDate, a.submittedAt);
        const tenureBracket = getTenureBracket(tenureYears);

        const row = [
          `"${a.employeeId || ''}"`,
          `"${(snap.firstName || '') + ' ' + (snap.lastName || '')}"`,
          `"${snap.company || ''}"`,
          `"${snap.department || ''}"`,
          `"${snap.position || ''}"`,
          `"${snap.workArea || ''}"`,
          `"${snap.gender || ''}"`,
          `"${snap.age || ''}"`,
          `"${tenureBracket ? tenureBracket + ' ปี' : ''}"`,
          `"${a.submittedAt ? new Date(a.submittedAt).toLocaleString('th-TH') : ''}"`,
          `"${res.overall?.label || ''}"`,
          `"${res.burnout?.level || ''}"`,
          `"${res.stress?.label || ''} (${res.stress?.totalScore || 0}/60)"`,
          `"${res.q9?.label || ''} (${res.q9?.totalScore || 0}/27)"`
        ];
        return row.join(',');
      });

      content = bom + metadataHeader + csvHeaders + '\r\n' + csvRows.join('\r\n');
    } else if (format === 'excel') {
      // Excel XML / HTML Spreadsheet format
      contentType = 'application/vnd.ms-excel; charset=utf-8';
      fileName = `mental-health-report-${now.toISOString().slice(0, 10)}.xls`;

      content = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>รายงานผลสุขภาพใจ</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: "Angsana New", "TH Sarabun New", sans-serif; font-size: 14pt; }
    .warning { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; font-weight: bold; }
    th { background: #0b2545; color: #ffffff; border: 1px solid #cbd5e1; }
    td { border: 1px solid #cbd5e1; mso-number-format:"\\@"; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="14" class="warning">⚠️ คำเตือน: ${SENSITIVE_WARNING}</td></tr>
    <tr><td colspan="14">ผู้ส่งออก: ${adminUsername} | วันที่ส่งออก: ${now.toLocaleString('th-TH')} | จำนวน: ${attempts.length} รายการ | PDPA: ไม่รวมคำตอบรายข้อ</td></tr>
    <tr></tr>
    <thead>
      <tr>
        <th>รหัสพนักงาน</th>
        <th>ชื่อ-นามสกุล</th>
        <th>บริษัท</th>
        <th>แผนก</th>
        <th>ตำแหน่ง</th>
        <th>พื้นที่ปฏิบัติงาน</th>
        <th>เพศ</th>
        <th>อายุ</th>
        <th>อายุงาน</th>
        <th>วันที่ส่ง</th>
        <th>สถานะภาพรวม</th>
        <th>ภาวะหมดไฟ (Burnout)</th>
        <th>ความเครียด (Stress)</th>
        <th>โรคซึมเศร้า (9Q)</th>
      </tr>
    </thead>
    <tbody>
      ${attempts.map((a) => {
        const snap = a.snapshot || {};
        const res = a.result || {};
        const tenureYears = getTenureYears(snap.startDate, a.submittedAt);
        const tenureBracket = getTenureBracket(tenureYears);
        return `<tr>
          <td>${a.employeeId || ''}</td>
          <td>${(snap.firstName || '') + ' ' + (snap.lastName || '')}</td>
          <td>${snap.company || ''}</td>
          <td>${snap.department || ''}</td>
          <td>${snap.position || ''}</td>
          <td>${snap.workArea || ''}</td>
          <td>${snap.gender || ''}</td>
          <td>${snap.age || ''}</td>
          <td>${tenureBracket ? tenureBracket + ' ปี' : ''}</td>
          <td>${a.submittedAt ? new Date(a.submittedAt).toLocaleString('th-TH') : ''}</td>
          <td>${res.overall?.label || ''}</td>
          <td>${res.burnout?.level || ''}</td>
          <td>${res.stress?.label || ''} (${res.stress?.totalScore || 0}/60)</td>
          <td>${res.q9?.label || ''} (${res.q9?.totalScore || 0}/27)</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</body>
</html>`;
    } else {
      // PDF / Printable HTML report format
      contentType = 'text/html; charset=utf-8';
      fileName = `mental-health-report-${now.toISOString().slice(0, 10)}.html`;

      content = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานผลการประเมินสุขภาพใจ</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; color: #1e293b; }
    .warning { background: #fef2f2; border: 2px solid #ef4444; color: #991b1b; padding: 1rem; margin-bottom: 1.5rem; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
    th, td { border: 1px solid #cbd5e1; padding: 0.5rem; text-align: left; }
    th { background: #f1f5f9; }
  </style>
</head>
<body>
  <div class="warning">⚠️ ${SENSITIVE_WARNING}</div>
  <h2>รายงานผลการประเมินสุขภาพใจ</h2>
  <p>ผู้ส่งออก: ${adminUsername} | วันที่ส่งออก: ${now.toLocaleString('th-TH')} | จำนวน: ${attempts.length} คน</p>
  <table>
    <thead>
      <tr>
        <th>รหัสพนักงาน</th><th>ชื่อ-นามสกุล</th><th>แผนก</th><th>สถานะภาพรวม</th><th>Burnout</th><th>Stress</th><th>9Q</th>
      </tr>
    </thead>
    <tbody>
      ${attempts.map(a => `
        <tr>
          <td>${a.employeeId}</td>
          <td>${(a.snapshot?.firstName || '') + ' ' + (a.snapshot?.lastName || '')}</td>
          <td>${a.snapshot?.department || '-'}</td>
          <td>${a.result?.overall?.label || '-'}</td>
          <td>${a.result?.burnout?.level || '-'}</td>
          <td>${a.result?.stress?.label || '-'}</td>
          <td>${a.result?.q9?.label || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
    }

    this.exports.set(downloadToken, {
      exportId,
      fileName,
      contentType,
      content,
      expiresAt,
      adminUsername
    });

    // Record audit event with PDPA metadata
    if (this.auditService) {
      await this.auditService.logEvent({
        actor: adminUsername,
        actorRole: admin?.role || 'ADMIN',
        action: 'admin_export',
        target: exportId,
        status: 'SUCCESS',
        purpose: 'การส่งออกรายงานสรุปผลประเมินเพื่อวิเคราะห์เชิงสถิติ',
        context: {
          format,
          fileName,
          recordCount: attempts.length,
          filters
        }
      });
    }

    return {
      exportId,
      downloadToken,
      downloadUrl: `/api/admin/export/download/${downloadToken}`,
      fileName,
      expiresAt,
      recordCount: attempts.length,
      warning: SENSITIVE_WARNING
    };
  }

  getExportFile(downloadToken) {
    if (!downloadToken) return null;
    const entry = this.exports.get(downloadToken);
    if (!entry) return null;

    // Check expiration (15 minutes)
    if (Date.now() > new Date(entry.expiresAt).getTime()) {
      this.exports.delete(downloadToken);
      return null;
    }

    return entry;
  }
}

module.exports = {
  ExportService,
  SENSITIVE_WARNING
};
