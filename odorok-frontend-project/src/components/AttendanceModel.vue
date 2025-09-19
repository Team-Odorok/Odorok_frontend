<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>출석체크</h3>
        <button class="close-btn" type="button" @click="$emit('close')">&times;</button>
      </div>

      <div class="attendance-calendar-summary">
        <div class="attendance-calendar-summary-item">{{ todayText }}</div>
        <div class="attendance-calendar-summary-item">이번달 출석 {{ attendanceCount }}회</div>
      </div>

      <div class="calendar">
        <div class="cal-header">
          <button class="nav" type="button" @click="prevMonth">‹</button>
          <div class="ym">{{ viewYear }}년 {{ viewMonth }}월</div>
          <button class="nav" type="button" @click="nextMonth">›</button>
        </div>
        <div class="weekday-row">
          <div v-for="w in weekdays" :key="w" class="weekday">{{ w }}</div>
        </div>
        <div class="grid">
          <div v-for="n in firstDayOffset" :key="'e'+n" class="cell empty"></div>
          <div v-for="d in daysInMonth" :key="d" class="cell day" :class="{ today: isToday(d), attended: attendedSet.has(d) }">{{ d }}</div>
        </div>
      </div>

      <div class="actions">
        <button class="checkin" type="button" :disabled="alreadyCheckedInToday && isThisMonth" @click="checkInToday">출석하기</button>
        <button class="refresh" type="button" @click="fetchMonth">이번달 불러오기</button>
      </div>
    </div>
  </div>
</template>

<script>
import attendanceApi from '@/api/attendanceApi'
export default {
  name: 'AttendanceModal',
  props: { visible: { type: Boolean, default: false } },
  emits: ['close'],
  data() {
    const now = new Date()
    return {
      today: now,
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth() + 1,
      attendedDateKeys: [] // ['YYYY-MM-DD']
    }
  },
  computed: {
    weekdays() { return ['일','월','화','수','목','금','토'] },
    todayText() { return `${this.today.getFullYear()}년 ${this.today.getMonth()+1}월 ${this.today.getDate()}일` },
    daysInMonth() { return new Date(this.viewYear, this.viewMonth, 0).getDate() },
    firstDayOffset() { return new Date(this.viewYear, this.viewMonth - 1, 1).getDay() },
    attendedSet() {
      const set = new Set()
      this.attendedDateKeys.forEach(k => { const [y,m,d] = k.split('-').map(Number); if (y===this.viewYear && m===this.viewMonth) set.add(d) })
      return set
    },
    attendanceCount() { return this.attendedSet.size },
    isThisMonth() { return this.viewYear===this.today.getFullYear() && this.viewMonth===this.today.getMonth()+1 },
    alreadyCheckedInToday() {
      if (!this.isThisMonth) return false
      const y=this.today.getFullYear(), m=this.today.getMonth()+1, d=this.today.getDate()
      const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      return this.attendedDateKeys.includes(key)
    }
  },
  methods: {
    prevMonth() { this.viewMonth===1 ? (this.viewMonth=12, this.viewYear--) : this.viewMonth--; this.fetchMonth() },
    nextMonth() { this.viewMonth===12 ? (this.viewMonth=1, this.viewYear++) : this.viewMonth++; this.fetchMonth() },
    isToday(d) { return this.isThisMonth && d===this.today.getDate() },
    async fetchMonth() {
      try {
        const res = await attendanceApi.getMonthly(this.viewYear, this.viewMonth)
        const days = res?.days || res?.data?.days || []
        const ym = `${this.viewYear}-${String(this.viewMonth).padStart(2,'0')}`
        this.attendedDateKeys = days.map(n => `${ym}-${String(n).padStart(2,'0')}`)
      } catch (e) {
        console.error('출석 월 조회 실패:', e)
        // 서버 연결 실패 시 빈 배열로 초기화
        this.attendedDateKeys = []
        
        // 사용자에게 알림 (선택사항)
        if (e.code === 'ECONNABORTED' || e.code === 'ERR_NETWORK') {
          console.warn('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.')
        }
      }
    },
    async checkInToday() {
      try {
        await attendanceApi.createToday()
        await this.fetchMonth()
      } catch (e) {
        console.error('출석 생성 실패:', e)
      }
    }
  },
  mounted() { this.fetchMonth() }
}
</script>




<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  width: 90%;
  max-width: 520px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
}
.close-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
}
/* calendar styles */
.attendance-calendar-summary { display:flex; gap:10px; padding: 12px 18px; }
.attendance-calendar-summary-item { background:#f5f7fa; padding:6px 10px; border-radius:6px; font-size:14px; }
.calendar { padding: 0 18px 6px; }
.cal-header { display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:8px; }
.ym { font-weight:700; }
.nav { width:28px; height:28px; border:1px solid #e5e7eb; background:#fff; border-radius:6px; cursor:pointer; }
.weekday-row { display:grid; grid-template-columns:repeat(7,1fr); margin:6px 0; }
.weekday { text-align:center; color:#495057; font-size:12px; padding:4px 0; }
.grid { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; }
.cell { height:40px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
.cell.empty { background:transparent; }
.cell.day { background:#fff; border:1px solid #e9ecef; }
.cell.day.today { outline:2px solid #303E69; }
.cell.day.attended { box-shadow:0 0 0 2px #22c55e inset; border-color:#22c55e; }
.actions { display:flex; justify-content:center; gap:8px; padding: 10px 18px 18px; }
.checkin, .refresh { height:36px; padding:0 12px; border:1px solid #e5e7eb; background:#fff; border-radius:6px; cursor:pointer; }
.checkin:disabled { opacity:.5; cursor:not-allowed; }
</style>

