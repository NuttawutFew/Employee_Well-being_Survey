<template>
  <div class="filter-panel-card">
    <!-- Collapsible Header -->
    <div class="filter-header" @click="isOpen = !isOpen">
      <div class="header-left">
        <span class="filter-icon">⚙️</span>
        <div class="header-title-group">
          <strong>ตัวกรองข้อมูลหลากมิติ (Multidimensional Filters)</strong>
          <span class="header-subtitle">คัดกรองข้อมูลประชากร องค์กร และผลการประเมินสุขภาพใจครบทุกชุด</span>
        </div>
        <span v-if="activeFilterCount > 0" class="active-count-badge">
          ใช้งานอยู่ {{ activeFilterCount }} เงื่อนไข
        </span>
      </div>
      <div class="header-right">
        <button v-if="activeFilterCount > 0" class="btn-quick-reset" @click.stop="resetFilters">
          ✕ ล้างทั้งหมด
        </button>
        <button class="btn-toggle-panel" type="button">
          {{ isOpen ? '▲ ย่อแถบตัวกรอง' : '▼ ขยายแถบตัวกรอง' }}
        </button>
      </div>
    </div>

    <!-- Active Filter Summary Chips (Always visible when filters are active) -->
    <div v-if="activeFilterCount > 0" class="active-chips-bar">
      <span class="chips-label">เงื่อนไขที่เลือก:</span>
      <div class="chips-list">
        <!-- Date range chip -->
        <span v-if="filters.dateFrom || filters.dateTo" class="filter-chip chip-date">
          📅 {{ formatDateRangeLabel() }}
          <button class="chip-remove" @click="clearDateFilter">✕</button>
        </span>

        <!-- Company chips -->
        <span
          v-for="comp in filters.companies"
          :key="'chip-comp-' + comp"
          class="filter-chip chip-comp"
        >
          🏬 บริษัท: {{ comp }}
          <button class="chip-remove" @click="removeCompany(comp)">✕</button>
        </span>

        <!-- Department chips -->
        <span
          v-for="dept in filters.departments"
          :key="'chip-dept-' + dept"
          class="filter-chip chip-dept"
        >
          🏢 แผนก: {{ dept }}
          <button class="chip-remove" @click="removeDepartment(dept)">✕</button>
        </span>

        <!-- Position chips -->
        <span
          v-for="pos in filters.positions"
          :key="'chip-pos-' + pos"
          class="filter-chip chip-pos"
        >
          💼 ตำแหน่ง: {{ pos }}
          <button class="chip-remove" @click="removePosition(pos)">✕</button>
        </span>

        <!-- Gender chips -->
        <span
          v-for="g in filters.genders"
          :key="'chip-gender-' + g"
          class="filter-chip chip-gender"
        >
          👤 เพศ: {{ g }}
          <button class="chip-remove" @click="togglePill(filters.genders, g)">✕</button>
        </span>

        <!-- Age chips -->
        <span
          v-for="age in filters.ageBrackets"
          :key="'chip-age-' + age"
          class="filter-chip chip-age"
        >
          🎂 อายุ: {{ age }}
          <button class="chip-remove" @click="togglePill(filters.ageBrackets, age)">✕</button>
        </span>

        <!-- Tenure chips -->
        <span
          v-for="t in filters.tenureBrackets"
          :key="'chip-tenure-' + t"
          class="filter-chip chip-tenure"
        >
          ⏳ อายุงาน: {{ formatTenureLabel(t) }}
          <button class="chip-remove" @click="togglePill(filters.tenureBrackets, t)">✕</button>
        </span>

        <!-- Overall Status chips -->
        <span
          v-for="s in filters.overallStatuses"
          :key="'chip-status-' + s"
          class="filter-chip"
          :class="s === 'NEEDS_ADDITIONAL_CARE' ? 'chip-danger' : 'chip-success'"
        >
          {{ s === 'NEEDS_ADDITIONAL_CARE' ? '⚠️ ควรดูแลเพิ่ม' : '✅ สุขภาพใจปกติ' }}
          <button class="chip-remove" @click="togglePill(filters.overallStatuses, s)">✕</button>
        </span>

        <!-- Burnout chips -->
        <span
          v-for="b in filters.burnoutLevels"
          :key="'chip-bo-' + b"
          class="filter-chip"
          :class="b === 'HIGH' ? 'chip-danger' : (b === 'MODERATE' ? 'chip-warning' : 'chip-neutral')"
        >
          🔥 หมดไฟ: {{ formatBurnoutLabel(b) }}
          <button class="chip-remove" @click="togglePill(filters.burnoutLevels, b)">✕</button>
        </span>

        <!-- Stress chips -->
        <span
          v-for="st in filters.stressLevels"
          :key="'chip-stress-' + st"
          class="filter-chip chip-warning"
        >
          ⚡ เครียด: {{ formatStressLabel(st) }}
          <button class="chip-remove" @click="togglePill(filters.stressLevels, st)">✕</button>
        </span>

        <!-- 9Q chips -->
        <span
          v-for="q in filters.q9Levels"
          :key="'chip-q9-' + q"
          class="filter-chip chip-danger"
        >
          🌧️ 9Q ซึมเศร้า: {{ formatQ9Label(q) }}
          <button class="chip-remove" @click="togglePill(filters.q9Levels, q)">✕</button>
        </span>
      </div>
    </div>

    <!-- Filter Form Body (Collapsible) -->
    <div v-show="isOpen" class="filter-body">
      <div class="filter-sections-container">
        
        <!-- SECTION 1: มิติองค์กรและบุคลากร -->
        <div class="category-card">
          <div class="category-header">
            <span class="cat-icon">🏢</span>
            <div class="cat-title-wrap">
              <h3 class="category-title">มิติองค์กรและข้อมูลบุคลากร</h3>
              <span class="category-desc">เลือกผ่าน Drop Down List สำหรับบริษัท แผนก ตำแหน่ง และเลือกข้อมูลประชากร</span>
            </div>
          </div>

          <div class="category-content">
            <!-- 1.1 Dropdown Grid (บริษัท / แผนก / ตำแหน่ง) -->
            <div class="dropdowns-row-3">
              
              <!-- DROPDOWN 1: บริษัท (Company - OR) -->
              <div class="dropdown-filter-block" :class="{ 'dropdown-open': openDropdown === 'company' }">
                <label class="block-title">
                  <span>🏬 บริษัท (Company - OR)</span>
                  <span v-if="filters.companies.length > 0" class="badge-selection">
                    {{ filters.companies.length }}
                  </span>
                </label>
                
                <button
                  type="button"
                  class="dropdown-trigger-btn"
                  :class="{ 'btn-has-value': filters.companies.length > 0 }"
                  @click.stop="toggleDropdown('company')"
                >
                  <span class="trigger-label">
                    {{ filters.companies.length === 0 ? 'เลือกบริษัท...' : `เลือกแล้ว ${filters.companies.length} บริษัท` }}
                  </span>
                  <span class="arrow-ico">{{ openDropdown === 'company' ? '▲' : '▼' }}</span>
                </button>

                <!-- Popover Menu -->
                <div v-if="openDropdown === 'company'" class="dropdown-popover" @click.stop>
                  <div class="popover-search-row">
                    <input
                      v-model="companySearch"
                      type="text"
                      placeholder="🔍 ค้นหาบริษัท..."
                      class="popover-search-input"
                    />
                    <button v-if="companySearch" class="btn-clear-search-mini" @click="companySearch = ''">✕</button>
                  </div>

                  <div class="popover-actions">
                    <button type="button" class="btn-link" @click="selectAllVisibleCompanies">✓ เลือกทั้งหมด</button>
                    <span class="divider">|</span>
                    <button type="button" class="btn-link" @click="clearCompanies" :disabled="filters.companies.length === 0">✕ ล้าง</button>
                  </div>

                  <!-- Custom Company Input -->
                  <div class="popover-add-row">
                    <input
                      v-model="customCompanyInput"
                      type="text"
                      placeholder="+ พิมพ์ชื่อบริษัทใหม่..."
                      class="popover-custom-input"
                      @keyup.enter="addCustomCompany"
                    />
                    <button type="button" class="btn-add-mini" :disabled="!customCompanyInput.trim()" @click="addCustomCompany">+ เพิ่ม</button>
                  </div>

                  <!-- Loading / Empty State -->
                  <div v-if="loadingCompanies" class="popover-status-msg">
                    <span>กำลังโหลดข้อมูลบริษัทจาก API...</span>
                  </div>
                  <div v-else-if="companiesList.length === 0" class="popover-empty-alert">
                    <span>ℹ️ ยังไม่มีข้อมูลบริษัทจาก API ในขณะนี้ (สามารถพิมพ์ระบุเองได้ด้านบน)</span>
                  </div>

                  <!-- Scrollable Items List -->
                  <div v-else class="popover-list-items">
                    <label
                      v-for="comp in filteredCompaniesList"
                      :key="comp"
                      class="popover-item-label"
                      :class="{ selected: filters.companies.includes(comp) }"
                    >
                      <input
                        type="checkbox"
                        :value="comp"
                        :checked="filters.companies.includes(comp)"
                        @change="toggleCompany(comp)"
                      />
                      <span class="item-name">{{ comp }}</span>
                    </label>
                    <div v-if="filteredCompaniesList.length === 0 && companySearch" class="popover-no-match">
                      <span>ไม่พบบริษัท "{{ companySearch }}"</span>
                      <button type="button" class="btn-link-add" @click="addCompanyFromSearch">+ เพิ่มชื่อนี้</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- DROPDOWN 2: แผนก / ฝ่าย (Department - OR) -->
              <div class="dropdown-filter-block" :class="{ 'dropdown-open': openDropdown === 'department' }">
                <label class="block-title">
                  <span>🏢 แผนก / ฝ่าย (Department - OR)</span>
                  <span v-if="filters.departments.length > 0" class="badge-selection">
                    {{ filters.departments.length }}
                  </span>
                </label>

                <button
                  type="button"
                  class="dropdown-trigger-btn"
                  :class="{ 'btn-has-value': filters.departments.length > 0 }"
                  @click.stop="toggleDropdown('department')"
                >
                  <span class="trigger-label">
                    {{ filters.departments.length === 0 ? 'เลือกแผนก / ฝ่าย...' : `เลือกแล้ว ${filters.departments.length} แผนก` }}
                  </span>
                  <span class="arrow-ico">{{ openDropdown === 'department' ? '▲' : '▼' }}</span>
                </button>

                <!-- Popover Menu -->
                <div v-if="openDropdown === 'department'" class="dropdown-popover" @click.stop>
                  <div class="popover-search-row">
                    <input
                      v-model="departmentSearch"
                      type="text"
                      placeholder="🔍 ค้นหาแผนก..."
                      class="popover-search-input"
                    />
                    <button v-if="departmentSearch" class="btn-clear-search-mini" @click="departmentSearch = ''">✕</button>
                  </div>

                  <div class="popover-actions">
                    <button type="button" class="btn-link" @click="selectAllVisibleDepartments">✓ เลือกทั้งหมด</button>
                    <span class="divider">|</span>
                    <button type="button" class="btn-link" @click="clearDepartments" :disabled="filters.departments.length === 0">✕ ล้าง</button>
                  </div>

                  <!-- Custom Department Input -->
                  <div class="popover-add-row">
                    <input
                      v-model="customDepartmentInput"
                      type="text"
                      placeholder="+ พิมพ์ชื่อแผนกใหม่..."
                      class="popover-custom-input"
                      @keyup.enter="addCustomDepartment"
                    />
                    <button type="button" class="btn-add-mini" :disabled="!customDepartmentInput.trim()" @click="addCustomDepartment">+ เพิ่ม</button>
                  </div>

                  <div v-if="loadingDepartments" class="popover-status-msg">
                    <span>กำลังโหลดรายชื่อแผนกจาก API...</span>
                  </div>

                  <!-- Scrollable Items List -->
                  <div class="popover-list-items">
                    <label
                      v-for="dept in filteredDepartmentsList"
                      :key="dept"
                      class="popover-item-label"
                      :class="{ selected: filters.departments.includes(dept) }"
                    >
                      <input
                        type="checkbox"
                        :value="dept"
                        :checked="filters.departments.includes(dept)"
                        @change="toggleDepartment(dept)"
                      />
                      <span class="item-name">{{ dept }}</span>
                    </label>
                    <div v-if="filteredDepartmentsList.length === 0 && departmentSearch" class="popover-no-match">
                      <span>ไม่พบแผนก "{{ departmentSearch }}"</span>
                      <button type="button" class="btn-link-add" @click="addDepartmentFromSearch">+ เพิ่มชื่อนี้</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- DROPDOWN 3: ตำแหน่ง (Position - OR) -->
              <div class="dropdown-filter-block" :class="{ 'dropdown-open': openDropdown === 'position' }">
                <label class="block-title">
                  <span>💼 ตำแหน่ง (Position - OR)</span>
                  <span v-if="filters.positions.length > 0" class="badge-selection">
                    {{ filters.positions.length }}
                  </span>
                </label>

                <button
                  type="button"
                  class="dropdown-trigger-btn"
                  :class="{ 'btn-has-value': filters.positions.length > 0 }"
                  @click.stop="toggleDropdown('position')"
                >
                  <span class="trigger-label">
                    {{ filters.positions.length === 0 ? 'เลือกตำแหน่ง...' : `เลือกแล้ว ${filters.positions.length} ตำแหน่ง` }}
                  </span>
                  <span class="arrow-ico">{{ openDropdown === 'position' ? '▲' : '▼' }}</span>
                </button>

                <!-- Popover Menu -->
                <div v-if="openDropdown === 'position'" class="dropdown-popover" @click.stop>
                  <div class="popover-search-row">
                    <input
                      v-model="positionSearch"
                      type="text"
                      placeholder="🔍 ค้นหาตำแหน่ง..."
                      class="popover-search-input"
                    />
                    <button v-if="positionSearch" class="btn-clear-search-mini" @click="positionSearch = ''">✕</button>
                  </div>

                  <div class="popover-actions">
                    <button type="button" class="btn-link" @click="selectAllVisiblePositions">✓ เลือกทั้งหมด</button>
                    <span class="divider">|</span>
                    <button type="button" class="btn-link" @click="clearPositions" :disabled="filters.positions.length === 0">✕ ล้าง</button>
                  </div>

                  <!-- Custom Position Input -->
                  <div class="popover-add-row">
                    <input
                      v-model="customPositionInput"
                      type="text"
                      placeholder="+ พิมพ์ชื่อตำแหน่งใหม่..."
                      class="popover-custom-input"
                      @keyup.enter="addCustomPosition"
                    />
                    <button type="button" class="btn-add-mini" :disabled="!customPositionInput.trim()" @click="addCustomPosition">+ เพิ่ม</button>
                  </div>

                  <div v-if="loadingPositions" class="popover-status-msg">
                    <span>กำลังโหลดรายชื่อตำแหน่งจาก API...</span>
                  </div>

                  <!-- Scrollable Items List -->
                  <div class="popover-list-items">
                    <label
                      v-for="pos in filteredPositionsList"
                      :key="pos"
                      class="popover-item-label"
                      :class="{ selected: filters.positions.includes(pos) }"
                    >
                      <input
                        type="checkbox"
                        :value="pos"
                        :checked="filters.positions.includes(pos)"
                        @change="togglePosition(pos)"
                      />
                      <span class="item-name">{{ pos }}</span>
                    </label>
                    <div v-if="filteredPositionsList.length === 0 && positionSearch" class="popover-no-match">
                      <span>ไม่พบตำแหน่ง "{{ positionSearch }}"</span>
                      <button type="button" class="btn-link-add" @click="addPositionFromSearch">+ เพิ่มชื่อนี้</button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- 1.2 Demographic Pills (เพศ, อายุ, อายุงาน) -->
            <div class="sub-grid-3">
              <!-- Gender -->
              <div class="filter-block">
                <label class="block-title">เพศ (Gender)</label>
                <div class="pill-group">
                  <button
                    v-for="g in ['ชาย', 'หญิง', 'ไม่ระบุ']"
                    :key="g"
                    type="button"
                    class="pill-btn"
                    :class="{ active: filters.genders.includes(g) }"
                    @click="togglePill(filters.genders, g)"
                  >
                    {{ g }}
                  </button>
                </div>
              </div>

              <!-- Age Brackets -->
              <div class="filter-block">
                <label class="block-title">ช่วงอายุ (Age)</label>
                <div class="pill-group">
                  <button
                    v-for="age in ageBracketsList"
                    :key="age"
                    type="button"
                    class="pill-btn"
                    :class="{ active: filters.ageBrackets.includes(age) }"
                    @click="togglePill(filters.ageBrackets, age)"
                  >
                    {{ age }}
                  </button>
                </div>
              </div>

              <!-- Tenure Brackets -->
              <div class="filter-block">
                <label class="block-title">อายุงาน (Tenure)</label>
                <div class="pill-group">
                  <button
                    v-for="t in tenureList"
                    :key="t.value"
                    type="button"
                    class="pill-btn"
                    :class="{ active: filters.tenureBrackets.includes(t.value) }"
                    @click="togglePill(filters.tenureBrackets, t.value)"
                  >
                    {{ t.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: มิติช่วงเวลาและผลการประเมินสุขภาพใจทั้งหมด -->
        <div class="category-card">
          <div class="category-header">
            <span class="cat-icon">🩺</span>
            <div class="cat-title-wrap">
              <h3 class="category-title">มิติช่วงเวลาและผลการประเมินสุขภาพใจ (ครบทุกเครื่องมือ)</h3>
              <span class="category-desc">คัดกรองวันที่ส่ง และระดับผลคะแนนของ 5 เครื่องมือมาตรฐานกรมสุขภาพจิต</span>
            </div>
          </div>

          <div class="category-content">
            <!-- 2.1 Date Range with Quick Presets -->
            <div class="date-range-card">
              <div class="date-range-header">
                <div class="date-range-title-wrap">
                  <span class="date-header-icon">📅</span>
                  <div>
                    <h4 class="date-range-title">ช่วงวันที่ส่งแบบประเมิน (Submission Date)</h4>
                    <p class="date-range-subtitle">คลิกที่กล่องเพื่อเลือกวันเดือนปี หรือเลือกปุ่มลัดเพื่อกรองช่วงเวลา</p>
                  </div>
                </div>
                <div class="date-presets">
                  <button
                    type="button"
                    class="btn-preset"
                    :class="{ active: activeDatePreset === 'today' }"
                    @click="applyDatePreset('today')"
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    class="btn-preset"
                    :class="{ active: activeDatePreset === '7days' }"
                    @click="applyDatePreset('7days')"
                  >
                    7 วันล่าสุด
                  </button>
                  <button
                    type="button"
                    class="btn-preset"
                    :class="{ active: activeDatePreset === '30days' }"
                    @click="applyDatePreset('30days')"
                  >
                    30 วันล่าสุด
                  </button>
                  <button
                    type="button"
                    class="btn-preset"
                    :class="{ active: activeDatePreset === 'thisYear' }"
                    @click="applyDatePreset('thisYear')"
                  >
                    ปีนี้
                  </button>
                  <button
                    v-if="filters.dateFrom || filters.dateTo"
                    type="button"
                    class="btn-preset btn-preset-clear"
                    @click="clearDateFilter"
                  >
                    ✕ ล้างวันที่
                  </button>
                </div>
              </div>

              <!-- Unified Single Date Range Box -->
              <div class="date-range-single-wrapper">
                <div
                  class="date-range-unified-box"
                  :class="{ 'has-val': !!(filters.dateFrom || filters.dateTo) }"
                  title="คลิกเพื่อเลือกช่วงวันเริ่มต้นและสิ้นสุดในกล่องเดียว"
                  @click="openMaterialRangePicker"
                >
                  <div class="unified-box-content">
                    <!-- Start Segment -->
                    <div class="range-segment">
                      <span class="range-badge badge-start">เริ่มต้น</span>
                      <span class="range-text-val" :class="{ placeholder: !filters.dateFrom }">
                        {{ formatDisplayDate(filters.dateFrom) || 'เลือกวันเริ่มต้น' }}
                      </span>
                    </div>

                    <!-- Arrow Indicator -->
                    <div class="range-arrow-indicator">
                      <span class="range-arrow-sym">➔</span>
                      <span class="range-arrow-sub">ถึง</span>
                    </div>

                    <!-- End Segment -->
                    <div class="range-segment">
                      <span class="range-badge badge-end">สิ้นสุด</span>
                      <span class="range-text-val" :class="{ placeholder: !filters.dateTo }">
                        {{ formatDisplayDate(filters.dateTo) || 'เลือกวันสิ้นสุด' }}
                      </span>
                    </div>
                  </div>

                  <div class="unified-box-right">
                    <span v-if="filters.dateFrom && filters.dateTo" class="range-duration-pill">
                      {{ calculateDaysDiff(filters.dateFrom, filters.dateTo) }}
                    </span>
                    <span class="picker-box-calendar-icon">📅</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2.2 Mental Health Instruments Grid (All Tools) -->
            <div class="instruments-section-divider">
              <span class="divider-label">ผลการประเมินสุขภาพใจ (ครบทุก 5 เครื่องมือมาตรฐาน + 2Q Plus)</span>
            </div>

            <div class="instruments-filter-grid">
              
              <!-- 1. Overall Status -->
              <div class="tool-filter-card">
                <label class="tool-title">1. สถานะภาพรวม (Overall)</label>
                <div class="pill-group">
                  <button
                    type="button"
                    class="pill-btn status-btn-care"
                    :class="{ active: filters.overallStatuses.includes('NEEDS_ADDITIONAL_CARE') }"
                    @click="togglePill(filters.overallStatuses, 'NEEDS_ADDITIONAL_CARE')"
                  >
                    ⚠️ ควรดูแลเพิ่ม
                  </button>
                  <button
                    type="button"
                    class="pill-btn status-btn-normal"
                    :class="{ active: filters.overallStatuses.includes('NORMAL') }"
                    @click="togglePill(filters.overallStatuses, 'NORMAL')"
                  >
                    ✅ สุขภาพใจปกติ
                  </button>
                </div>
              </div>

              <!-- 2. Burnout Levels -->
              <div class="tool-filter-card">
                <label class="tool-title">2. ภาวะหมดไฟ (Burnout)</label>
                <div class="pill-group">
                  <button
                    type="button"
                    class="pill-btn bo-btn-high"
                    :class="{ active: filters.burnoutLevels.includes('HIGH') }"
                    @click="togglePill(filters.burnoutLevels, 'HIGH')"
                  >
                    🔴 สูง
                  </button>
                  <button
                    type="button"
                    class="pill-btn bo-btn-mod"
                    :class="{ active: filters.burnoutLevels.includes('MODERATE') }"
                    @click="togglePill(filters.burnoutLevels, 'MODERATE')"
                  >
                    🟡 ปานกลาง
                  </button>
                  <button
                    type="button"
                    class="pill-btn bo-btn-low"
                    :class="{ active: filters.burnoutLevels.includes('LOW') }"
                    @click="togglePill(filters.burnoutLevels, 'LOW')"
                  >
                    🟢 ต่ำ
                  </button>
                </div>
              </div>

              <!-- 3. Stress Test (ST5) -->
              <div class="tool-filter-card">
                <label class="tool-title">3. ความเครียด (Stress Test ST5)</label>
                <div class="pill-group">
                  <button
                    v-for="st in stressOptions"
                    :key="st.value"
                    type="button"
                    class="pill-btn"
                    :class="[st.btnClass, { active: filters.stressLevels.includes(st.value) }]"
                    @click="togglePill(filters.stressLevels, st.value)"
                  >
                    {{ st.label }}
                  </button>
                </div>
              </div>

              <!-- 3. Depression 9Q -->
              <div class="tool-filter-card">
                <label class="tool-title">3. ภาวะเสี่ยงซึมเศร้า (9Q)</label>
                <div class="pill-group">
                  <button
                    v-for="q in q9Options"
                    :key="q.value"
                    type="button"
                    class="pill-btn"
                    :class="[q.btnClass, { active: filters.q9Levels.includes(q.value) }]"
                    @click="togglePill(filters.q9Levels, q.value)"
                  >
                    {{ q.label }}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      <!-- Footer Action Bar -->
      <div class="filter-footer-bar">
        <div class="footer-hint">
          <span class="info-bulb">💡</span>
          <span>
            ระบบจะกรองและแสดงผลข้อมูลตามเงื่อนไขที่เลือกโดยอัตโนมัติทันที (ตรรกะตัวกรอง: ภายในมิติเดียวกันใช้ <strong>OR</strong>, ข้ามมิติใช้ <strong>AND</strong>)
          </span>
        </div>
        <div class="footer-buttons">
          <button
            type="button"
            class="btn-reset-filters"
            :disabled="activeFilterCount === 0"
            @click="resetFilters"
          >
            ✕ ล้างตัวกรองทั้งหมด
          </button>
        </div>
      </div>
    </div>

    <!-- Material 3 Date Range Picker Dialog (Unified Start & End) -->
    <MaterialDatePicker
      :visible.sync="materialDatePicker.visible"
      :start-date="filters.dateFrom"
      :end-date="filters.dateTo"
      :title="'เลือกช่วงวันที่ส่งแบบประเมิน (Select Date Range)'"
      @confirm="onMaterialRangeConfirm"
      @close="closeMaterialDatePicker"
    />
  </div>
</template>

<script>
import MaterialDatePicker from './MaterialDatePicker.vue';

export default {
  name: 'FilterPanel',
  components: {
    MaterialDatePicker
  },
  data() {
    return {
      isOpen: false,
      openDropdown: null, // 'company' | 'department' | 'position' | null
      activeDatePreset: null,
      materialDatePicker: {
        visible: false
      },
      
      // Company State
      loadingCompanies: false,
      companySearch: '',
      customCompanyInput: '',
      companiesList: [],

      // Department State
      loadingDepartments: false,
      departmentSearch: '',
      customDepartmentInput: '',
      departmentsList: [
        'ทรัพยากรบุคคล',
        'วิศวกรรม',
        'การตลาด',
        'การเงิน',
        'ปฏิบัติการ',
        'ไอที / เทคโนโลยีสารสนเทศ',
        'ฝ่ายขาย / พัฒนาธุรกิจ',
        'บริการลูกค้า / ประชาสัมพันธ์',
        'วิจัยและพัฒนา (R&D)',
        'โลจิสติกส์และคลังสินค้า',
        'จัดซื้อ',
        'กฎหมายและกำกับดูแล',
        'บริหารและจัดการทั่วไป',
        'ความปลอดภัยและอาชีวอนามัย',
        'ผลิต / โรงงาน'
      ],

      // Position State
      loadingPositions: false,
      positionSearch: '',
      customPositionInput: '',
      positionsList: [
        'ผู้จัดการฝ่าย',
        'วิศวกรซอฟต์แวร์',
        'เจ้าหน้าที่บุคคลอาวุโส',
        'นักวิเคราะห์การเงิน',
        'เจ้าหน้าที่การตลาดดิจิทัล',
        'หัวหน้างานปฏิบัติการ',
        'เจ้าหน้าที่ประสานงาน',
        'พนักงานขับรถขนส่ง',
        'วิศวกรระบบ',
        'ผู้อำนวยการฝ่าย'
      ],

      ageBracketsList: ['<25', '25-34', '35-44', '45-54', '≥55'],
      tenureList: [
        { value: '<1', label: '<1 ปี' },
        { value: '1-3', label: '1–3 ปี' },
        { value: '3-5', label: '3–5 ปี' },
        { value: '>5', label: '>5 ปี' }
      ],

      // Stress Options
      stressOptions: [
        { value: 'NORMAL', label: '🟢 ปกติ', btnClass: 'btn-green' },
        { value: 'MILD', label: '🟡 เล็กน้อย', btnClass: 'btn-yellow' },
        { value: 'MODERATE', label: '🟠 ปานกลาง', btnClass: 'btn-orange' },
        { value: 'HIGH', label: '🔴 สูง', btnClass: 'btn-red' },
        { value: 'SEVERE', label: '🚨 สูงมาก', btnClass: 'btn-danger' }
      ],

      // 9Q Options
      q9Options: [
        { value: 'NONE', label: '🟢 ไม่มีอาการ', btnClass: 'btn-green' },
        { value: 'MILD', label: '🟡 ระดับน้อย', btnClass: 'btn-yellow' },
        { value: 'MODERATE', label: '🟠 ปานกลาง', btnClass: 'btn-orange' },
        { value: 'SEVERE', label: '🔴 รุนแรง', btnClass: 'btn-red' }
      ],

      filters: {
        dateFrom: '',
        dateTo: '',
        companies: [],
        departments: [],
        positions: [],
        overallStatuses: [],
        tenureBrackets: [],
        ageBrackets: [],
        genders: [],
        burnoutLevels: [],
        stressLevels: [],
        q9Levels: []
      }
    };
  },
  computed: {
    activeFilterCount() {
      let count = 0;
      if (this.filters.dateFrom || this.filters.dateTo) count++;
      if (this.filters.companies.length > 0) count += this.filters.companies.length;
      if (this.filters.departments.length > 0) count += this.filters.departments.length;
      if (this.filters.positions.length > 0) count += this.filters.positions.length;
      if (this.filters.overallStatuses.length > 0) count++;
      if (this.filters.tenureBrackets.length > 0) count++;
      if (this.filters.ageBrackets.length > 0) count++;
      if (this.filters.genders.length > 0) count++;
      if (this.filters.burnoutLevels.length > 0) count++;
      if (this.filters.stressLevels.length > 0) count++;
      if (this.filters.q9Levels.length > 0) count++;
      return count;
    },
    filteredCompaniesList() {
      if (!this.companySearch.trim()) return this.companiesList;
      const q = this.companySearch.trim().toLowerCase();
      return this.companiesList.filter((c) => c.toLowerCase().includes(q));
    },
    filteredDepartmentsList() {
      if (!this.departmentSearch.trim()) return this.departmentsList;
      const q = this.departmentSearch.trim().toLowerCase();
      return this.departmentsList.filter((d) => d.toLowerCase().includes(q));
    },
    filteredPositionsList() {
      if (!this.positionSearch.trim()) return this.positionsList;
      const q = this.positionSearch.trim().toLowerCase();
      return this.positionsList.filter((p) => p.toLowerCase().includes(q));
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick);
    window.addEventListener('keydown', this.handleKeyDown);
    this.fetchCompanies();
    this.fetchDepartments();
    this.fetchPositions();
    this.readFiltersFromUrl();
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick);
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    handleKeyDown(e) {
      if (e.key === 'Escape') {
        this.openDropdown = null;
      }
    },
    handleDocumentClick(e) {
      if (!this.openDropdown) return;
      const popover = e.target.closest && e.target.closest('.dropdown-popover');
      const trigger = e.target.closest && e.target.closest('.dropdown-trigger-btn');
      if (!popover && !trigger) {
        this.openDropdown = null;
      }
    },
    toggleDropdown(name) {
      this.openDropdown = this.openDropdown === name ? null : name;
    },

    // API Fetchers
    async fetchCompanies() {
      this.loadingCompanies = true;
      try {
        const token = localStorage.getItem('admin_session_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/admin/assessments/companies', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.companies && Array.isArray(data.companies)) {
            const merged = new Set([...this.companiesList, ...data.companies]);
            this.companiesList = Array.from(merged).sort((a, b) => a.localeCompare(b, 'th'));
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic companies from API', err);
      } finally {
        this.loadingCompanies = false;
      }
    },
    async fetchDepartments() {
      this.loadingDepartments = true;
      try {
        const token = localStorage.getItem('admin_session_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/admin/assessments/departments', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.departments && Array.isArray(data.departments)) {
            const merged = new Set([...this.departmentsList, ...data.departments]);
            this.departmentsList = Array.from(merged).sort((a, b) => a.localeCompare(b, 'th'));
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic departments from API', err);
      } finally {
        this.loadingDepartments = false;
      }
    },
    async fetchPositions() {
      this.loadingPositions = true;
      try {
        const token = localStorage.getItem('admin_session_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/admin/assessments/positions', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.positions && Array.isArray(data.positions)) {
            const merged = new Set([...this.positionsList, ...data.positions]);
            this.positionsList = Array.from(merged).sort((a, b) => a.localeCompare(b, 'th'));
          }
        }
      } catch (err) {
        console.warn('Could not fetch dynamic positions from API', err);
      } finally {
        this.loadingPositions = false;
      }
    },

    // Pill Toggle Helper (Immediately triggers live filtering)
    togglePill(targetArray, value) {
      const idx = targetArray.indexOf(value);
      if (idx > -1) {
        targetArray.splice(idx, 1);
      } else {
        targetArray.push(value);
      }
      this.applyFilters(true);
    },


    // Company Handlers
    toggleCompany(comp) {
      this.togglePill(this.filters.companies, comp);
    },
    selectAllVisibleCompanies() {
      this.filteredCompaniesList.forEach((c) => {
        if (!this.filters.companies.includes(c)) this.filters.companies.push(c);
      });
      this.applyFilters(true);
    },
    clearCompanies() {
      this.filters.companies = [];
      this.applyFilters(true);
    },
    removeCompany(comp) {
      this.togglePill(this.filters.companies, comp);
    },
    addCustomCompany() {
      const val = this.customCompanyInput.trim();
      if (!val) return;
      if (!this.companiesList.includes(val)) {
        this.companiesList.push(val);
        this.companiesList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.companies.includes(val)) {
        this.filters.companies.push(val);
      }
      this.customCompanyInput = '';
      this.applyFilters(true);
    },
    addCompanyFromSearch() {
      const val = this.companySearch.trim();
      if (!val) return;
      if (!this.companiesList.includes(val)) {
        this.companiesList.push(val);
        this.companiesList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.companies.includes(val)) {
        this.filters.companies.push(val);
      }
      this.companySearch = '';
      this.applyFilters(true);
    },

    // Department Handlers
    toggleDepartment(dept) {
      this.togglePill(this.filters.departments, dept);
    },
    selectAllVisibleDepartments() {
      this.filteredDepartmentsList.forEach((d) => {
        if (!this.filters.departments.includes(d)) this.filters.departments.push(d);
      });
      this.applyFilters(true);
    },
    clearDepartments() {
      this.filters.departments = [];
      this.applyFilters(true);
    },
    removeDepartment(dept) {
      this.togglePill(this.filters.departments, dept);
    },
    addCustomDepartment() {
      const val = this.customDepartmentInput.trim();
      if (!val) return;
      if (!this.departmentsList.includes(val)) {
        this.departmentsList.push(val);
        this.departmentsList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.departments.includes(val)) {
        this.filters.departments.push(val);
      }
      this.customDepartmentInput = '';
      this.applyFilters(true);
    },
    addDepartmentFromSearch() {
      const val = this.departmentSearch.trim();
      if (!val) return;
      if (!this.departmentsList.includes(val)) {
        this.departmentsList.push(val);
        this.departmentsList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.departments.includes(val)) {
        this.filters.departments.push(val);
      }
      this.departmentSearch = '';
      this.applyFilters(true);
    },

    // Position Handlers
    togglePosition(pos) {
      this.togglePill(this.filters.positions, pos);
    },
    selectAllVisiblePositions() {
      this.filteredPositionsList.forEach((p) => {
        if (!this.filters.positions.includes(p)) this.filters.positions.push(p);
      });
      this.applyFilters(true);
    },
    clearPositions() {
      this.filters.positions = [];
      this.applyFilters(true);
    },
    removePosition(pos) {
      this.togglePill(this.filters.positions, pos);
    },
    addCustomPosition() {
      const val = this.customPositionInput.trim();
      if (!val) return;
      if (!this.positionsList.includes(val)) {
        this.positionsList.push(val);
        this.positionsList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.positions.includes(val)) {
        this.filters.positions.push(val);
      }
      this.customPositionInput = '';
      this.applyFilters(true);
    },
    addPositionFromSearch() {
      const val = this.positionSearch.trim();
      if (!val) return;
      if (!this.positionsList.includes(val)) {
        this.positionsList.push(val);
        this.positionsList.sort((a, b) => a.localeCompare(b, 'th'));
      }
      if (!this.filters.positions.includes(val)) {
        this.filters.positions.push(val);
      }
      this.positionSearch = '';
      this.applyFilters(true);
    },

    // Material 3 Date Range Picker Handlers
    openMaterialRangePicker() {
      this.materialDatePicker.visible = true;
    },
    closeMaterialDatePicker() {
      this.materialDatePicker.visible = false;
    },
    onMaterialRangeConfirm({ startDate, endDate }) {
      this.filters.dateFrom = startDate || '';
      this.filters.dateTo = endDate || '';
      this.activeDatePreset = null;
      this.materialDatePicker.visible = false;
      this.applyFilters(true);
    },
    calculateDaysDiff(from, to) {
      if (!from || !to) return '';
      const d1 = new Date(from);
      const d2 = new Date(to);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} วัน`;
    },
    formatDisplayDate(val) {
      if (!val || !/^\d{4}-\d{2}-\d{2}$/.test(val)) return '';
      const [y, m, d] = val.split('-').map(Number);
      const thaiMonths = [
        'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
        'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
      ];
      return `${d} ${thaiMonths[m - 1]} ${y}`;
    },

    // Date Presets
    applyDatePreset(preset) {
      this.activeDatePreset = preset;
      const now = new Date();
      const formatYMD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      if (preset === 'today') {
        this.filters.dateFrom = formatYMD(now);
        this.filters.dateTo = formatYMD(now);
      } else if (preset === '7days') {
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filters.dateFrom = formatYMD(past);
        this.filters.dateTo = formatYMD(now);
      } else if (preset === '30days') {
        const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        this.filters.dateFrom = formatYMD(past);
        this.filters.dateTo = formatYMD(now);
      } else if (preset === 'thisYear') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        this.filters.dateFrom = formatYMD(startOfYear);
        this.filters.dateTo = formatYMD(now);
      }
      this.applyFilters(true);
    },
    clearDateFilter() {
      this.activeDatePreset = null;
      this.filters.dateFrom = '';
      this.filters.dateTo = '';
      this.applyFilters(true);
    },
    formatDateRangeLabel() {
      if (this.filters.dateFrom && this.filters.dateTo) {
        return `${this.formatDisplayDate(this.filters.dateFrom)} – ${this.formatDisplayDate(this.filters.dateTo)}`;
      }
      if (this.filters.dateFrom) return `ตั้งแต่ ${this.formatDisplayDate(this.filters.dateFrom)}`;
      if (this.filters.dateTo) return `ถึง ${this.formatDisplayDate(this.filters.dateTo)}`;
      return '';
    },
    formatTenureLabel(t) {
      const found = this.tenureList.find((item) => item.value === t);
      return found ? found.label : t;
    },
    formatBurnoutLabel(b) {
      if (b === 'HIGH') return 'สูง';
      if (b === 'MODERATE') return 'ปานกลาง';
      return 'ต่ำ';
    },
    formatStressLabel(st) {
      const opt = this.stressOptions.find((o) => o.value === st);
      return opt ? opt.label : st;
    },
    formatQ9Label(q) {
      const opt = this.q9Options.find((o) => o.value === q);
      return opt ? opt.label : q;
    },

    readFiltersFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        let hasFilters = false;

        if (params.get('dateFrom')) {
          this.filters.dateFrom = params.get('dateFrom');
          hasFilters = true;
        }
        if (params.get('dateTo')) {
          this.filters.dateTo = params.get('dateTo');
          hasFilters = true;
        }
        if (params.get('companies') || params.get('company')) {
          const comps = (params.get('companies') || params.get('company')).split(',').map((s) => s.trim()).filter(Boolean);
          this.filters.companies = comps;
          comps.forEach((c) => {
            if (!this.companiesList.includes(c)) this.companiesList.push(c);
          });
          hasFilters = true;
        }
        if (params.get('departments') || params.get('department')) {
          const depts = (params.get('departments') || params.get('department')).split(',').map((s) => s.trim()).filter(Boolean);
          this.filters.departments = depts;
          depts.forEach((d) => {
            if (!this.departmentsList.includes(d)) this.departmentsList.push(d);
          });
          hasFilters = true;
        }
        if (params.get('positions') || params.get('position')) {
          const poses = (params.get('positions') || params.get('position')).split(',').map((s) => s.trim()).filter(Boolean);
          this.filters.positions = poses;
          poses.forEach((p) => {
            if (!this.positionsList.includes(p)) this.positionsList.push(p);
          });
          hasFilters = true;
        }
        if (params.get('tenureBrackets')) {
          this.filters.tenureBrackets = params.get('tenureBrackets').split(',');
          hasFilters = true;
        }
        if (params.get('ageBrackets')) {
          this.filters.ageBrackets = params.get('ageBrackets').split(',');
          hasFilters = true;
        }
        if (params.get('genders')) {
          this.filters.genders = params.get('genders').split(',');
          hasFilters = true;
        }
        if (params.get('overallStatuses')) {
          this.filters.overallStatuses = params.get('overallStatuses').split(',');
          hasFilters = true;
        }
        if (params.get('burnoutLevels')) {
          this.filters.burnoutLevels = params.get('burnoutLevels').split(',');
          hasFilters = true;
        }
        if (params.get('stressLevels')) {
          this.filters.stressLevels = params.get('stressLevels').split(',');
          hasFilters = true;
        }
        if (params.get('q9Levels')) {
          this.filters.q9Levels = params.get('q9Levels').split(',');
          hasFilters = true;
        }

        if (hasFilters) {
          this.isOpen = true;
          this.applyFilters(false);
        }
      } catch (err) {
        console.error('Error reading url filters', err);
      }
    },
    syncFiltersToUrl() {
      try {
        const params = new URLSearchParams();
        if (this.filters.dateFrom) params.set('dateFrom', this.filters.dateFrom);
        if (this.filters.dateTo) params.set('dateTo', this.filters.dateTo);
        if (this.filters.companies.length > 0) params.set('companies', this.filters.companies.join(','));
        if (this.filters.departments.length > 0) params.set('departments', this.filters.departments.join(','));
        if (this.filters.positions.length > 0) params.set('positions', this.filters.positions.join(','));
        if (this.filters.tenureBrackets.length > 0) params.set('tenureBrackets', this.filters.tenureBrackets.join(','));
        if (this.filters.ageBrackets.length > 0) params.set('ageBrackets', this.filters.ageBrackets.join(','));
        if (this.filters.genders.length > 0) params.set('genders', this.filters.genders.join(','));
        if (this.filters.overallStatuses.length > 0) params.set('overallStatuses', this.filters.overallStatuses.join(','));
        if (this.filters.burnoutLevels.length > 0) params.set('burnoutLevels', this.filters.burnoutLevels.join(','));
        if (this.filters.stressLevels.length > 0) params.set('stressLevels', this.filters.stressLevels.join(','));
        if (this.filters.q9Levels.length > 0) params.set('q9Levels', this.filters.q9Levels.join(','));

        const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState({}, '', newSearch);
      } catch (err) {
        console.error('Error syncing url filters', err);
      }
    },
    applyFilters(updateUrl = true) {
      if (updateUrl) {
        this.syncFiltersToUrl();
      }
      this.$emit('filters-changed', {
        dateFrom: this.filters.dateFrom || undefined,
        dateTo: this.filters.dateTo || undefined,
        companies: this.filters.companies.length > 0 ? this.filters.companies : undefined,
        departments: this.filters.departments.length > 0 ? this.filters.departments : undefined,
        positions: this.filters.positions.length > 0 ? this.filters.positions : undefined,
        tenureBrackets: this.filters.tenureBrackets.length > 0 ? this.filters.tenureBrackets : undefined,
        ageBrackets: this.filters.ageBrackets.length > 0 ? this.filters.ageBrackets : undefined,
        genders: this.filters.genders.length > 0 ? this.filters.genders : undefined,
        overallStatuses: this.filters.overallStatuses.length > 0 ? this.filters.overallStatuses : undefined,
        burnoutLevels: this.filters.burnoutLevels.length > 0 ? this.filters.burnoutLevels : undefined,
        stressLevels: this.filters.stressLevels.length > 0 ? this.filters.stressLevels : undefined,
        q9Levels: this.filters.q9Levels.length > 0 ? this.filters.q9Levels : undefined
      });
    },
    resetFilters() {
      this.filters = {
        dateFrom: '',
        dateTo: '',
        companies: [],
        departments: [],
        positions: [],
        overallStatuses: [],
        tenureBrackets: [],
        ageBrackets: [],
        genders: [],
        burnoutLevels: [],
        stressLevels: [],
        q9Levels: []
      };
      this.companySearch = '';
      this.customCompanyInput = '';
      this.departmentSearch = '';
      this.customDepartmentInput = '';
      this.positionSearch = '';
      this.customPositionInput = '';
      this.openDropdown = null;
      this.activeDatePreset = null;
      this.syncFiltersToUrl();
      this.$emit('filters-changed', {});
    }
  }
};
</script>

<style scoped>
.filter-panel-card {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

/* Header */
.filter-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e2e8f0;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  transition: background 0.2s ease;
}

.filter-header:hover {
  background: #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.filter-icon {
  font-size: 1.25rem;
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.header-title-group strong {
  font-size: 1rem;
  color: #0f172a;
}

.header-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.active-count-badge {
  background: #0284c7;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-quick-reset {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
  font-size: 0.8rem;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-quick-reset:hover {
  background: #fecaca;
  color: #991b1b;
}

.btn-toggle-panel {
  background: white;
  border: 1px solid #cbd5e1;
  font-size: 0.825rem;
  color: #0284c7;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle-panel:hover {
  background: #f0f9ff;
  border-color: #38bdf8;
}

/* Active Chips Bar */
.active-chips-bar {
  padding: 0.75rem 1.5rem;
  background: #f0f9ff;
  border-bottom: 1px solid #bae6fd;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chips-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0369a1;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.775rem;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  font-weight: 500;
  background: white;
  border: 1px solid #cbd5e1;
  color: #1e293b;
}

.chip-comp {
  background: #fdf4ff;
  border-color: #f0abfc;
  color: #86198f;
}

.chip-dept {
  background: #e0f2fe;
  border-color: #7dd3fc;
  color: #0369a1;
}

.chip-pos {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.chip-date {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
}

.chip-danger {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #991b1b;
}

.chip-warning {
  background: #fef3c7;
  border-color: #fcd34d;
  color: #92400e;
}

.chip-success {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
}

.chip-remove {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0 0.15rem;
  opacity: 0.7;
  display: flex;
  align-items: center;
}

.chip-remove:hover {
  opacity: 1;
}

/* Body Container */
.filter-body {
  padding: 1.5rem;
  background: #ffffff;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.filter-sections-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Category Cards */
.category-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafafa;
}

.category-header {
  padding: 0.85rem 1.25rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.cat-icon {
  font-size: 1.2rem;
}

.cat-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.category-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.category-desc {
  font-size: 0.775rem;
  color: #64748b;
}

.category-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: white;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

/* Dropdown Filters Row */
.dropdowns-row-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.dropdown-filter-block {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.block-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge-selection {
  background: #e0f2fe;
  color: #0284c7;
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 9999px;
  font-weight: 700;
}

.dropdown-trigger-btn {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.85rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.dropdown-trigger-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.dropdown-trigger-btn.btn-has-value {
  background: #f0f9ff;
  border-color: #0284c7;
  color: #0369a1;
  font-weight: 600;
}

.arrow-ico {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Popover Menu */
.dropdown-popover {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  min-width: 300px;
  margin-top: 0.35rem;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.popover-search-row {
  position: relative;
}

.popover-search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 1.8rem 0.45rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.825rem;
  background: #f8fafc;
}

.popover-search-input:focus {
  outline: none;
  border-color: #0284c7;
  background: white;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.btn-clear-search-mini {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
}

.popover-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.775rem;
}

.btn-link {
  background: transparent;
  border: none;
  color: #0284c7;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.btn-link:hover:not(:disabled) {
  text-decoration: underline;
}

.btn-link:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.divider {
  color: #cbd5e1;
}

.popover-add-row {
  display: flex;
  gap: 0.35rem;
}

.popover-custom-input {
  flex: 1;
  padding: 0.35rem 0.55rem;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 0.8rem;
}

.popover-custom-input:focus {
  outline: none;
  border-style: solid;
  border-color: #0284c7;
}

.btn-add-mini {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-add-mini:hover:not(:disabled) {
  background: #e2e8f0;
}

.popover-status-msg {
  font-size: 0.8rem;
  color: #64748b;
  text-align: center;
  padding: 0.5rem;
}

.popover-empty-alert {
  font-size: 0.8rem;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.6rem;
  line-height: 1.4;
}

.popover-list-items {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.4rem;
}

.popover-item-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.825rem;
  color: #334155;
  transition: background 0.15s;
}

.popover-item-label:hover {
  background: #f1f5f9;
}

.popover-item-label.selected {
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
}

.item-name {
  flex: 1;
}

.popover-no-match {
  text-align: center;
  padding: 0.75rem 0.5rem;
  font-size: 0.8rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.btn-link-add {
  background: #0284c7;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.775rem;
  cursor: pointer;
}

/* Sub Grid 3 */
.sub-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

/* Pill Buttons */
.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.pill-btn {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.825rem;
  color: #475569;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.pill-btn.active {
  background: #0284c7;
  border-color: #0284c7;
  color: white;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(2, 132, 199, 0.25);
}

/* Date Range Card & Controls */
/* Date Range Section (Clean seamlessly integrated into Section 2) */
.date-range-card {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  margin-bottom: 0.5rem;
  box-shadow: none;
}

.date-range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.date-range-title-wrap {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.date-header-icon {
  font-size: 1.2rem;
  line-height: 1;
  padding: 0.35rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
}

.date-range-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1e293b;
}

.date-range-subtitle {
  margin: 0.15rem 0 0 0;
  font-size: 0.775rem;
  color: #64748b;
  line-height: 1.3;
}

.date-presets {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
  align-items: center;
}

.btn-preset {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.38rem 0.8rem;
  border-radius: 8px;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-preset:hover {
  background: #e2e8f0;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.btn-preset.active {
  background: #0284c7;
  border-color: #0284c7;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
}

.btn-preset-clear {
  color: #dc2626;
  border-color: #fecaca;
  background: #fef2f2;
}

.btn-preset-clear:hover {
  background: #fee2e2;
  color: #b91c1c;
  border-color: #f87171;
}

/* Unified Single Date Range Box */
.date-range-single-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.date-range-unified-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  width: 100%;
  box-sizing: border-box;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.85rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  user-select: none;
}

.date-range-unified-box:hover {
  border-color: #6750a4;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(103, 80, 164, 0.12);
  transform: translateY(-1px);
}

.date-range-unified-box.has-val {
  background: #ffffff;
  border-color: #6750a4;
  box-shadow: 0 2px 8px rgba(103, 80, 164, 0.08);
}

.unified-box-content {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex: 1;
  flex-wrap: wrap;
}

.range-segment {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.range-badge {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge-start {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.badge-end {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.range-text-val {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.range-text-val.placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.range-arrow-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.5rem;
  background: #f3edf7;
  border: 1px solid #e8def8;
  border-radius: 6px;
  padding: 0.2rem 0.6rem;
}

.range-arrow-sym {
  font-size: 0.9rem;
  color: #6750a4;
  line-height: 1;
}

.range-arrow-sub {
  font-size: 0.75rem;
  font-weight: 600;
  color: #49454f;
}

.unified-box-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.range-duration-pill {
  background: #e8def8;
  color: #1d192b;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid #d0bcff;
  white-space: nowrap;
}

.picker-box-calendar-icon {
  font-size: 1.25rem;
  opacity: 0.8;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.date-range-unified-box:hover .picker-box-calendar-icon {
  opacity: 1;
  transform: scale(1.15);
}

@media (max-width: 640px) {
  .unified-box-content {
    gap: 0.75rem;
  }
  .range-segment {
    width: 100%;
    justify-content: space-between;
  }
}

/* Instruments Section Divider */
.instruments-section-divider {
  display: flex;
  align-items: center;
  margin: 2rem 0 1.25rem 0;
  position: relative;
  text-align: center;
}

.instruments-section-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1.5px;
  background: #e2e8f0;
  z-index: 1;
}

.divider-label {
  position: relative;
  z-index: 2;
  background: #ffffff;
  padding: 0 1.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.02em;
}

/* Responsive adjustments for Date Range */
@media (max-width: 640px) {
  .date-range-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .date-presets {
    width: 100%;
  }
  .date-range-unified-box {
    padding: 0.75rem 0.85rem;
    gap: 0.5rem;
  }
  .unified-box-content {
    gap: 0.5rem;
  }
  .range-segment {
    width: 100%;
    justify-content: space-between;
  }
}

/* Instruments Filter Grid (All Health Tools) */
.instruments-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.tool-filter-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.85rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.tool-title {
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
}

/* Custom Pill Styles for Instruments */
.status-btn-care.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.status-btn-normal.active {
  background: #dcfce7;
  border-color: #22c55e;
  color: #15803d;
}

.bo-btn-high.active {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.bo-btn-mod.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.bo-btn-low.active {
  background: #dcfce7;
  border-color: #10b981;
  color: #065f46;
}

.btn-green.active {
  background: #dcfce7;
  border-color: #22c55e;
  color: #15803d;
}

.btn-blue.active {
  background: #e0f2fe;
  border-color: #0284c7;
  color: #0369a1;
}

.btn-yellow.active {
  background: #fef9c3;
  border-color: #eab308;
  color: #854d0e;
}

.btn-orange.active {
  background: #ffedd5;
  border-color: #f97316;
  color: #9a3412;
}

.btn-red.active {
  background: #fee2e2;
  border-color: #ef4444;
  color: #991b1b;
}

.btn-danger.active {
  background: #7f1d1d;
  border-color: #991b1b;
  color: white;
}

.risk-btn-2q.active {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #92400e;
}

.risk-btn-suicide.active {
  background: #fee2e2;
  border-color: #dc2626;
  color: #991b1b;
}

/* Footer Bar */
.filter-footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #64748b;
}

.info-bulb {
  font-size: 1rem;
}

.footer-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-reset-filters {
  background: white;
  border: 1.5px solid #cbd5e1;
  padding: 0.55rem 1.35rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.btn-reset-filters:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
}

.btn-reset-filters:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: #e2e8f0;
  color: #94a3b8;
}
</style>
