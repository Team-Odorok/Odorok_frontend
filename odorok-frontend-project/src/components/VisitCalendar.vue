<template>
    <div class="visit-calendar">
      <h3>방문 계획 캘린더</h3>
      
      <!-- 캘린더 헤더 -->
      <div class="calendar-header">
        <button @click="previousMonth">&lt;</button>
        <h4>{{ currentMonthYear }}</h4>
        <button @click="nextMonth">&gt;</button>
      </div>
      
      <!-- 요일 헤더 -->
      <div class="calendar-weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      
      <!-- 캘린더 그리드 -->
      <div class="calendar-grid">
        <div 
          v-for="date in calendarDates" 
          :key="date.key"
          :class="['calendar-day', {
            'other-month': !date.isCurrentMonth,
            'has-schedule': date.hasSchedule,
            'today': date.isToday
          }]"
          @click="selectDate(date)"
        >
          <span class="day-number">{{ date.day }}</span>
          <div v-if="date.schedules && date.schedules.length > 0" class="schedule-indicator">
            {{ date.schedules.length }}개
          </div>
        </div>
      </div>
      
      <!-- 선택된 날짜의 일정 -->
      <div v-if="selectedDate && selectedDateSchedules.length > 0" class="selected-date-schedules">
        <h4>{{ formatSelectedDate(selectedDate) }} 방문 예정</h4>
        <div v-for="schedule in selectedDateSchedules" :key="schedule.id" class="schedule-item">
          <div class="schedule-course">{{ schedule.courseName }}</div>
          <div class="schedule-attractions" v-if="schedule.attractionCount > 0">
            명소 {{ schedule.attractionCount }}개 방문 예정
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import courseApi from '../api/courseApi.js'
  
  export default {
    name: 'VisitCalendar',
    data() {
      return {
        currentDate: new Date(),
        selectedDate: null,
        schedules: [],
        loading: false,
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
          
          const dateKey = date.toISOString().split('T')[0]
          const schedulesForDate = this.schedules.filter(s => 
            s.dueDate.startsWith(dateKey)
          )
          
          dates.push({
            key: dateKey,
            day: date.getDate(),
            date: date,
            isCurrentMonth: date.getMonth() === month,
            isToday: date.toDateString() === today.toDateString(),
            hasSchedule: schedulesForDate.length > 0,
            schedules: schedulesForDate
          })
        }
        
        return dates
      },
      
      selectedDateSchedules() {
        if (!this.selectedDate) return []
        const dateKey = this.selectedDate.toISOString().split('T')[0]
        return this.schedules.filter(s => s.dueDate.startsWith(dateKey))
      }
    },
    
    async mounted() {
      await this.loadSchedules()
    },
    
    methods: {
      async loadSchedules() {
        this.loading = true
        try {
          const userEmail = 'test@example.com'
          
          const response = await courseApi.getScheduledCourses(userEmail)
          if (response && response.status === 'success' && response.data && response.data.schedule) {
            this.schedules = response.data.schedule
          } else {
            this.schedules = []
          }
        } catch (error) {
          console.error('방문 예정 로드 실패:', error)
          this.schedules = []
        } finally {
          this.loading = false
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
      
      formatSelectedDate(date) {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
      }
    }
  }
  </script>
  
  <style scoped>
  .visit-calendar {
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .calendar-header button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 5px 10px;
  }
  
  .calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    margin-bottom: 10px;
  }
  
  .weekday {
    text-align: center;
    padding: 10px;
    background: #f8f9fa;
    font-weight: bold;
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }
  
  .calendar-day {
    aspect-ratio: 1;
    border: 1px solid #eee;
    padding: 5px;
    cursor: pointer;
    position: relative;
    background: white;
  }
  
  .calendar-day:hover {
    background: #f8f9fa;
  }
  
  .calendar-day.other-month {
    background: #f8f9fa;
    color: #ccc;
  }
  
  .calendar-day.today {
    background: #e3f2fd;
    font-weight: bold;
  }
  
  .calendar-day.has-schedule {
    background: #fff3cd;
  }
  
  .day-number {
    font-size: 14px;
  }
  
  .schedule-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    background: #007bff;
    color: white;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  }
  
  .selected-date-schedules {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
  }
  
  .schedule-item {
    margin-bottom: 10px;
    padding: 10px;
    background: white;
    border-radius: 4px;
    border-left: 4px solid #007bff;
  }
  
  .schedule-course {
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .schedule-attractions {
    font-size: 0.9rem;
    color: #666;
  }
  </style>