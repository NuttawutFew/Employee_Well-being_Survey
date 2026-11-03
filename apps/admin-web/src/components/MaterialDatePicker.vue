<template>
  <div v-if="visible" class="m3-datepicker-backdrop" @click.self="cancel">
    <div class="m3-datepicker-dialog" role="dialog" aria-modal="true" :aria-label="title">
      <!-- 1. Header Section -->
      <div class="m3-header">
        <div class="m3-header-top">
          <span class="m3-subtitle">{{ title || 'เลือกช่วงวันที่ (Date Range)' }}</span>
          <div class="m3-header-actions">
            <button
              type="button"
              class="m3-icon-btn m3-close-btn"
              title="ปิด (Close)"
              @click="cancel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="m3-headline-row">
          <span class="m3-headline">{{ formattedHeadlineRange }}</span>
        </div>

        <!-- Step Indicator Pill -->
        <div class="m3-step-indicator">
          <span v-if="step === 'start'" class="step-badge step-start">
            👉 ขั้นที่ 1: คลิกเลือก <strong>วันเริ่มต้น (Start Date)</strong>
          </span>
          <span v-else class="step-badge step-end">
            👉 ขั้นที่ 2: คลิกเลือก <strong>วันสิ้นสุด (End Date)</strong>
          </span>
        </div>
      </div>

      <div class="m3-divider"></div>

      <!-- 2. Body: Year Selection Mode -->
      <div v-if="mode === 'year-select'" class="m3-year-select-body">
        <div class="m3-year-header">
          <span class="m3-year-title">เลือกปีที่ต้องการ</span>
          <button type="button" class="m3-btn-subtle" @click="mode = 'calendar'">
            กลับไปปฏิทิน
          </button>
        </div>
        <div class="m3-year-grid">
          <button
            v-for="y in yearList"
            :key="y"
            type="button"
            class="m3-year-btn"
            :class="{ selected: y === viewYear }"
            @click="selectYear(y)"
          >
            {{ y }}
          </button>
        </div>
      </div>

      <!-- 3. Body: Calendar Range Mode (Pick start then end -> auto close) -->
      <div v-else class="m3-calendar-mode-body">
        <!-- Month / Year Selector & Prev/Next Arrows -->
        <div class="m3-nav-row">
          <button type="button" class="m3-month-selector-btn" @click="mode = 'year-select'">
            <span>{{ monthNames[viewMonth] }} {{ viewYear }}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          <div class="m3-nav-arrows">
            <button
              type="button"
              class="m3-icon-btn"
              title="เดือนก่อนหน้า"
              @click="prevMonth"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              type="button"
              class="m3-icon-btn"
              title="เดือนถัดไป"
              @click="nextMonth"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Day of Week Header: S M T W T F S -->
        <div class="m3-weekdays-row">
          <span v-for="(day, idx) in ['S', 'M', 'T', 'W', 'T', 'F', 'S']" :key="idx" class="m3-weekday-cell">
            {{ day }}
          </span>
        </div>

        <!-- Days Grid with Range Highlight Band -->
        <div class="m3-days-grid" @mouseleave="hoverYmd = null">
          <!-- Empty offset cells -->
          <div
            v-for="blank in firstDayOfWeekOffset"
            :key="'blank-' + blank"
            class="m3-day-wrapper empty"
          ></div>

          <!-- Active Day Cells -->
          <div
            v-for="d in daysInCurrentMonth"
            :key="'day-wrap-' + d"
            class="m3-day-wrapper"
            :class="{
              'range-start-wrap': isRangeStart(d),
              'range-end-wrap': isRangeEnd(d),
              'in-range-wrap': isInRange(d)
            }"
            @mouseenter="onDayHover(d)"
          >
            <button
              type="button"
              class="m3-day-cell"
              :class="{
                'is-start': isRangeStart(d),
                'is-end': isRangeEnd(d),
                'is-single': isRangeStart(d) && isRangeEnd(d),
                'today': isDayToday(d) && !isRangeStart(d) && !isRangeEnd(d)
              }"
              @click="selectDay(d)"
            >
              <span>{{ d }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialDatePicker',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: String,
      default: '' // 'YYYY-MM-DD'
    },
    endDate: {
      type: String,
      default: '' // 'YYYY-MM-DD'
    },
    title: {
      type: String,
      default: 'เลือกช่วงวันที่ (Select Date Range)'
    }
  },
  data() {
    return {
      mode: 'calendar', // 'calendar' | 'year-select'
      step: 'start', // 'start' | 'end'
      rangeStart: '', // 'YYYY-MM-DD'
      rangeEnd: '', // 'YYYY-MM-DD'
      hoverYmd: null,
      viewYear: new Date().getFullYear(),
      viewMonth: new Date().getMonth(), // 0 - 11
      monthNames: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      monthShortNames: [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
      ]
    };
  },
  computed: {
    daysInCurrentMonth() {
      return new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
    },
    firstDayOfWeekOffset() {
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      return new Date(this.viewYear, this.viewMonth, 1).getDay();
    },
    formattedHeadlineRange() {
      if (!this.rangeStart) {
        return 'เลือกวันเริ่มต้น...';
      }
      const formatStr = (ymd) => {
        if (!ymd) return '';
        const [y, m, d] = ymd.split('-').map(Number);
        return `${this.monthShortNames[m - 1]} ${d}`;
      };

      const startText = formatStr(this.rangeStart);
      const [sy] = this.rangeStart.split('-');

      if (!this.rangeEnd) {
        return `${startText} – สิ้นสุด?`;
      }
      const endText = formatStr(this.rangeEnd);
      const [ey] = this.rangeEnd.split('-');
      if (sy === ey) {
        return `${startText} – ${endText}, ${sy}`;
      }
      return `${startText}, ${sy} – ${endText}, ${ey}`;
    },
    yearList() {
      const current = new Date().getFullYear();
      const list = [];
      for (let y = current - 15; y <= current + 5; y++) {
        list.push(y);
      }
      return list;
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initValues();
      }
    },
    startDate() {
      this.initValues();
    },
    endDate() {
      this.initValues();
    }
  },
  mounted() {
    this.initValues();
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    initValues() {
      this.mode = 'calendar';
      this.rangeStart = this.startDate || '';
      this.rangeEnd = this.endDate || '';
      this.hoverYmd = null;

      if (this.rangeStart) {
        const [y, m] = this.rangeStart.split('-').map(Number);
        this.viewYear = y;
        this.viewMonth = m - 1;
        this.step = 'start';
      } else {
        const today = new Date();
        this.viewYear = today.getFullYear();
        this.viewMonth = today.getMonth();
        this.step = 'start';
      }
    },
    handleKeyDown(e) {
      if (!this.visible) return;
      if (e.key === 'Escape') {
        this.cancel();
      }
    },
    getYmd(day) {
      const mm = String(this.viewMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${this.viewYear}-${mm}-${dd}`;
    },
    isDayToday(day) {
      const today = new Date();
      return (
        today.getFullYear() === this.viewYear &&
        today.getMonth() === this.viewMonth &&
        today.getDate() === day
      );
    },
    isRangeStart(day) {
      const ymd = this.getYmd(day);
      return this.rangeStart === ymd;
    },
    isRangeEnd(day) {
      const ymd = this.getYmd(day);
      return this.rangeEnd === ymd;
    },
    isInRange(day) {
      const ymd = this.getYmd(day);
      // Case 1: rangeStart and rangeEnd are both set
      if (this.rangeStart && this.rangeEnd) {
        const min = this.rangeStart < this.rangeEnd ? this.rangeStart : this.rangeEnd;
        const max = this.rangeStart < this.rangeEnd ? this.rangeEnd : this.rangeStart;
        return ymd > min && ymd < max;
      }
      // Case 2: rangeStart set and user is hovering another day in step 2
      if (this.rangeStart && !this.rangeEnd && this.hoverYmd) {
        const min = this.rangeStart < this.hoverYmd ? this.rangeStart : this.hoverYmd;
        const max = this.rangeStart < this.hoverYmd ? this.hoverYmd : this.rangeStart;
        return ymd >= min && ymd <= max;
      }
      return false;
    },
    onDayHover(day) {
      if (this.step === 'end' && this.rangeStart) {
        this.hoverYmd = this.getYmd(day);
      }
    },
    selectDay(day) {
      const clickedYmd = this.getYmd(day);

      if (this.step === 'start') {
        // Step 1: select start date
        this.rangeStart = clickedYmd;
        this.rangeEnd = '';
        this.step = 'end';
      } else {
        // Step 2: select end date
        let finalStart = this.rangeStart;
        let finalEnd = clickedYmd;

        // If user clicked earlier date than start date, automatically swap them
        if (finalEnd < finalStart) {
          const temp = finalStart;
          finalStart = finalEnd;
          finalEnd = temp;
        }

        this.rangeStart = finalStart;
        this.rangeEnd = finalEnd;
        this.step = 'start';

        // Immediately emit confirm and close modal! No OK button needed!
        this.$emit('confirm', {
          startDate: this.rangeStart,
          endDate: this.rangeEnd
        });
        this.$emit('update:visible', false);
      }
    },
    prevMonth() {
      if (this.viewMonth === 0) {
        this.viewMonth = 11;
        this.viewYear--;
      } else {
        this.viewMonth--;
      }
    },
    nextMonth() {
      if (this.viewMonth === 11) {
        this.viewMonth = 0;
        this.viewYear++;
      } else {
        this.viewMonth++;
      }
    },
    selectYear(year) {
      this.viewYear = year;
      this.mode = 'calendar';
    },
    cancel() {
      this.$emit('close');
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style scoped>
/* Backdrop */
.m3-datepicker-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  animation: m3FadeIn 0.2s ease-out;
}

@keyframes m3FadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Material 3 Modal Dialog Container - Spacious, no edge clipping */
.m3-datepicker-dialog {
  background: #f3edf7;
  color: #1d1b20;
  width: 360px;
  max-width: 94vw;
  border-radius: 28px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  padding: 24px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  user-select: none;
  font-family: inherit;
  box-sizing: border-box;
  animation: m3ScaleIn 0.22s cubic-bezier(0.2, 0, 0, 1);
}

@keyframes m3ScaleIn {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* 1. Header Section */
.m3-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 4px;
}

.m3-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m3-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.m3-subtitle {
  font-size: 0.85rem;
  font-weight: 600;
  color: #49454f;
  letter-spacing: 0.1px;
}

.m3-headline-row {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.m3-headline {
  font-size: 1.75rem;
  font-weight: 500;
  color: #1d1b20;
  letter-spacing: -0.2px;
  line-height: 1.25;
}

.m3-step-indicator {
  margin-top: 4px;
}

.step-badge {
  display: inline-block;
  font-size: 0.775rem;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.step-start {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.step-end {
  background: #f3e8ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.m3-close-btn {
  color: #49454f;
  transition: all 0.15s ease;
}

.m3-close-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.m3-divider {
  height: 1px;
  background: #cac4d0;
  margin: 14px 4px 14px 4px;
}

/* 2. Month / Year Nav Row */
.m3-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
  height: 40px;
}

.m3-month-selector-btn {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #49454f;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  transition: background 0.15s ease;
}

.m3-month-selector-btn:hover {
  background: #e8def8;
  color: #1d1b20;
}

.m3-nav-arrows {
  display: flex;
  align-items: center;
  gap: 4px;
}

.m3-icon-btn {
  background: transparent;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #49454f;
  cursor: pointer;
  transition: all 0.15s ease;
}

.m3-icon-btn:hover {
  background: #e8def8;
  color: #1d1b20;
}

/* 3. Weekdays Header Row */
.m3-weekdays-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
  padding: 0 4px;
}

.m3-weekday-cell {
  font-size: 0.825rem;
  font-weight: 600;
  color: #49454f;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 4. Days Grid & Range Ribbon Styling */
.m3-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 4px;
  padding: 0 4px;
  margin-bottom: 4px;
}

.m3-day-wrapper {
  position: relative;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Range Band Ribbon: connecting start and end dates */
.m3-day-wrapper.in-range-wrap::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: #e8def8;
  z-index: 1;
}

.m3-day-wrapper.range-start-wrap::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  right: 0;
  background: #e8def8;
  z-index: 1;
}

.m3-day-wrapper.range-end-wrap::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 50%;
  background: #e8def8;
  z-index: 1;
}

.m3-day-cell {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #1d1b20;
  font-size: 0.925rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  position: relative;
  z-index: 2;
}

.m3-day-wrapper.empty .m3-day-cell {
  cursor: default;
}

.m3-day-cell:not(.is-start):not(.is-end):hover {
  background: #e8def8;
  color: #1d1b20;
  transform: scale(1.06);
}

/* Selected Start and End Days: Material 3 Deep Purple */
.m3-day-cell.is-start,
.m3-day-cell.is-end {
  background: #6750a4 !important;
  color: #ffffff !important;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(103, 80, 164, 0.4);
}

/* Today indicator */
.m3-day-cell.today {
  border: 1.5px solid #6750a4;
  color: #6750a4;
  font-weight: 700;
}

/* Year Select Grid */
.m3-year-select-body {
  height: 250px;
  overflow-y: auto;
  padding: 8px 6px;
  box-sizing: border-box;
}

.m3-year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.m3-year-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #49454f;
}

.m3-year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.m3-year-btn {
  padding: 10px 6px;
  background: transparent;
  border: 1px solid #cac4d0;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #49454f;
  cursor: pointer;
  transition: all 0.15s ease;
}

.m3-year-btn:hover {
  background: #e8def8;
  color: #1d1b20;
  border-color: #6750a4;
}

.m3-year-btn.selected {
  background: #6750a4;
  color: #ffffff;
  border-color: #6750a4;
  font-weight: 700;
}

.m3-btn-subtle {
  background: transparent;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6750a4;
  cursor: pointer;
}

.m3-btn-subtle:hover {
  background: #e8def8;
}
</style>
