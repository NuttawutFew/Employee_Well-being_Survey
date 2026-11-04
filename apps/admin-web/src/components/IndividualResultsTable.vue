<template>
  <div class="results-table-container">
    <!-- Multidimensional Filter Panel -->
    <FilterPanel @filters-changed="onFiltersChanged" />

    <!-- Toolbar: Search & Summary -->
    <div class="table-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="ค้นหาด้วยรหัสพนักงาน หรือชื่อ-นามสกุล..."
          class="search-input"
          @input="onSearchInput"
        />
        <button v-if="searchQuery" class="btn-clear-search" @click="clearSearch">✕</button>
      </div>

      <div class="toolbar-actions">
        <span class="total-badge">
          พบข้อมูลทั้งหมด: <strong>{{ pagination.totalCount }}</strong> รายการ
        </span>
        <!-- Step 12 & 20: กด Export เอกสาร / Step 21: Hide ปุ่ม Export -->
        <div v-if="canExport" class="export-container">
          <button class="btn-export" :disabled="loading || exporting" @click="openExportModal">
            <span v-if="exporting">กำลังส่งออก...</span>
            <span v-else>📥 กด Export เอกสาร</span>
          </button>
        </div>

        <button class="btn-refresh" :disabled="loading" @click="fetchData">
          <span v-if="loading">กำลังโหลด...</span>
          <span v-else>🔄 รีเฟรช</span>
        </button>
      </div>
    </div>

    <!-- Export Notification Banner -->
    <div v-if="exportNotice" class="export-notice-banner" role="status">
      <span>ℹ️ {{ exportNotice }}</span>
      <button class="btn-close-notice" @click="exportNotice = null">✕</button>
    </div>

    <!-- Error Banner -->
    <div v-if="error" class="error-banner" role="alert">
      <span>⚠️ {{ error }}</span>
      <button class="btn-retry" @click="fetchData">ลองใหม่</button>
    </div>

    <!-- Main Table -->
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="sortable" @click="toggleSort('submittedAt')">
              วันที่ส่ง
              <span class="sort-icon">{{ getSortIcon('submittedAt') }}</span>
            </th>
            <th class="sortable" @click="toggleSort('employeeId')">
              รหัสพนักงาน
              <span class="sort-icon">{{ getSortIcon('employeeId') }}</span>
            </th>
            <th class="sortable" @click="toggleSort('firstName')">
              ชื่อ-นามสกุล
              <span class="sort-icon">{{ getSortIcon('firstName') }}</span>
            </th>
            <th class="sortable" @click="toggleSort('department')">
              แผนก / ฝ่าย
              <span class="sort-icon">{{ getSortIcon('department') }}</span>
            </th>
            <th>รอบประเมิน</th>
            <th>สถานะภาพรวม</th>
            <th>Burnout</th>
            <th>ความเครียด</th>
            <th>โรคซึมเศร้า 9Q</th>
            <th class="th-actions">รายละเอียด</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading skeleton -->
          <tr v-if="loading && items.length === 0">
            <td colspan="10" class="loading-cell">
              กำลังโหลดข้อมูลการประเมิน...
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="items.length === 0">
            <td colspan="10" class="empty-cell">
              <span class="empty-icon">📭</span>
              <p>ยังไม่มีข้อมูลการส่งแบบประเมิน หรือไม่พบรายการที่ตรงกับเงื่อนไขตัวกรอง</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr v-for="item in items" :key="item.attemptId" class="data-row">
            <td class="cell-date">{{ formatDateTime(item.submittedAt || item.createdAt) }}</td>
            <td class="cell-empid">
              <code>{{ item.employeeId }}</code>
            </td>
            <td class="cell-name">
              <strong>{{ getEmployeeFullName(item.snapshot) }}</strong>
            </td>
            <td class="cell-dept">{{ item.snapshot ? item.snapshot.department : '-' }}</td>
            <td class="cell-round">
              <span class="round-badge" :class="item.totalRounds > 1 ? 'round-badge-multi' : ''">
                รอบ {{ item.round || 1 }}{{ (item.totalRounds > 1 && item.round === item.totalRounds) ? ' (ล่าสุด)' : '' }}
              </span>
              <span 
                v-if="item.totalRounds > 1" 
                class="history-pill" 
                :title="'มีประวัติประเมินสะสม ' + item.totalRounds + ' รอบ (คลิกเพื่อดูรายละเอียด)'"
                @click.stop="viewDetail(item)"
              >
                📜 ประวัติ {{ item.totalRounds }} รอบ
              </span>
            </td>
            <td>
              <span 
                v-if="item.status === 'CANCELLED'"
                class="badge-status status-cancelled"
              >
                🔄 รีเซ็ตแล้ว
              </span>
              <span 
                v-else-if="item.result && item.result.overall" 
                class="badge-status"
                :class="item.result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? 'status-care' : 'status-normal'"
              >
                {{ item.result.overall.status === 'NEEDS_ADDITIONAL_CARE' ? '⚠️ ควรดูแลเพิ่ม' : '✅ ปกติ' }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span 
                v-if="item.result && item.result.burnout" 
                class="badge-level" 
                :class="getLevelClass(item.result.burnout.level)"
              >
                {{ formatLevelThai(item.result.burnout.level) }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span 
                v-if="item.result && item.result.stress" 
                class="badge-level" 
                :class="getStressClass(item.result.stress.level)"
              >
                {{ item.result.stress.label }}
              </span>
              <span v-else>-</span>
            </td>
            <td>
              <span 
                v-if="item.result && item.result.q9" 
                class="badge-level" 
                :class="get9QClass(item.result.q9.level)"
              >
                {{ item.result.q9.label }}
              </span>
              <span v-else>-</span>
            </td>
            <td class="cell-actions">
              <button class="btn-detail" @click="viewDetail(item)">
                ดูรายละเอียด
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->
    <div class="pagination-bar">
      <div class="page-size-selector">
        <label for="limit-select">แสดงแถว:</label>
        <select id="limit-select" v-model="pagination.limit" @change="onLimitChange">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>

      <div class="pagination-buttons">
        <button
          class="btn-page"
          :disabled="pagination.page <= 1 || loading"
          @click="changePage(pagination.page - 1)"
        >
          ‹ ก่อนหน้า
        </button>
        <span class="page-indicator">
          หน้า <strong>{{ pagination.page }}</strong> จาก {{ pagination.totalPages }}
        </span>
        <button
          class="btn-page"
          :disabled="pagination.page >= pagination.totalPages || loading"
          @click="changePage(pagination.page + 1)"
        >
          ถัดไป ›
        </button>
      </div>
    </div>

    <!-- PDPA Access Purpose Prompt Modal -->
    <div v-if="purposePromptItem" class="modal-backdrop" @click.self="closePurposePrompt">
      <div class="modal-dialog purpose-dialog">
        <div class="modal-header">
          <div class="header-title-wrap">
            <span class="pdpa-badge">🔒 PDPA Security & Accountability</span>
            <h3>ระบุวัตถุประสงค์ในการเข้าดูข้อมูลสุขภาพ</h3>
          </div>
          <button class="btn-close-modal" @click="closePurposePrompt">✕</button>
        </div>

        <div class="modal-body">
          <div class="pdpa-notice-alert">
            <div class="pdpa-notice-icon">⚖️</div>
            <div class="pdpa-notice-content">
              <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (มาตรา 26 & 37)</strong>
              <p>
                ข้อมูลผลการประเมินสุขภาพใจเป็น <em>ข้อมูลส่วนบุคคลที่มีความอ่อนไหว (Sensitive Personal Data)</em> 
                การเปิดดูรายละเอียดของ <strong>{{ purposePromptItem.employeeId }}</strong> จะถูกบันทึกประวัติการเข้าถึง (Audit Trail) พร้อมระบุตัวตนและวัตถุประสงค์โดยอัตโนมัติ
              </p>
            </div>
          </div>

          <div class="purpose-selection-form">
            <label class="purpose-form-label">
              <strong>เลือกวัตถุประสงค์ในการเข้าถึงข้อมูล:</strong>
            </label>
            
            <div class="purpose-radio-list">
              <label 
                v-for="(option, idx) in purposeOptions" 
                :key="idx" 
                class="purpose-radio-item"
                :class="{ active: selectedPurpose === option.value }"
              >
                <input 
                  type="radio" 
                  name="purposeGroup" 
                  :value="option.value" 
                  v-model="selectedPurpose" 
                />
                <div class="radio-content">
                  <span class="radio-title">{{ option.label }}</span>
                  <span class="radio-desc">{{ option.description }}</span>
                </div>
              </label>
            </div>

            <div v-if="selectedPurpose === 'CUSTOM'" class="custom-purpose-box">
              <label for="custom-purpose-input">ระบุวัตถุประสงค์เพิ่มเติม (จำเป็น):</label>
              <input 
                id="custom-purpose-input" 
                v-model="customPurpose" 
                placeholder="เช่น ตรวจสอบกรณีข้อร้องเรียนเลขที่ HR-2026-08..."
                class="custom-purpose-input"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closePurposePrompt" :disabled="fetchingDetail">ยกเลิก</button>
          <button 
            class="btn-confirm-purpose" 
            :disabled="fetchingDetail || (selectedPurpose === 'CUSTOM' && !customPurpose.trim())" 
            @click="confirmViewDetail"
          >
            <span v-if="fetchingDetail">กำลังประมวลผล...</span>
            <span v-else>✓ ยืนยันวัตถุประสงค์และเปิดดูข้อมูล</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedItem" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal-dialog">
        <div class="modal-header">
          <div class="modal-header-title-wrap">
            <h3>รายละเอียดผลการประเมิน: {{ selectedItem.employeeId }}</h3>
            <span class="badge-unmask-indicator">🔒 Encrypted at Rest • HR Authorized</span>
          </div>
          <button class="btn-close-modal" @click="closeDetail">✕</button>
        </div>

        <div class="modal-body">
          <!-- PDPA Audit Trail Banner -->
          <div v-if="lastLoggedPurpose" class="pdpa-audit-badge-banner">
            <span class="badge-icon">🔒</span>
            <span>บันทึกการเข้าถึงข้อมูลสุขภาพนี้ลงใน <strong>Audit Trail</strong> เรียบร้อยแล้ว (วัตถุประสงค์: <em>{{ lastLoggedPurpose }}</em>)</span>
          </div>

          <!-- Multi-Round Journey Timeline Stepper -->
          <div v-if="selectedItem.attempts && selectedItem.attempts.length > 1" class="journey-timeline-card">
            <div class="journey-timeline-header">
              <span class="journey-timeline-title">
                📈 เส้นทางพัฒนาการสุขภาวะรายบุคคล (Well-being Journey — ประวัติสะสม <strong>{{ selectedItem.attempts.length }}</strong> รอบ)
              </span>
              <span class="journey-timeline-sub">💡 คลิกที่รอบใดก็ได้บนเส้นทางเพื่อสลับดูผลประเมินของรอบนั้น</span>
            </div>
            <div class="journey-timeline-steps">
              <div v-for="(att, idx) in selectedItem.attempts" :key="att.attemptId || att.round" class="journey-step-wrapper">
                <button 
                  type="button" 
                  class="journey-step-btn" 
                  :class="{ 'is-active': att.round === currentModalRound }"
                  :title="'คลิกเพื่อสลับดูผลรอบที่ ' + att.round"
                  @click="selectRound(att.round)"
                >
                  <span class="journey-step-title">
                    รอบ {{ att.round }} {{ isLatestRound(att) ? '★ (ล่าสุด)' : att.round === 1 ? '(Baseline)' : '' }}
                  </span>
                  <span class="journey-step-date">{{ formatShortDate(att.submittedAt || att.createdAt) }}</span>
                  <span v-if="att.status === 'CANCELLED'" class="journey-step-badge badge-cancelled">🔄 รีเซ็ตแล้ว</span>
                  <span v-else-if="att.result && att.result.overall && att.result.overall.status === 'NEEDS_ADDITIONAL_CARE'" class="journey-step-badge badge-danger">ควรดูแล 🟡</span>
                  <span v-else class="journey-step-badge badge-normal">ปกติ 🟢</span>
                </button>
                <span v-if="idx < selectedItem.attempts.length - 1" class="journey-step-connector">➔</span>
              </div>
            </div>
          </div>

          <!-- Round / Attempt Selector Bar -->
          <div v-if="selectedItem.attempts && selectedItem.attempts.length > 1" class="attempt-tabs-bar">
            <div class="attempt-tabs-left">
              <span class="attempt-tab-label">📋 เลือกรอบประเมิน:</span>
              <select v-model="currentModalRound" class="round-quick-select" @change="onRoundSelectChange">
                <option v-for="att in selectedItem.attempts" :key="att.attemptId || att.round" :value="att.round">
                  รอบที่ {{ att.round }}{{ isLatestRound(att) ? ' (ล่าสุด)' : att.round === 1 ? ' (Baseline)' : '' }} — {{ getRoundStatusText(att) }} ({{ formatDateTime(att.submittedAt || att.createdAt) }})
                </option>
              </select>
              <div class="attempt-tab-group">
                <button 
                  v-for="att in selectedItem.attempts" 
                  :key="att.attemptId || att.round" 
                  type="button" 
                  class="attempt-tab-btn" 
                  :class="{ 'is-active': att.round === currentModalRound }"
                  @click="selectRound(att.round)"
                >
                  {{ att.round === currentModalRound ? '✓ ' : '' }}รอบ {{ att.round }}{{ isLatestRound(att) ? ' (ล่าสุด)' : att.round === 1 ? ' (Baseline)' : '' }}
                </button>
              </div>
            </div>
            <button 
              type="button" 
              class="btn-compare-rounds" 
              :class="{ 'is-active': isComparisonOpen }"
              @click="isComparisonOpen = !isComparisonOpen"
            >
              {{ isComparisonOpen ? '✕ ซ่อนตารางเปรียบเทียบ' : '📊 เปรียบเทียบพัฒนาการ (' + selectedItem.attempts.length + ' รอบสะสม)' }}
            </button>
          </div>

          <!-- Historical Round Banner Indicator -->
          <div v-if="displayedAttempt" class="round-history-banner" :class="getBannerClass(displayedAttempt)">
            <span class="banner-icon">{{ getBannerIcon(displayedAttempt) }}</span>
            <span class="banner-text">
              <template v-if="displayedAttempt.status === 'CANCELLED'">
                คุณกำลังดูผลการประเมิน <strong>รอบที่ {{ displayedAttempt.round }}</strong> — รอบนี้ถูกรีเซ็ตโดย Admin (เหตุผล: "<em>{{ displayedAttempt.cancelledReason || 'ไม่ระบุ' }}</em>") <span class="archived-pill">🔒 จัดเก็บถาวรในระบบ</span>
              </template>
              <template v-else-if="displayedAttempt.round === 1 && selectedItem.attempts && selectedItem.attempts.length > 1">
                คุณกำลังดูผลการประเมิน <strong>รอบที่ 1 (ประวัติเริ่มต้น / Baseline)</strong> — บันทึกเมื่อ {{ formatDateTime(displayedAttempt.submittedAt || displayedAttempt.createdAt) }} <span class="archived-pill">🔒 จัดเก็บถาวรในระบบ</span>
              </template>
              <template v-else-if="isLatestRound(displayedAttempt) && selectedItem.attempts && selectedItem.attempts.length > 1">
                คุณกำลังดูผลการประเมิน <strong>รอบที่ {{ displayedAttempt.round }} (รอบล่าสุด / Follow-up ล่าสุด)</strong> — บันทึกเมื่อ {{ formatDateTime(displayedAttempt.submittedAt || displayedAttempt.createdAt) }}
              </template>
              <template v-else>
                คุณกำลังดูผลการประเมิน <strong>รอบที่ {{ displayedAttempt.round || 1 }}</strong> — บันทึกเมื่อ {{ formatDateTime(displayedAttempt.submittedAt || displayedAttempt.createdAt) }}
              </template>
            </span>
          </div>

          <!-- Cancelled Round Notice Alert -->
          <div v-if="displayedAttempt && displayedAttempt.status === 'CANCELLED'" class="cancelled-round-notice">
            <div class="cancelled-notice-icon">⚠️</div>
            <div class="cancelled-notice-content">
              <strong>รอบนี้ถูกยกเลิก/รีเซ็ตโดยผู้ดูแลระบบ</strong>
              <p>
                รีเซ็ตเมื่อ: {{ formatDateTime(displayedAttempt.cancelledAt) }} โดย <code>{{ displayedAttempt.cancelledBy || 'admin' }}</code><br />
                เหตุผล: "<em>{{ displayedAttempt.cancelledReason }}</em>"
              </p>
              <span class="cancelled-data-archived">🔒 ข้อมูลถูกคงไว้เพื่อเป็นหลักฐานเชิงสถิติและการตรวจสอบ (Audit Trail) แต่จะไม่ถูกนำไปรวมในสถิติแบบประเมินปัจจุบัน</span>
            </div>
          </div>

          <!-- Comparison Box (Toggled by btn-compare-rounds) -->
          <div v-if="isComparisonOpen && selectedItem.attempts && selectedItem.attempts.length > 1" class="compare-box">
            <div class="compare-mode-tab-group">
              <button 
                type="button" 
                class="compare-mode-tab-btn" 
                :class="{ 'is-active': compareMode === 'two' }" 
                @click="compareMode = 'two'"
              >
                ⚡ เปรียบเทียบ 2 รอบ (Two-Round Compare)
              </button>
              <button 
                type="button" 
                class="compare-mode-tab-btn" 
                :class="{ 'is-active': compareMode === 'matrix' }" 
                @click="compareMode = 'matrix'"
              >
                📋 ตารางแนวโน้มทุกรอบ (All-Rounds Timeline Matrix)
              </button>
            </div>

            <!-- View 1: Two-Round Compare -->
            <div v-if="compareMode === 'two'" class="compare-view-two">
              <div class="compare-filter-toolbar">
                <div class="compare-selectors">
                  <strong>เลือกรอบที่จะเปรียบเทียบ:</strong>
                  <select v-model="compareRoundA" class="compare-select">
                    <option v-for="att in selectedItem.attempts" :key="'a-' + att.round" :value="att.round">
                      รอบที่ {{ att.round }}{{ att.round === 1 ? ' (Baseline)' : '' }}
                    </option>
                  </select>
                  <span class="vs-text">vs</span>
                  <select v-model="compareRoundB" class="compare-select">
                    <option v-for="att in selectedItem.attempts" :key="'b-' + att.round" :value="att.round">
                      รอบที่ {{ att.round }}{{ isLatestRound(att) ? ' (ล่าสุด)' : '' }}
                    </option>
                  </select>
                </div>
                <div class="compare-presets">
                  <button type="button" class="compare-preset-btn" @click="setPresetPrevLatest">
                    ⚡ ล่าสุด vs ก่อนหน้า
                  </button>
                  <button type="button" class="compare-preset-btn" @click="setPresetBaseLatest">
                    ⚡ ล่าสุด vs รอบแรกสุด (Baseline)
                  </button>
                </div>
              </div>

              <div class="compare-table-wrapper">
                <table class="compare-table">
                  <thead>
                    <tr>
                      <th>มิติการประเมิน</th>
                      <th>รอบที่ {{ roundAttemptA ? roundAttemptA.round : 'A' }} ({{ formatShortDate(roundAttemptA ? roundAttemptA.submittedAt : '') }})</th>
                      <th>รอบที่ {{ roundAttemptB ? roundAttemptB.round : 'B' }} ({{ formatShortDate(roundAttemptB ? roundAttemptB.submittedAt : '') }})</th>
                      <th>แนวโน้ม / การเปลี่ยนแปลง</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in twoRoundComparisonRows" :key="row.dimension">
                      <td><strong>{{ row.dimension }}</strong></td>
                      <td>{{ row.valA }}</td>
                      <td>{{ row.valB }}</td>
                      <td><span class="trend-tag" :class="row.trendClass">{{ row.trendText }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- View 2: All-Rounds Matrix -->
            <div v-if="compareMode === 'matrix'" class="compare-view-matrix">
              <div class="matrix-hint">
                💡 ตารางนี้แสดงผลการประเมินและพัฒนาการของพนักงานในทุกรอบที่เคยทำไว้ทั้งหมดตั้งแต่เริ่มต้นจนถึงปัจจุบัน
              </div>
              <div class="compare-table-wrapper">
                <table class="all-rounds-matrix-table">
                  <thead>
                    <tr>
                      <th>มิติการประเมิน</th>
                      <th v-for="att in selectedItem.attempts" :key="'th-' + att.round" :class="{ 'matrix-latest-col': isLatestRound(att) }">
                        รอบที่ {{ att.round }} {{ isLatestRound(att) ? '★ (ล่าสุด)' : att.round === 1 ? '(Baseline)' : '' }}
                        <br /><span class="matrix-th-date">{{ formatShortDate(att.submittedAt || att.createdAt) }}</span>
                      </th>
                      <th class="matrix-th-summary">พัฒนาการรวม (ต้น ➔ ล่าสุด)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in allRoundsMatrixRows" :key="row.dimension">
                      <td>{{ row.dimension }}</td>
                      <td v-for="(cell, cIdx) in row.cells" :key="cIdx" :class="{ 'matrix-latest-col': isLatestRound(selectedItem.attempts[cIdx]) }">
                        {{ cell }}
                      </td>
                      <td><span class="trend-tag" :class="row.summaryTrendClass">{{ row.summaryTrendText }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Demographic Snapshot -->
          <div class="detail-section">
            <div class="snapshot-header-bar">
              <h4>ข้อมูลพนักงาน ณ เวลาส่ง (Employee Snapshot)</h4>
            </div>

            <div v-if="displayedAttempt && displayedAttempt.snapshot" class="snapshot-grid">
              <div class="grid-item">
                <span class="label">ชื่อ-นามสกุล:</span>
                <strong>
                  {{ getEmployeeFullName(displayedAttempt.snapshot) }}
                </strong>
              </div>
              <div class="grid-item">
                <span class="label">รหัสพนักงาน:</span>
                <code>
                  {{ displayedAttempt.employeeId }}
                </code>
              </div>
              <div class="grid-item">
                <span class="label">บริษัท:</span>
                <span>{{ displayedAttempt.snapshot.company || '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="label">แผนก / ฝ่าย:</span>
                <span>{{ displayedAttempt.snapshot.department || '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="label">ตำแหน่ง:</span>
                <span>{{ displayedAttempt.snapshot.position || '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="label">พื้นที่ปฏิบัติงาน:</span>
                <span>{{ displayedAttempt.snapshot.workArea || '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="label">เพศ / อายุ:</span>
                <span>{{ displayedAttempt.snapshot.gender || '-' }} / {{ displayedAttempt.snapshot.age ? displayedAttempt.snapshot.age + ' ปี' : '-' }}</span>
              </div>
              <div class="grid-item">
                <span class="label">วันที่ส่งประเมิน:</span>
                <span>{{ formatDateTime(displayedAttempt.submittedAt || displayedAttempt.createdAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Assessment Dimension Results -->
          <div v-if="displayedAttempt && displayedAttempt.result" class="detail-section">
            <h4>ผลลัพธ์จำแนกตาม 3 เครื่องมือมาตรฐาน (รอบที่ {{ displayedAttempt.round }})</h4>
            
            <div class="result-breakdown-cards">
              <!-- Burnout -->
              <div class="breakdown-card">
                <strong>1. ภาวะหมดไฟ (Burnout): ระดับ {{ formatLevelThai(displayedAttempt.result.burnout ? displayedAttempt.result.burnout.level : '') }}</strong>
                <ul v-if="displayedAttempt.result.burnout && displayedAttempt.result.burnout.dimensions">
                  <li>ความอ่อนล้าทางอารมณ์ (EE): {{ displayedAttempt.result.burnout.dimensions.EE.score }} คะแนน (ระดับ {{ formatLevelThai(displayedAttempt.result.burnout.dimensions.EE.level) }})</li>
                  <li>การลดความเป็นบุคคล (DP): {{ displayedAttempt.result.burnout.dimensions.DP.score }} คะแนน (ระดับ {{ formatLevelThai(displayedAttempt.result.burnout.dimensions.DP.level) }})</li>
                  <li>ความสำเร็จส่วนบุคคล (PA): {{ displayedAttempt.result.burnout.dimensions.PA.score }} คะแนน (ระดับ {{ formatLevelThai(displayedAttempt.result.burnout.dimensions.PA.level) }})</li>
                </ul>
              </div>

              <!-- Stress -->
              <div class="breakdown-card">
                <strong>2. ความเครียด (ST-20): {{ displayedAttempt.result.stress ? displayedAttempt.result.stress.totalScore : 0 }}/60 คะแนน</strong>
                <p>ระดับ: {{ displayedAttempt.result.stress ? displayedAttempt.result.stress.label : '-' }}</p>
              </div>

              <!-- 9Q -->
              <div class="breakdown-card">
                <strong>3. ภาวะเสี่ยงซึมเศร้า (9Q): {{ displayedAttempt.result.q9 ? displayedAttempt.result.q9.totalScore : 0 }}/27 คะแนน</strong>
                <p>ระดับ: {{ displayedAttempt.result.q9 ? displayedAttempt.result.q9.label : '-' }}</p>
              </div>
            </div>
          </div>

          <!-- Employee Feedback (Optional) -->
          <div v-if="displayedAttempt && displayedAttempt.feedback" class="detail-section">
            <div class="snapshot-header-bar">
              <h4>ข้อเสนอแนะเพิ่มเติมจากพนักงาน (Employee Feedback)</h4>
            </div>
            <div class="feedback-quote-box">
              <span class="feedback-quote-icon">💬</span>
              <p class="feedback-quote-text">“{{ displayedAttempt.feedback }}”</p>
            </div>
          </div>

          <!-- PDPA Notice -->
          <div class="pdpa-callout">
            <span class="icon">🔒</span>
            <p><strong>นโยบายความเป็นส่วนตัว (PDPA):</strong> ไม่อนุญาตให้ระบบเปิดเผยคำตอบรายข้อของผู้ทำแบบประเมินต่อผู้ดูแลระบบหรือบุคคลภายนอก</p>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            v-if="displayedAttempt && displayedAttempt.status === 'SUBMITTED'" 
            class="btn-reset-attempt" 
            @click="openResetModal(displayedAttempt)"
          >
            🔄 รีเซ็ตผลการประเมิน (รอบที่ {{ displayedAttempt.round }})
          </button>
          <span v-else-if="displayedAttempt && displayedAttempt.status === 'CANCELLED'" class="badge-reset-done">
            🔒 รอบที่ {{ displayedAttempt.round }} ถูกรีเซ็ตแล้ว (จัดเก็บในประวัติ)
          </span>
          <button class="btn-modal-close" @click="closeDetail">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>

    <!-- Reset Confirmation Dialog -->
    <div v-if="resetModalItem" class="modal-backdrop modal-reset-backdrop" @click.self="closeResetModal">
      <div class="modal-dialog modal-sm">
        <div class="modal-header modal-header-danger">
          <h3>ยืนยันการรีเซ็ตผลการประเมิน</h3>
          <button class="btn-close-modal" @click="closeResetModal">✕</button>
        </div>
        <div class="modal-body">
          <p class="reset-desc">
            การรีเซ็ตจะยกเลิกผลการประเมินฉบับนี้ของพนักงาน <strong>{{ resetModalItem.employeeId }} ({{ getEmployeeFullName(resetModalItem.snapshot) }})</strong> 
            และเปิดสิทธิ์ให้พนักงานสามารถเข้าทำแบบประเมินฉบับใหม่ได้
          </p>
          <div class="form-group">
            <label for="reset-reason"><strong>ระบุเหตุผลในการรีเซ็ต (จำเป็น)*</strong></label>
            <textarea
              id="reset-reason"
              v-model="resetReason"
              rows="3"
              class="reset-reason-textarea"
              placeholder="กรุณาระบุเหตุผลอย่างละเอียด เช่น พนักงานส่งคำขอขอทำใหม่เนื่องจากลงข้อมูลผิดพลาด..."
            ></textarea>
          </div>
          <div v-if="resetError" class="reset-error-msg">
            ⚠️ {{ resetError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" :disabled="resetLoading" @click="closeResetModal">ยกเลิก</button>
          <button 
            class="btn-confirm-danger" 
            :disabled="!resetReason.trim() || resetLoading" 
            @click="submitReset"
          >
            <span v-if="resetLoading">กำลังดำเนินการ...</span>
            <span v-else>ยืนยันการรีเซ็ต</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Export Password Confirmation Modal (Step 12-15 & Step 20-24) -->
    <div v-if="showExportModal" class="modal-backdrop modal-export-backdrop" @click.self="closeExportModal">
      <div class="modal-dialog modal-sm">
        <div class="modal-header">
          <h3>📥 ส่งออกรายงาน (Export เอกสาร)</h3>
          <button class="btn-close-modal" @click="closeExportModal">✕</button>
        </div>
        <div class="modal-body">
          <!-- Step 12 & 20: Format selection Excel / Csv -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem; color: #1e293b;">
              รูปแบบไฟล์เอกสาร (Export Format) <span style="color: #dc2626;">*</span>
            </label>
            <div style="display: flex; gap: 1rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                <input type="radio" v-model="exportFormat" value="excel" />
                <span>📊 Excel (.xls/.xlsx)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.9rem;">
                <input type="radio" v-model="exportFormat" value="csv" />
                <span>📄 CSV (.csv)</span>
              </label>
            </div>
          </div>

          <p style="font-size: 0.85rem; color: #475569; line-height: 1.5; margin-bottom: 1rem;">
            🔒 เพื่อความปลอดภัยและปฏิบัติตามมาตรฐาน PDPA กรุณากรอก <strong>Password ONE ID</strong> ของคุณ เพื่อยืนยันสิทธิ์ในการดาวน์โหลดเอกสาร (ระบบเก็บ Log ผู้ใช้ที่ทำการ Export)
          </p>

          <!-- Step 13 & 22: กรอกรหัส User (Password ONE ID) -->
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label for="exportPasswordInput" style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.35rem; color: #1e293b;">
              Password ONE ID <span style="color: #dc2626;">*</span>
            </label>
            <input
              id="exportPasswordInput"
              v-model="exportPassword"
              type="password"
              class="form-control"
              placeholder="กรอกรหัสผ่าน ONE ID ของคุณ..."
              style="width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.95rem; box-sizing: border-box;"
              @keyup.enter="confirmExport"
            />
          </div>

          <!-- Step 15 & 24: แสดงแจ้งเตือนรหัสผ่านไม่ถูกต้อง ไม่สามารถดาวน์โหลดเอกสารได้ -->
          <div v-if="exportModalError" style="margin-top: 0.5rem; color: #dc2626; font-size: 0.85rem; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 4px; border: 1px solid #fecaca;">
            ⚠️ {{ exportModalError }}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" :disabled="exporting" @click="closeExportModal">ยกเลิก</button>
          <button 
            class="btn-confirm-export" 
            :disabled="!exportPassword || exporting" 
            style="background: #16a34a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer;"
            @click="confirmExport"
          >
            <span v-if="exporting">กำลังส่งออก...</span>
            <span v-else>ยืนยันและดาวน์โหลด ({{ exportFormat === 'csv' ? 'CSV' : 'Excel' }})</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FilterPanel from './FilterPanel.vue';

export default {
  name: 'IndividualResultsTable',
  components: {
    FilterPanel
  },
  props: {
    admin: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    canExport() {
      if (!this.admin) return true;
      const role = (this.admin.role || '').toLowerCase();
      if (role === 'super_admin') return true;
      const perms = this.admin.permissions || [];
      return perms.includes('can_export');
    },
    displayedAttempt() {
      if (!this.selectedItem) return null;
      if (!this.selectedItem.attempts || this.selectedItem.attempts.length <= 1) {
        return this.selectedItem;
      }
      const match = this.selectedItem.attempts.find((a) => a.round === this.currentModalRound);
      return match || this.selectedItem;
    },
    latestRoundNumber() {
      if (!this.selectedItem || !this.selectedItem.attempts || this.selectedItem.attempts.length === 0) {
        return this.selectedItem?.round || 1;
      }
      return Math.max(...this.selectedItem.attempts.map((a) => a.round || 1));
    },
    roundAttemptA() {
      if (!this.selectedItem || !this.selectedItem.attempts) return null;
      return this.selectedItem.attempts.find((a) => a.round === this.compareRoundA) || this.selectedItem.attempts[0];
    },
    roundAttemptB() {
      if (!this.selectedItem || !this.selectedItem.attempts) return null;
      const latest = this.selectedItem.attempts[this.selectedItem.attempts.length - 1];
      return this.selectedItem.attempts.find((a) => a.round === this.compareRoundB) || latest;
    },
    twoRoundComparisonRows() {
      const rA = this.roundAttemptA;
      const rB = this.roundAttemptB;
      if (!rA || !rB) return [];

      const rows = [];

      // 1. Overall Status
      const sA = (rA.result && rA.result.overall && rA.result.overall.status === 'NEEDS_ADDITIONAL_CARE') ? 2 : 1;
      const sB = (rB.result && rB.result.overall && rB.result.overall.status === 'NEEDS_ADDITIONAL_CARE') ? 2 : 1;
      let statusTrendClass = 'trend-same';
      let statusTrendText = 'คงเดิม ⚪';
      if (sB < sA) {
        statusTrendClass = 'trend-better';
        statusTrendText = 'ดีขึ้นอย่างชัดเจน 🟢';
      } else if (sB > sA) {
        statusTrendClass = 'trend-worse';
        statusTrendText = 'ต้องเฝ้าระวังเพิ่ม 🔴';
      }
      const labelA = rA.result?.overall?.status === 'NEEDS_ADDITIONAL_CARE' ? '⚠️ ควรดูแลเพิ่ม' : (rA.result ? '✅ ปกติ' : (rA.status === 'CANCELLED' ? '🔄 รีเซ็ตแล้ว' : '-'));
      const labelB = rB.result?.overall?.status === 'NEEDS_ADDITIONAL_CARE' ? '⚠️ ควรดูแลเพิ่ม' : (rB.result ? '✅ ปกติ' : (rB.status === 'CANCELLED' ? '🔄 รีเซ็ตแล้ว' : '-'));
      rows.push({
        dimension: 'สถานะภาพรวม',
        valA: labelA,
        valB: labelB,
        trendClass: statusTrendClass,
        trendText: statusTrendText
      });

      // 2. Burnout
      const boOrder = { 'LOW': 1, 'MODERATE': 2, 'HIGH': 3 };
      const bLevelA = rA.result?.burnout?.level || 'LOW';
      const bLevelB = rB.result?.burnout?.level || 'LOW';
      const bValA = boOrder[bLevelA] || 1;
      const bValB = boOrder[bLevelB] || 1;
      let boTrendClass = 'trend-same';
      let boTrendText = `คงที่ (${this.formatLevelThai(bLevelB)}) ⚪`;
      if (bValB < bValA) {
        boTrendClass = 'trend-better';
        boTrendText = `ลดความเสี่ยง (${this.formatLevelThai(bLevelA)} ➔ ${this.formatLevelThai(bLevelB)}) 🟢`;
      } else if (bValB > bValA) {
        boTrendClass = 'trend-worse';
        boTrendText = `ความเสี่ยงเพิ่ม (${this.formatLevelThai(bLevelA)} ➔ ${this.formatLevelThai(bLevelB)}) 🔴`;
      }
      const boTextA = rA.result?.burnout ? `ระดับ ${this.formatLevelThai(bLevelA)}` + (rA.result.burnout.dimensions ? ` (EE:${rA.result.burnout.dimensions.EE?.score}, DP:${rA.result.burnout.dimensions.DP?.score}, PA:${rA.result.burnout.dimensions.PA?.score})` : '') : '-';
      const boTextB = rB.result?.burnout ? `ระดับ ${this.formatLevelThai(bLevelB)}` + (rB.result.burnout.dimensions ? ` (EE:${rB.result.burnout.dimensions.EE?.score}, DP:${rB.result.burnout.dimensions.DP?.score}, PA:${rB.result.burnout.dimensions.PA?.score})` : '') : '-';
      rows.push({
        dimension: '1. ภาวะหมดไฟ (Burnout)',
        valA: boTextA,
        valB: boTextB,
        trendClass: boTrendClass,
        trendText: boTrendText
      });

      // 3. Stress ST-20
      const stScoreA = rA.result?.stress?.totalScore ?? 0;
      const stScoreB = rB.result?.stress?.totalScore ?? 0;
      const stDiff = stScoreB - stScoreA;
      let stTrendClass = 'trend-same';
      let stTrendText = `คะแนนเท่าเดิม (${stScoreB}) ⚪`;
      if (stDiff < 0) {
        stTrendClass = 'trend-better';
        stTrendText = `ลดลง ${Math.abs(stDiff)} คะแนน (ดีขึ้น 🟢)`;
      } else if (stDiff > 0) {
        stTrendClass = 'trend-worse';
        stTrendText = `เพิ่มขึ้น ${stDiff} คะแนน (เสี่ยงขึ้น 🔴)`;
      }
      rows.push({
        dimension: '2. ความเครียด (ST-20)',
        valA: rA.result?.stress ? `${stScoreA} / 60 คะแนน (${rA.result.stress.label || '-'})` : '-',
        valB: rB.result?.stress ? `${stScoreB} / 60 คะแนน (${rB.result.stress.label || '-'})` : '-',
        trendClass: stTrendClass,
        trendText: stTrendText
      });

      // 4. 9Q
      const qScoreA = rA.result?.q9?.totalScore ?? 0;
      const qScoreB = rB.result?.q9?.totalScore ?? 0;
      const qDiff = qScoreB - qScoreA;
      let qTrendClass = 'trend-same';
      let qTrendText = `คะแนนเท่าเดิม (${qScoreB}) ⚪`;
      if (qDiff < 0) {
        qTrendClass = 'trend-better';
        qTrendText = `ลดลง ${Math.abs(qDiff)} คะแนน (ดีขึ้น 🟢)`;
      } else if (qDiff > 0) {
        qTrendClass = 'trend-worse';
        qTrendText = `เพิ่มขึ้น ${qDiff} คะแนน (เสี่ยงขึ้น 🔴)`;
      }
      rows.push({
        dimension: '3. ภาวะเสี่ยงซึมเศร้า (9Q)',
        valA: rA.result?.q9 ? `${qScoreA} / 27 คะแนน (${rA.result.q9.label || '-'})` : '-',
        valB: rB.result?.q9 ? `${qScoreB} / 27 คะแนน (${rB.result.q9.label || '-'})` : '-',
        trendClass: qTrendClass,
        trendText: qTrendText
      });

      // 5. Context
      rows.push({
        dimension: 'วัน-เวลา & สถานะรอบ',
        valA: `${this.formatDateTime(rA.submittedAt || rA.createdAt)} (${rA.status === 'CANCELLED' ? 'รีเซ็ตแล้ว' : 'ส่งสำเร็จ'})`,
        valB: `${this.formatDateTime(rB.submittedAt || rB.createdAt)} (${rB.status === 'CANCELLED' ? 'รีเซ็ตแล้ว' : 'ส่งสำเร็จ'})`,
        trendClass: 'trend-same',
        trendText: '🔒 บันทึกประวัติถาวร'
      });

      return rows;
    },
    allRoundsMatrixRows() {
      if (!this.selectedItem || !this.selectedItem.attempts) return [];
      const attempts = this.selectedItem.attempts;
      const firstAtt = attempts[0];
      const lastAtt = attempts[attempts.length - 1];

      // Status row
      const statusCells = attempts.map((att) => att.result?.overall?.status === 'NEEDS_ADDITIONAL_CARE' ? '⚠️ ควรดูแลเพิ่ม' : (att.result ? '✅ ปกติ' : (att.status === 'CANCELLED' ? '🔄 รีเซ็ตแล้ว' : '-')));
      const sFirst = firstAtt.result?.overall?.status === 'NEEDS_ADDITIONAL_CARE' ? 2 : 1;
      const sLast = lastAtt.result?.overall?.status === 'NEEDS_ADDITIONAL_CARE' ? 2 : 1;
      const statusOverallTrendClass = sLast < sFirst ? 'trend-better' : (sLast === sFirst ? 'trend-same' : 'trend-worse');
      const statusOverallTrendText = sLast < sFirst ? 'พัฒนาการดีขึ้นมาก 🟢' : (sLast === sFirst ? 'คงที่ ⚪' : 'ต้องเฝ้าระวัง 🔴');

      // Burnout row
      const boCells = attempts.map((att) => att.result?.burnout ? this.formatLevelThai(att.result.burnout.level) : '-');
      const boOrder = { 'LOW': 1, 'MODERATE': 2, 'HIGH': 3 };
      const bFirst = boOrder[firstAtt.result?.burnout?.level] || 1;
      const bLast = boOrder[lastAtt.result?.burnout?.level] || 1;
      const boOverallTrendClass = bLast < bFirst ? 'trend-better' : (bLast === bFirst ? 'trend-same' : 'trend-worse');
      const boOverallTrendText = bLast < bFirst ? 'ความเสี่ยงลดลง 🟢' : (bLast === bFirst ? 'คงเดิม ⚪' : 'ความเสี่ยงเพิ่ม 🔴');

      // Stress row
      const stCells = attempts.map((att) => att.result?.stress ? `${att.result.stress.totalScore}/60` : '-');
      const stFirst = firstAtt.result?.stress?.totalScore ?? 0;
      const stLast = lastAtt.result?.stress?.totalScore ?? 0;
      const stDiff = stLast - stFirst;
      const stOverallTrendClass = stDiff < 0 ? 'trend-better' : (stDiff === 0 ? 'trend-same' : 'trend-worse');
      const stOverallTrendText = stDiff < 0 ? `ลดลง ${Math.abs(stDiff)} คะแนน 🟢` : (stDiff === 0 ? 'เท่าเดิม ⚪' : `เพิ่มขึ้น ${stDiff} คะแนน 🔴`);

      // 9Q row
      const qCells = attempts.map((att) => att.result?.q9 ? `${att.result.q9.totalScore}/27` : '-');
      const qFirst = firstAtt.result?.q9?.totalScore ?? 0;
      const qLast = lastAtt.result?.q9?.totalScore ?? 0;
      const qDiff = qLast - qFirst;
      const qOverallTrendClass = qDiff < 0 ? 'trend-better' : (qDiff === 0 ? 'trend-same' : 'trend-worse');
      const qOverallTrendText = qDiff < 0 ? `ลดลง ${Math.abs(qDiff)} คะแนน 🟢` : (qDiff === 0 ? 'เท่าเดิม ⚪' : `เพิ่มขึ้น ${qDiff} คะแนน 🔴`);

      return [
        { dimension: 'สถานะภาพรวม', cells: statusCells, summaryTrendClass: statusOverallTrendClass, summaryTrendText: statusOverallTrendText },
        { dimension: '1. ภาวะหมดไฟ (Burnout)', cells: boCells, summaryTrendClass: boOverallTrendClass, summaryTrendText: boOverallTrendText },
        { dimension: '2. ความเครียด (ST-20)', cells: stCells, summaryTrendClass: stOverallTrendClass, summaryTrendText: stOverallTrendText },
        { dimension: '3. ภาวะเสี่ยงซึมเศร้า (9Q)', cells: qCells, summaryTrendClass: qOverallTrendClass, summaryTrendText: qOverallTrendText }
      ];
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      showExportModal: false,
      exportFormat: 'excel',
      exportPassword: '',
      exportModalError: null,
      searchQuery: '',
      searchDebounceTimer: null,
      sortBy: 'submittedAt',
      sortOrder: 'desc',
      filters: {},
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalCount: 0,
        totalPages: 1
      },
      selectedItem: null,
      currentModalRound: null,
      isComparisonOpen: false,
      compareMode: 'two',
      compareRoundA: null,
      compareRoundB: null,
      exporting: false,
      showExportMenu: false,
      exportNotice: null,
      resetModalItem: null,
      resetReason: '',
      resetLoading: false,
      resetError: null,
      seedingMock: false,
      purposePromptItem: null,
      selectedPurpose: '🩺 ติดตามดูแลและให้คำปรึกษาพนักงาน (Employee Counseling & Support)',
      customPurpose: '',
      lastLoggedPurpose: null,
      fetchingDetail: false,
      isPIIRevealed: false,
      unmaskingLoading: false,
      purposeOptions: [
        {
          value: '🩺 ติดตามดูแลและให้คำปรึกษาพนักงาน (Employee Counseling & Support)',
          label: '🩺 ติดตามดูแลและให้คำปรึกษาพนักงาน',
          description: 'เข้าดูเพื่อวางแผนการช่วยเหลือ ให้คำปรึกษาเชิงจิตวิทยา หรือดูแลกลุ่มเฝ้าระวัง'
        },
        {
          value: '📋 การประเมินเพื่อส่งต่อแพทย์หรือผู้เชี่ยวชาญ (Medical Referral)',
          label: '📋 ส่งต่อแพทย์หรือผู้เชี่ยวชาญ',
          description: 'ประสานงานส่งต่อสถานพยาบาล นักจิตวิทยาคลินิก หรือแพทย์เฉพาะทาง'
        },
        {
          value: '🔍 การตรวจสอบความถูกต้องและกำกับดูแลข้อมูล (Data Verification / Audit)',
          label: '🔍 ตรวจสอบความถูกต้องและกำกับดูแลข้อมูล',
          description: 'ตรวจสอบความถูกต้องเพื่อการปฏิบัติตามมาตรฐาน PDPA หรือการตรวจสอบภายใน'
        },
        {
          value: 'CUSTOM',
          label: '📝 อื่น ๆ (ระบุวัตถุประสงค์เอง)',
          description: 'ระบุเหตุผลความจำเป็นในการเข้าถึงข้อมูลสุขภาพเพิ่มเติม'
        }
      ]
    };
  },
  async mounted() {
    await this.fetchData();
  },
  methods: {
    getAuthHeaders(extraHeaders = {}) {
      const token = localStorage.getItem('admin_token');
      return {
        ...extraHeaders,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
    },
    async triggerSeedMock() {
      this.seedingMock = true;
      this.exportNotice = null;
      try {
        const res = await fetch('/api/admin/assessments/seed-mock', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `ไม่สามารถสร้างข้อมูลจำลองได้ (HTTP ${res.status})`);
        }
        const data = await res.json();
        this.exportNotice = `⚡ สร้างข้อมูลจำลองพนักงานสำเร็จ ${data.count} รายการเรียบร้อยแล้ว`;
        this.pagination.page = 1;
        await this.fetchData();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.seedingMock = false;
      }
    },
    openResetModal(item) {
      this.resetModalItem = item;
      this.resetReason = '';
      this.resetError = null;
      this.closeDetail();
      this.$nextTick(() => {
        const el = document.getElementById('reset-reason');
        if (el) el.focus();
      });
    },
    closeResetModal() {
      this.resetModalItem = null;
      this.resetReason = '';
      this.resetError = null;
    },
    async submitReset() {
      if (!this.resetReason.trim() || !this.resetModalItem) return;
      this.resetLoading = true;
      this.resetError = null;

      try {
        const res = await fetch(`/api/admin/assessments/${this.resetModalItem.attemptId}/reset`, {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ reason: this.resetReason.trim() })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `ไม่สามารถรีเซ็ตได้ (HTTP ${res.status})`);
        }

        const employeeId = this.resetModalItem.employeeId;
        this.closeResetModal();
        this.closeDetail();
        this.exportNotice = `รีเซ็ตผลการประเมินของพนักงาน ${employeeId} สำเร็จ — ปลดล็อกสิทธิ์ให้ทำแบบประเมินใหม่ได้เรียบร้อยแล้ว`;
        await this.fetchData();
      } catch (err) {
        this.resetError = err.message;
      } finally {
        this.resetLoading = false;
      }
    },
    openExportModal() {
      this.showExportModal = true;
      this.exportFormat = 'excel';
      this.exportPassword = '';
      this.exportModalError = null;
    },
    closeExportModal() {
      this.showExportModal = false;
      this.exportPassword = '';
      this.exportModalError = null;
    },
    async confirmExport() {
      if (!this.exportPassword) {
        this.exportModalError = 'กรุณากรอกรหัสผ่าน ONE ID เพื่อยืนยันสิทธิ์ในการส่งออกข้อมูล';
        return;
      }
      this.exporting = true;
      this.exportModalError = null;
      try {
        const res = await fetch('/api/admin/export', {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            format: this.exportFormat,
            password: this.exportPassword,
            filters: this.filters
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 401 || errData.code === 'INVALID_PASSWORD') {
            throw new Error('รหัสผ่านไม่ถูกต้อง ไม่สามารถดาวน์โหลดเอกสารได้');
          }
          if (res.status === 403 || errData.code === 'EXPORT_PERMISSION_DENIED') {
            throw new Error('ท่านไม่มีสิทธิการเข้าถึงฟังก์ชันส่งออกเอกสาร');
          }
          throw new Error(errData.message || `ส่งออกไม่สำเร็จ (HTTP ${res.status})`);
        }

        const data = await res.json();
        this.closeExportModal();
        const formatLabel = this.exportFormat === 'csv' ? 'CSV' : 'Excel';
        this.exportNotice = `ส่งออกรายงาน ${formatLabel} สำเร็จ (${data.recordCount} รายการ) กำลังเริ่มดาวน์โหลด...`;

        // Trigger file download
        const a = document.createElement('a');
        a.href = data.downloadUrl;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        this.exportModalError = err.message;
      } finally {
        this.exporting = false;
      }
    },

    onFiltersChanged(newFilters) {
      this.filters = { ...newFilters };
      this.pagination.page = 1;
      this.fetchData();
    },
    async fetchData() {
      this.loading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.limit,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
          search: this.searchQuery.trim()
        });

        // Append multidimensional filters
        Object.entries(this.filters).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
              if (val.length > 0) queryParams.set(key, val.join(','));
            } else {
              queryParams.set(key, String(val));
            }
          }
        });

        const res = await fetch(`/api/admin/assessments?${queryParams.toString()}`, {
          headers: this.getAuthHeaders()
        });
        if (!res.ok) {
          throw new Error(`ไม่สามารถโหลดข้อมูลได้ (HTTP ${res.status})`);
        }

        const data = await res.json();
        this.items = data.items || [];
        this.pagination = data.pagination || this.pagination;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    onSearchInput() {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.pagination.page = 1;
        this.fetchData();
      }, 350);
    },
    clearSearch() {
      this.searchQuery = '';
      this.pagination.page = 1;
      this.fetchData();
    },
    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortOrder = 'asc';
      }
      this.fetchData();
    },
    getSortIcon(field) {
      if (this.sortBy !== field) return '↕';
      return this.sortOrder === 'asc' ? '▲' : '▼';
    },
    changePage(newPage) {
      if (newPage < 1 || newPage > this.pagination.totalPages) return;
      this.pagination.page = newPage;
      this.fetchData();
    },
    onLimitChange() {
      this.pagination.page = 1;
      this.fetchData();
    },
    openPurposePrompt(item) {
      this.purposePromptItem = item;
      this.selectedPurpose = '🩺 ติดตามดูแลและให้คำปรึกษาพนักงาน (Employee Counseling & Support)';
      this.customPurpose = '';
    },
    closePurposePrompt() {
      this.purposePromptItem = null;
      this.customPurpose = '';
      this.fetchingDetail = false;
    },
    async confirmViewDetail() {
      if (!this.purposePromptItem) return;
      const item = this.purposePromptItem;
      let finalPurpose = this.selectedPurpose;
      if (finalPurpose === 'CUSTOM') {
        finalPurpose = this.customPurpose.trim() || 'อื่น ๆ ตามที่ผู้ดูแลระบุ';
      }

      this.fetchingDetail = true;
      this.lastLoggedPurpose = finalPurpose;
      try {
        const res = await fetch(`/api/admin/assessments/${item.attemptId}`, {
          headers: this.getAuthHeaders({
            'x-access-purpose': encodeURIComponent(finalPurpose)
          })
        });
        if (res.ok) {
          const freshData = await res.json();
          this.selectedItem = freshData;
        } else {
          this.selectedItem = item;
        }
        this.currentModalRound = this.selectedItem.round || (this.selectedItem.attempts && this.selectedItem.attempts.length) || 1;
        this.isComparisonOpen = false;
        this.compareMode = 'two';
        if (this.selectedItem.attempts && this.selectedItem.attempts.length >= 2) {
          this.compareRoundA = this.selectedItem.attempts[0].round;
          this.compareRoundB = this.selectedItem.attempts[this.selectedItem.attempts.length - 1].round;
        }
        this.closePurposePrompt();
      } catch (err) {
        console.warn('Could not fetch detail with purpose', err);
        this.selectedItem = item;
        this.currentModalRound = this.selectedItem.round || 1;
        this.closePurposePrompt();
      } finally {
        this.fetchingDetail = false;
      }
    },
    viewDetail(item) {
      this.openPurposePrompt(item);
    },
    closeDetail() {
      this.selectedItem = null;
      this.lastLoggedPurpose = null;
      this.isPIIRevealed = false;
      this.unmaskingLoading = false;
      this.currentModalRound = null;
      this.isComparisonOpen = false;
      this.compareMode = 'two';
      this.compareRoundA = null;
      this.compareRoundB = null;
    },
    selectRound(round) {
      this.currentModalRound = round;
    },
    onRoundSelectChange() {
      // Bound to currentModalRound
    },
    isLatestRound(att) {
      if (!att) return false;
      return att.round === this.latestRoundNumber;
    },
    formatShortDate(isoString) {
      if (!isoString) return '-';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return String(isoString);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    },
    getRoundStatusText(att) {
      if (att.status === 'CANCELLED') return '🔄 รีเซ็ตแล้ว';
      if (att.result && att.result.overall && att.result.overall.status === 'NEEDS_ADDITIONAL_CARE') return '⚠️ ควรดูแลเพิ่ม';
      return '✅ ปกติ';
    },
    getBannerClass(att) {
      if (!att) return '';
      if (att.status === 'CANCELLED') return 'is-cancelled';
      if (att.round === 1 && this.selectedItem?.attempts?.length > 1) return 'is-round1';
      return 'is-round2';
    },
    getBannerIcon(att) {
      if (!att) return '📌';
      if (att.status === 'CANCELLED') return '⚠️';
      if (att.round === 1 && this.selectedItem?.attempts?.length > 1) return '📜';
      return '📌';
    },
    setPresetPrevLatest() {
      if (!this.selectedItem?.attempts || this.selectedItem.attempts.length < 2) return;
      const atts = this.selectedItem.attempts;
      this.compareRoundB = atts[atts.length - 1].round;
      this.compareRoundA = atts[atts.length - 2].round;
    },
    setPresetBaseLatest() {
      if (!this.selectedItem?.attempts || this.selectedItem.attempts.length < 2) return;
      const atts = this.selectedItem.attempts;
      this.compareRoundA = atts[0].round;
      this.compareRoundB = atts[atts.length - 1].round;
    },
    async toggleUnmaskPII() {
      if (this.isPIIRevealed) {
        this.isPIIRevealed = false;
        return;
      }

      if (!this.selectedItem) return;
      this.unmaskingLoading = true;
      try {
        const res = await fetch(`/api/admin/assessments/${this.selectedItem.attemptId}/unmask-pii`, {
          method: 'POST',
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            purpose: this.lastLoggedPurpose || 'เปิดเผยข้อมูลระบุตัวตนฉบับเต็มเพื่อติดตามดูแลและช่วยเหลือพนักงาน'
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `ไม่สามารถปลดล็อกข้อมูลได้ (HTTP ${res.status})`);
        }
        this.isPIIRevealed = true;
      } catch (err) {
        alert(`เกิดข้อผิดพลาดในการปลดล็อกข้อมูลระบุตัวตน: ${err.message}`);
      } finally {
        this.unmaskingLoading = false;
      }
    },
    maskEmployeeId(id) {
      if (!id) return '-';
      const str = String(id).trim();
      if (str.length <= 6) return str;
      const prefix = str.slice(0, 6);
      const suffix = str.slice(-2);
      const maskedCount = Math.max(4, str.length - 8);
      return `${prefix}${'X'.repeat(maskedCount)}${suffix}`;
    },
    maskFullName(name) {
      if (!name || name === '-') return '-';
      return name.split(/\s+/).map((part, idx) => {
        const keepLen = idx === 0 ? 5 : 2;
        return (part.length > keepLen ? part.slice(0, keepLen) : part) + 'XXXX';
      }).join(' ');
    },
    getRawFullName(snapshot) {
      if (!snapshot) return '-';
      return `${snapshot.firstName || ''} ${snapshot.lastName || ''}`.trim() || '-';
    },
    getEmployeeFullName(snapshot) {
      return this.getRawFullName(snapshot);
    },

    formatDateTime(isoString) {
      if (!isoString) return '-';
      return new Date(isoString).toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    formatLevelThai(level) {
      switch (level) {
        case 'LOW': return 'ต่ำ';
        case 'MODERATE': return 'ปานกลาง';
        case 'HIGH': return 'สูง';
        default: return level || '-';
      }
    },
    getLevelClass(level) {
      if (level === 'HIGH') return 'level-high';
      if (level === 'MODERATE') return 'level-mod';
      return 'level-low';
    },
    getStressClass(level) {
      if (level === 'SEVERE' || level === 'MODERATE') return 'level-high';
      if (level === 'MILD') return 'level-mod';
      return 'level-low';
    },
    get9QClass(level) {
      if (level === 'SEVERE' || level === 'MODERATE') return 'level-high';
      if (level === 'MILD') return 'level-mod';
      return 'level-low';
    }
  }
};
</script>

<style scoped>
.results-table-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  width: 360px;
  gap: 0.5rem;
}

.search-icon {
  font-size: 0.9rem;
  color: #94a3b8;
}

.search-input {
  border: none;
  outline: none;
  font-size: 0.9rem;
  width: 100%;
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.export-container {
  position: relative;
}

.btn-export {
  padding: 0.45rem 0.9rem;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-export:hover:not(:disabled) {
  background: #0369a1;
}

.btn-export:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 50;
  min-width: 220px;
  overflow: hidden;
}

.export-menu-item {
  padding: 0.65rem 1rem;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
  cursor: pointer;
  color: #334155;
  transition: background 0.15s ease;
}

.export-menu-item:last-child {
  border-bottom: none;
}

.export-menu-item:hover {
  background: #f8fafc;
  color: #0284c7;
}

.export-notice-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 6px;
  color: #166534;
  font-size: 0.9rem;
}

.btn-close-notice {
  background: none;
  border: none;
  cursor: pointer;
  color: #166534;
  font-weight: bold;
}

.total-badge {
  font-size: 0.85rem;
  color: #64748b;
}

.btn-refresh {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
}

.btn-seed-mock {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-seed-mock:hover:not(:disabled) {
  background: #dcfce7;
  border-color: #4ade80;
  color: #14532d;
}

.btn-seed-mock:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-seed-mock-empty {
  margin-top: 0.85rem;
  background: #0284c7;
  border: none;
  color: #ffffff;
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
  display: inline-block;
}

.btn-seed-mock-empty:hover:not(:disabled) {
  background: #0369a1;
}

.btn-seed-mock-empty:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-wrapper {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.data-table th {
  background: #f8fafc;
  color: #475569;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.sort-icon {
  display: inline-block;
  font-size: 0.75rem;
  margin-left: 0.25rem;
  color: #94a3b8;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.data-row:hover {
  background-color: #f8fafc;
}

.cell-date {
  white-space: nowrap;
  font-size: 0.8rem;
  color: #64748b;
}

.cell-empid code {
  background: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #0f172a;
  font-size: 0.8rem;
}

.badge-status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-care {
  background: #fef3c7;
  color: #92400e;
}

.status-normal {
  background: #d1fae5;
  color: #065f46;
}

.badge-level {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.level-low {
  background: #f1f5f9;
  color: #334155;
}

.level-mod {
  background: #fef3c7;
  color: #92400e;
}

.level-high {
  background: #fee2e2;
  color: #991b1b;
}

.badge-q2plus-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.badge-sub-pill {
  font-size: 0.7rem;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  white-space: nowrap;
}

.pill-ok {
  background: #f1f5f9;
  color: #475569;
}

.pill-danger {
  background: #fee2e2;
  color: #991b1b;
}

.pill-alert-red {
  background: #ef4444;
  color: white;
  font-weight: bold;
}

.btn-detail {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0284c7;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn-detail:hover {
  background: #e0f2fe;
}

.loading-cell, .empty-cell {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.empty-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.page-size-selector {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-size-selector select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-page {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.85rem;
  color: #475569;
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-dialog {
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #0f172a;
}

.btn-close-modal {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #0f172a;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
}

.grid-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.grid-item .label {
  color: #64748b;
  font-size: 0.75rem;
}

.result-breakdown-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.breakdown-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
}

.breakdown-card ul {
  margin: 0.4rem 0 0 0;
  padding-left: 1.25rem;
}

.breakdown-card p {
  margin: 0.25rem 0 0 0;
}

.text-danger {
  color: #dc2626;
}

.pdpa-callout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  border-left: 4px solid #64748b;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #334155;
}

.pdpa-callout p {
  margin: 0;
}

.feedback-quote-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-left: 4px solid #0284c7;
  border-radius: 8px;
  padding: 0.85rem 1.15rem;
}

.feedback-quote-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.feedback-quote-text {
  margin: 0;
  font-size: 0.88rem;
  color: #0369a1;
  font-style: italic;
  line-height: 1.5;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  text-align: right;
}

.btn-modal-close {
  padding: 0.5rem 1.25rem;
  background: #e2e8f0;
  color: #334155;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.btn-reset-attempt {
  padding: 0.5rem 1.25rem;
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #f87171;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.75rem;
  transition: all 0.15s ease;
}

.btn-reset-attempt:hover {
  background: #fecaca;
  color: #991b1b;
}

.modal-reset-backdrop {
  z-index: 2000;
}

.modal-sm {
  max-width: 480px;
}

.modal-header-danger {
  border-bottom: 2px solid #ef4444;
}

.modal-header-danger h3 {
  color: #b91c1c;
  font-size: 1.1rem;
}

.reset-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.85rem;
  color: #1e293b;
}

.reset-reason-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.85rem;
  resize: vertical;
  box-sizing: border-box;
}

.reset-reason-textarea:focus {
  outline: none;
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.reset-error-msg {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #b91c1c;
  font-size: 0.85rem;
}

.btn-cancel {
  padding: 0.5rem 1.25rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #475569;
  cursor: pointer;
  margin-right: 0.75rem;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-confirm-danger {
  padding: 0.5rem 1.25rem;
  background: #dc2626;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-confirm-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* PDPA Purpose Prompt Modal Styles */
.purpose-dialog {
  max-width: 620px;
  width: 90%;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
}

.header-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.pdpa-badge {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #0369a1;
  background: #e0f2fe;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  display: inline-block;
  align-self: flex-start;
  letter-spacing: 0.03em;
}

.pdpa-notice-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
}

.pdpa-notice-icon {
  font-size: 1.4rem;
  line-height: 1;
}

.pdpa-notice-content strong {
  color: #166534;
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.25rem;
}

.pdpa-notice-content p {
  margin: 0;
  color: #15803d;
  font-size: 0.82rem;
  line-height: 1.4;
}

.purpose-selection-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.purpose-form-label {
  font-size: 0.9rem;
  color: #1e293b;
}

.purpose-radio-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.purpose-radio-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.15s ease-in-out;
}

.purpose-radio-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.purpose-radio-item.active {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #2563eb;
}

.purpose-radio-item input[type="radio"] {
  margin-top: 0.2rem;
  accent-color: #2563eb;
  cursor: pointer;
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.radio-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}

.radio-desc {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.35;
}

.custom-purpose-box {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.custom-purpose-box label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.custom-purpose-input {
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #94a3b8;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}

.custom-purpose-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.btn-confirm-purpose {
  padding: 0.55rem 1.35rem;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-confirm-purpose:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-confirm-purpose:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pdpa-audit-badge-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: #1e40af;
  margin-bottom: 1rem;
}

.modal-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.modal-header-title-wrap h3 {
  margin: 0;
}

.badge-unmask-indicator {
  display: inline-flex;
  align-items: center;
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #bbf7d0;
}

.badge-mask-indicator {
  display: inline-flex;
  align-items: center;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
}

.snapshot-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
}

.snapshot-header-bar h4 {
  margin: 0;
}

.btn-unmask-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  border: 1.5px solid #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-unmask-toggle:hover:not(:disabled) {
  background: #dbeafe;
}

.btn-unmask-toggle.is-revealed {
  border-color: #d97706;
  background: #fffbeb;
  color: #b45309;
}

.btn-unmask-toggle.is-revealed:hover:not(:disabled) {
  background: #fef3c7;
}

.btn-unmask-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pii-revealed-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: #166534;
  margin-bottom: 0.75rem;
}

.text-unmasked {
  color: #0f172a;
  font-weight: 700;
  background: #ecfdf5;
  padding: 1px 4px;
  border-radius: 4px;
}

.code-unmasked {
  color: #0f172a;
  font-weight: 700;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

/* ==========================================================================
   Multi-Round History, Stepper, & Comparison Table (Prototype Parity)
   ========================================================================== */

.cell-round {
  white-space: nowrap;
}

.round-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 9999px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
}

.round-badge-multi {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.history-pill {
  display: inline-block;
  margin-left: 0.35rem;
  padding: 0.15rem 0.45rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #b45309;
  cursor: pointer;
  transition: all 0.15s ease;
}

.history-pill:hover {
  background: #fde68a;
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

.status-cancelled {
  background: #f1f5f9 !important;
  color: #64748b !important;
  border: 1px solid #cbd5e1 !important;
}

.journey-timeline-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.85rem;
}

.journey-timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.journey-timeline-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.journey-timeline-sub {
  font-size: 0.74rem;
  color: #64748b;
}

.journey-timeline-steps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 6px;
}

.journey-step-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.journey-step-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.45rem 0.75rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  min-width: 95px;
  transition: all 0.15s ease;
  text-align: center;
  flex-shrink: 0;
}

.journey-step-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.journey-step-btn.is-active {
  background: #eff6ff;
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
}

.journey-step-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
}

.journey-step-date {
  font-size: 0.7rem;
  color: #64748b;
  white-space: nowrap;
}

.journey-step-badge {
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 9999px;
  font-weight: 600;
  margin-top: 2px;
  white-space: nowrap;
}

.badge-cancelled {
  background: #f1f5f9;
  color: #64748b;
}

.badge-danger {
  background: #fef3c7;
  color: #b45309;
}

.badge-normal {
  background: #dcfce7;
  color: #15803d;
}

.journey-step-connector {
  color: #94a3b8;
  font-size: 0.85rem;
  user-select: none;
  flex-shrink: 0;
}

.attempt-tabs-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.attempt-tabs-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}

.attempt-tab-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.round-quick-select {
  font-size: 0.82rem;
  padding: 0.35rem 0.6rem;
  font-weight: 600;
  min-width: 170px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #1e293b;
}

.attempt-tab-group {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.attempt-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.attempt-tab-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.attempt-tab-btn.is-active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
}

.btn-compare-rounds {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: #fdf4ff;
  border: 1px solid #f0abfc;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #a21caf;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.btn-compare-rounds:hover {
  background: #fae8ff;
  color: #86198f;
}

.btn-compare-rounds.is-active {
  background: #a21caf;
  color: #ffffff;
  border-color: #a21caf;
}

.round-history-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.round-history-banner.is-round1 {
  background: #fefce8;
  border: 1px solid #fef08a;
  color: #854d0e;
}

.round-history-banner.is-round2 {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.round-history-banner.is-cancelled {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.banner-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.banner-text {
  line-height: 1.4;
}

.archived-pill {
  margin-left: 8px;
  font-weight: 600;
  background: rgba(30, 58, 138, 0.08);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
}

.cancelled-round-notice {
  display: flex;
  gap: 0.75rem;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
}

.cancelled-notice-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.cancelled-notice-content strong {
  color: #9f1239;
  font-size: 0.88rem;
}

.cancelled-notice-content p {
  margin: 0.35rem 0 0.5rem 0;
  font-size: 0.82rem;
  color: #881337;
}

.cancelled-data-archived {
  font-size: 0.74rem;
  color: #64748b;
  display: block;
}

.badge-reset-done {
  padding: 0.45rem 0.9rem;
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.compare-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.compare-mode-tab-group {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.5rem;
}

.compare-mode-tab-btn {
  padding: 0.35rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.compare-mode-tab-btn:hover {
  background: #f1f5f9;
}

.compare-mode-tab-btn.is-active {
  background: #701a75;
  color: #ffffff;
  border-color: #701a75;
}

.compare-filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  background: #fdf4ff;
  border: 1px solid #f0abfc;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}

.compare-selectors {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #701a75;
}

.compare-select {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #f0abfc;
  border-radius: 4px;
  background: white;
}

.vs-text {
  font-weight: 700;
  color: #86198f;
}

.compare-presets {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.compare-preset-btn {
  padding: 0.25rem 0.55rem;
  background: #ffffff;
  border: 1px solid #e879f9;
  border-radius: 4px;
  font-size: 0.74rem;
  font-weight: 600;
  color: #86198f;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.compare-preset-btn:hover {
  background: #fae8ff;
}

.compare-table-wrapper {
  overflow-x: auto;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.compare-table th {
  background: #f8fafc;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  color: #334155;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}

.compare-table td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.all-rounds-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.all-rounds-matrix-table th {
  background: #f8fafc;
  padding: 0.55rem 0.75rem;
  font-weight: 700;
  color: #334155;
  border: 1px solid #e2e8f0;
  text-align: center;
  white-space: nowrap;
}

.all-rounds-matrix-table th:first-child {
  text-align: left;
  min-width: 140px;
}

.all-rounds-matrix-table td {
  padding: 0.55rem 0.75rem;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  text-align: center;
}

.all-rounds-matrix-table td:first-child {
  text-align: left;
  font-weight: 600;
}

.matrix-latest-col {
  background: #eff6ff !important;
}

.matrix-th-date {
  font-size: 0.7rem;
  font-weight: normal;
  color: #64748b;
}

.matrix-th-summary {
  background: #f0fdf4 !important;
  color: #166534 !important;
}

.matrix-hint {
  margin-bottom: 0.5rem;
  font-size: 0.78rem;
  color: #64748b;
}

.trend-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;
}

.trend-tag.trend-better {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.trend-tag.trend-worse {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.trend-tag.trend-same {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* ==========================================================================
   Responsive Multi-Device Layout (PC, iPad/Tablet, Mobile Phone)
   ========================================================================== */

/* --- iPad / Tablet (<= 1024px) --- */
@media (max-width: 1024px) {
  .search-box {
    width: 260px;
  }
}

/* --- Mobile Phones & Small Tablets (<= 768px) --- */
@media (max-width: 768px) {
  .table-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .search-box {
    width: 100%;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .btn-table-refresh,
  .btn-export {
    padding: 0.45rem 0.75rem;
    font-size: 0.82rem;
  }

  .modal-dialog {
    width: 95% !important;
    max-width: 95% !important;
    margin: 1rem auto;
  }

  .table-wrapper {
    -webkit-overflow-scrolling: touch;
  }
}

/* --- Small Mobile Phones (<= 480px) --- */
@media (max-width: 480px) {
  .toolbar-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .export-container,
  .btn-export,
  .btn-table-refresh {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .export-dropdown-menu {
    right: auto;
    left: 0;
    width: 100%;
  }

  .table-pagination {
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
  }
}
</style>
