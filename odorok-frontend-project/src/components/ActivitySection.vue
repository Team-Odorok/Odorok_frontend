<template>
  <div class="activity-section">
    <div class="activity-card">
      <div class="activity-header">
        <h3>활동내역</h3>
        <button @click="$emit('refresh')" class="refresh-btn" :disabled="refreshing">
          {{ refreshing ? '새로고침 중...' : '새로고침' }}
        </button>
      </div>
      
      <div class="activity-content" v-if="activityStats?.data">
        <!-- 활동 통계 그리드 -->
        <div class="stats-grid">
          <div class="stat-card" v-for="(stat, key) in activityStats.data" :key="key">
            <div class="stat-label">{{ getStatLabel(key) }}</div>
            <div class="stat-value">{{ stat }}</div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-data">
        활동 통계 데이터가 없습니다.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActivitySection',
  props: {
    activityStats: {
      type: Object,
      default: () => null
    },
    refreshing: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh'],
  setup() {
    // 통계 라벨 매핑
    const getStatLabel = (key) => {
      const labels = {
        // 서버에서 실제로 받아오는 키들
        myPostCount: '작성 글 ',
        likeCount: '좋아요 횟수',
        diaryCount: '나의 오도록',
        courseCount: '다녀온 코스',
        distanceCount: '내가 걸은 거리',
        attendanceCount: '전체 출석 일수',
        
        // 기존 키들도 유지 (호환성)
        totalDiaries: '총 일기',
        totalVisits: '총 방문',
        totalLikes: '총 좋아요',
        totalComments: '총 댓글',
        totalCourses: '총 코스',
        totalPosts: '작성 글 개수',
        receivedLikes: '좋아요 받은 개수',
        myOdorokCount: '내가 작성한 오도록 개수',
        visitedCourses: '방문한 코스 개수',
        totalDistance: '내가 걸은 거리',
        totalAttendance: '전체 출석 일수'
      }
      return labels[key] || key
    }

    return {
      getStatLabel
    }
  }
}
</script>

<style scoped>
.activity-section {
  margin-bottom: 30px;
}

.activity-card {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.activity-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ecf0f1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: bold;
}

.refresh-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.refresh-btn:hover:not(:disabled) {
  background: #2980b9;
}

.refresh-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.activity-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.stat-label {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 10px;
  font-weight: 500;
}

.stat-value {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.no-data {
  text-align: center;
  color: #7f8c8d;
  padding: 40px;
  font-style: italic;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
