<template>
    <div v-if="visible" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>방문 예정 등록</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <!-- 코스 정보 -->
          <div class="course-info" v-if="course">
            <h4>{{ course.name }}</h4>
            <p>거리: {{ course.distance }}km | 난이도: {{ course.difficulty }}</p>
          </div>
          
          <!-- 방문계획 캘린더 -->
          <div class="calendar-section">
            <h4>방문 예정 날짜 선택</h4>
            <div class="calendar">
              <div class="calendar-header">
                <button @click="previousMonth">&lt;</button>
                <span>{{ currentMonthYear }}</span>
                <button @click="nextMonth">&gt;</button>
              </div>
              <div class="calendar-grid">
                <div class="weekdays">
                  <div v-for="day in weekdays" :key="day">{{ day }}</div>
                </div>
                <div class="days">
                  <div 
                    v-for="date in calendarDates" 
                    :key="date.key"
                    :class="['day', {
                      'other-month': !date.isCurrentMonth,
                      'selected': isSelectedDate(date),
                      'today': date.isToday
                    }]"
                    @click="selectDate(date)"
                  >
                    {{ date.day }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 관심 명소 리스트 -->
          <div class="attractions-section">
            <h4>방문할 명소 선택 (선택사항)</h4>
            <div class="attraction-list">
              <div v-for="attraction in availableAttractions" :key="attraction.attractionId" class="attraction-item">
                <input 
                  type="checkbox" 
                  :id="attraction.attractionId"
                  :value="attraction.attractionId"
                  v-model="selectedAttractions"
                />
                <label :for="attraction.attractionId">{{ attraction.title }}</label>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="submitSchedule" :disabled="submitting || !selectedDate" class="submit-btn">
            {{ submitting ? '등록 중...' : '예정 등록' }}
          </button>
          <button @click="closeModal" class="cancel-btn">취소</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import courseApi from '../api/courseApi.js'
  
  export default {
    name: 'ScheduleRegistrationModal',
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      course: {
        type: Object,
        default: null
      }
    },
    data() {
      return {
        submitting: false,
        selectedDate: null,
        selectedAttractions: [],
        availableAttractions: [],
        currentDate: new Date(),
        weekdays: ['일', '월', '화', '수', '목', '금', '토']
      }
    },
    computed: {
      currentMonthYear() {
        return `${this.currentDate.getFullYear()}년 ${this.currentDate.getMonth() + 1}월`
      },
      
      calendarDates() {
        const year = this.currentDate.getFullYear()
        const month = this.currentDate.getMonth()
        
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDay.getDay())
        
        const dates = []
        const today = new Date()
        
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate)
          date.setDate(startDate.getDate() + i)
          
          dates.push({
            key: date.toISOString().split('T')[0],
            day: date.getDate(),
            date: date,
            isCurrentMonth: date.getMonth() === month,
            isToday: date.toDateString() === today.toDateString()
          })
        }
        
        return dates
      }
    },
    
    watch: {
      visible(newVal) {
        if (newVal && this.course) {
          this.loadAttractions()
          this.selectedDate = null
          this.selectedAttractions = []
        }
      }
    },
    
    methods: {
      async loadAttractions() {
        try {
          const courseId = this.course.id || this.course.courseId
          const response = await courseApi.getNearbyAttractions(
            courseId,
            12
          )
          if (response && response.status === 'success' && response.data && response.data.items) {
            this.availableAttractions = response.data.items.slice(0, 10)
          }
        } catch (error) {
          console.error('명소 로드 실패:', error)
          this.availableAttractions = []
        }
      },
      
      previousMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
      },
      
      nextMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
      },
      
      selectDate(date) {
        if (date.isCurrentMonth) {
          this.selectedDate = date.date
        }
      },
      
      isSelectedDate(date) {
        return this.selectedDate && date.date.toDateString() === this.selectedDate.toDateString()
      },
      
      async submitSchedule() {
        if (!this.selectedDate) {
          alert('방문 예정 날짜를 선택해주세요.')
          return
        }
        
        this.submitting = true
        try {
          const token = localStorage.getItem('accessToken')
          const payload = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))) : null
          const userEmail = payload?.email || payload?.sub
          const attractionIds = this.selectedAttractions.map(Number)
          const due = this.selectedDate.toISOString()
          const cid = this.course?.courseId ?? this.course?.id


          await courseApi.registerSchedule(
            cid,
            due,
            attractionIds
          )
          this.$emit('schedule-registered')
          this.closeModal()
          alert('방문 예정이 등록되었습니다.')
        } catch (error) {
          console.error('예정 등록 실패:', error)
          alert('예정 등록에 실패했습니다.')
        } finally {
          this.submitting = false
        }
      },
      
      closeModal() {
        this.$emit('close')
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .course-info {
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
  }
  
  .calendar-section, .attractions-section {
    margin-bottom: 20px;
  }
  
  .calendar {
    border: 1px solid #ddd;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f8f9fa;
  }
  
  .calendar-header button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px 10px;
  }
  
  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: #e9ecef;
  }
  
  .weekdays div {
    padding: 10px;
    text-align: center;
    font-weight: bold;
  }
  
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }
  
  .day {
    padding: 10px;
    text-align: center;
    cursor: pointer;
    border: 1px solid #eee;
  }
  
  .day:hover {
    background: #f8f9fa;
  }
  
  .day.other-month {
    color: #ccc;
  }
  
  .day.selected {
    background: #007bff;
    color: white;
  }
  
  .day.today {
    font-weight: bold;
    background: #e3f2fd;
  }
  
  .attraction-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
  }
  
  .attraction-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .attraction-item input {
    margin-right: 8px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #eee;
  }
  
  .submit-btn, .cancel-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .submit-btn {
    background: #007bff;
    color: white;
  }
  
  .submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
  
  .cancel-btn {
    background: #6c757d;
    color: white;
  }
  </style>