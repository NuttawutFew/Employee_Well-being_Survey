<template>
  <div class="filter-panel-card">
    <div class="filter-header">
      <span class="filter-title">🔍 ตัวกรองข้อมูลหลายมิติ (Multidimensional Filter Panel)</span>
      <span class="filter-sub">(OR ในมิติเดียวกัน • AND ข้ามมิติตามสเปก)</span>
    </div>

    <div class="filter-grid">
      <!-- 1. ค้นหาพนักงาน -->
      <div class="filter-group">
        <label for="mh-f-search">ค้นหาพนักงาน</label>
        <input
          id="mh-f-search"
          v-model="filters.search"
          class="filter-input"
          placeholder="รหัส หรือ ชื่อ-สกุล..."
          @keyup.enter="applyFilters"
        />
      </div>

      <!-- 2. บริษัท -->
      <div class="filter-group">
        <label for="mh-f-company">บริษัท</label>
        <select id="mh-f-company" v-model="filters.company" class="filter-select">
          <option value="">ทุกบริษัท (52 บริษัทในเครือ)</option>
          <option v-for="comp in companies" :key="comp" :value="comp">{{ comp }}</option>
        </select>
      </div>

      <!-- 3. แผนก / ฝ่าย -->
      <div class="filter-group">
        <label for="mh-f-dept">แผนก / ฝ่าย</label>
        <select id="mh-f-dept" v-model="filters.department" class="filter-select">
          <option value="">ทุกแผนก/ฝ่าย</option>
          <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
        </select>
      </div>

      <!-- 4. เพศ -->
      <div class="filter-group">
        <label for="mh-f-gender">เพศ</label>
        <select id="mh-f-gender" v-model="filters.gender" class="filter-select">
          <option value="">ทุกเพศ</option>
          <option value="หญิง">หญิง</option>
          <option value="ชาย">ชาย</option>
          <option value="ไม่ระบุ">ไม่ระบุ</option>
        </select>
      </div>

      <!-- 5. พื้นที่ปฏิบัติงาน -->
      <div class="filter-group">
        <label for="mh-f-area">พื้นที่ปฏิบัติงาน</label>
        <select id="mh-f-area" v-model="filters.workArea" class="filter-select">
          <option value="">ทุกพื้นที่</option>
          <option value="กรุงเทพมหานครและปริมณฑล">กรุงเทพมหานครและปริมณฑล</option>
          <option value="ขอนแก่น (ศูนย์ภูมิภาค)">ขอนแก่น (ศูนย์ภูมิภาค)</option>
          <option value="นครราชสีมา">นครราชสีมา</option>
          <option value="เชียงใหม่">เชียงใหม่</option>
          <option value="สระบุรี (โรงงานผลิต)">สระบุรี (โรงงานผลิต)</option>
        </select>
      </div>

      <!-- 6. อายุงาน -->
      <div class="filter-group">
        <label for="mh-f-tenure">อายุงาน</label>
        <select id="mh-f-tenure" v-model="filters.tenureBracket" class="filter-select">
          <option value="">ทุกช่วงอายุงาน</option>
          <option value="<1">น้อยกว่า 1 ปี</option>
          <option value="1-3">1–3 ปี</option>
          <option value="3-5">3–5 ปี</option>
          <option value=">5">มากกว่า 5 ปี</option>
        </select>
      </div>

      <!-- 7. ระดับ Burnout -->
      <div class="filter-group">
        <label for="mh-f-bo">ระดับ Burnout</label>
        <select id="mh-f-bo" v-model="filters.burnoutLevel" class="filter-select">
          <option value="">ทุกระดับ</option>
          <option value="HIGH">สูง (ความเสี่ยงสูง)</option>
          <option value="MODERATE">ปานกลาง</option>
          <option value="LOW">ต่ำ (ปกติ)</option>
        </select>
      </div>

      <!-- 8. ระดับ ความเครียด (ST-20) -->
      <div class="filter-group">
        <label for="mh-f-st">ระดับ ความเครียด (ST-20)</label>
        <select id="mh-f-st" v-model="filters.stressLevel" class="filter-select">
          <option value="">ทุกระดับ</option>
          <option value="SEVERE">สูงกว่าปกติมาก</option>
          <option value="MODERATE">สูงกว่าปกติปานกลาง</option>
          <option value="MILD">สูงกว่าปกติเล็กน้อย</option>
          <option value="NORMAL">ปกติ</option>
        </select>
      </div>

      <!-- 9. ระดับ ซึมเศร้า (9Q) -->
      <div class="filter-group">
        <label for="mh-f-9q">ระดับ ซึมเศร้า (9Q)</label>
        <select id="mh-f-9q" v-model="filters.q9Level" class="filter-select">
          <option value="">ทุกระดับ</option>
          <option value="SEVERE">รุนแรง</option>
          <option value="MODERATE">ปานกลาง</option>
          <option value="MILD">น้อย</option>
          <option value="NONE">ไม่มีอาการ / น้อยมาก</option>
        </select>
      </div>
    </div>

    <div class="filter-actions">
      <button type="button" class="btn-reset-filter" id="mh-btn-filter-reset" @click="resetFilters">
        ล้างตัวกรอง
      </button>
      <button type="button" class="btn-apply-filter" id="mh-btn-filter-apply" @click="applyFilters">
        🔍 ใช้ตัวกรอง
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPanel',
  data() {
    return {
      filters: {
        search: '',
        company: '',
        department: '',
        gender: '',
        workArea: '',
        tenureBracket: '',
        burnoutLevel: '',
        stressLevel: '',
        q9Level: ''
      },
      companies: [
        'บริษัท อรุณ กรุ๊ป จำกัด',
        'บริษัท นภา ฟู้ดส์ จำกัด',
        'บริษัท สยามโลจิสติกส์ จำกัด',
        'บริษัท เมโทรดิจิทัล จำกัด',
        'บริษัท กรีนอินดัสทรี จำกัด'
      ],
      departments: [
        'การเงินและบัญชี',
        'ทรัพยากรบุคคล (HR)',
        'วิศวกรรมและเทคโนโลยี',
        'ปฏิบัติการและคลังสินค้า',
        'จัดซื้อและซัพพลายเชน',
        'การตลาด'
      ]
    };
  },
  async mounted() {
    await this.fetchOptions();
  },
  methods: {
    async fetchOptions() {
      try {
        const token = localStorage.getItem('admin_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [compRes, deptRes] = await Promise.all([
          fetch('/api/admin/assessments/companies', { headers }).catch(() => null),
          fetch('/api/admin/assessments/departments', { headers }).catch(() => null)
        ]);
        if (compRes && compRes.ok) {
          const data = await compRes.json();
          if (Array.isArray(data.companies) && data.companies.length > 0) {
            const merged = Array.from(new Set([...this.companies, ...data.companies]));
            this.companies = merged;
          }
        }
        if (deptRes && deptRes.ok) {
          const data = await deptRes.json();
          if (Array.isArray(data.departments) && data.departments.length > 0) {
            const merged = Array.from(new Set([...this.departments, ...data.departments]));
            this.departments = merged;
          }
        }
      } catch (err) {
        // Fallback to prototype defaults
      }
    },
    applyFilters() {
      const payload = {};
      if (this.filters.search && this.filters.search.trim()) {
        payload.search = this.filters.search.trim();
      }
      if (this.filters.company) {
        payload.companies = [this.filters.company];
      }
      if (this.filters.department) {
        payload.departments = [this.filters.department];
      }
      if (this.filters.gender) {
        payload.genders = [this.filters.gender];
      }
      if (this.filters.workArea) {
        payload.workAreas = [this.filters.workArea];
      }
      if (this.filters.tenureBracket) {
        payload.tenureBrackets = [this.filters.tenureBracket];
      }
      if (this.filters.burnoutLevel) {
        payload.burnoutLevels = [this.filters.burnoutLevel];
      }
      if (this.filters.stressLevel) {
        payload.stressLevels = [this.filters.stressLevel];
      }
      if (this.filters.q9Level) {
        payload.q9Levels = [this.filters.q9Level];
      }

      this.$emit('filters-changed', payload);
    },
    resetFilters() {
      this.filters = {
        search: '',
        company: '',
        department: '',
        gender: '',
        workArea: '',
        tenureBracket: '',
        burnoutLevel: '',
        stressLevel: '',
        q9Level: ''
      };
      this.$emit('filters-changed', {});
    }
  }
};
</script>

<style scoped>
.filter-panel-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-title {
  color: #0f172a;
}

.filter-sub {
  font-size: 0.8rem;
  font-weight: normal;
  color: #64748b;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 0.75rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-group label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #475569;
}

.filter-input,
.filter-select {
  width: 100%;
  padding: 0.45rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #1e293b;
  background: #ffffff;
  font-family: inherit;
  transition: border-color 0.15s ease;
  box-sizing: border-box;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
  margin-top: 1rem;
}

.btn-apply-filter {
  background: #0284c7;
  color: white;
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

.btn-apply-filter:hover {
  background: #0369a1;
}

.btn-reset-filter {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 0.45rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

.btn-reset-filter:hover {
  background: #e2e8f0;
}

@media (max-width: 640px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .filter-actions {
    justify-content: stretch;
  }
  .btn-apply-filter,
  .btn-reset-filter {
    flex: 1;
    text-align: center;
  }
}
</style>
