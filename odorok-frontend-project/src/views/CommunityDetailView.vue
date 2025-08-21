<template>
  <div class="detail-container">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading">
      <p>게시글을 불러오는 중...</p>
    </div>
    
    <!-- 에러 상태 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchArticle" class="retry-button">다시 시도</button>
    </div>
    
    <!-- 게시글 내용 -->
    <div v-else-if="article" class="article-detail">
      <!-- 게시글 헤더 -->
      <div class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span class="author">작성자: {{ article.nickname }}</span>
          <span class="date">{{ formatDate(article.createdAt) }}</span>
          <span class="views">조회수: {{ article.viewCount }}</span>
        </div>
      </div>
      
      <!-- 게시글 내용 -->
      <div class="article-content">
        <p>{{ article.content }}</p>
      </div>
      
      <!-- 게시글 액션 -->
      <div class="article-actions">
        <button @click="toggleLike" :class="{ liked: isLiked }">
          ❤️ {{ article.likeCount }}
        </button>
        <button @click="goBack" class="back-button">목록으로</button>
      </div>
      
      <!-- 댓글 섹션 -->
      <div class="comment-section">
        <h3>댓글 ({{ comments.length }})</h3>
        
        <!-- 댓글 작성 폼 -->
        <div class="comment-form">
          <textarea 
            v-model="newComment"
            placeholder="댓글을 입력하세요"
            rows="3"
          ></textarea>
          <button @click="submitComment" :disabled="!newComment.trim()">
            댓글 작성
          </button>
        </div>
        
        <!-- 댓글 목록 -->
        <div class="comment-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-header">
              <span class="comment-author">{{ comment.nickname }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              <div class="comment-actions">
                <button @click="startEditComment(comment)" class="edit-btn">수정</button>
                <button @click="deleteComment(comment.id)" class="delete-btn">삭제</button>
              </div>
            </div>
            
            <!-- 댓글 내용 (수정 모드가 아닐 때) -->
            <div v-if="!comment.isEditing" class="comment-content">
              {{ comment.content }}
            </div>
            
            <!-- 댓글 수정 폼 (수정 모드일 때) -->
            <div v-else class="comment-edit-form">
              <textarea 
                v-model="comment.editContent" 
                rows="2"
                placeholder="댓글을 수정하세요"
              ></textarea>
              <div class="edit-actions">
                <button @click="saveEditComment(comment)" :disabled="!comment.editContent.trim()">
                  저장
                </button>
                <button @click="cancelEditComment(comment)">취소</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

 <script>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { communityApi } from '@/api/communityApi'

export default {
  name: 'CommunityDetailView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // 데이터
    const article = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const isLiked = ref(false)
    
    // 게시글 ID 가져오기
    const articleId = route.params.id
    
    // 게시글 조회
    const fetchArticle = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await communityApi.getArticle(articleId)
        
        if (response.status === 'success') {
          article.value = response.data
        } else {
          error.value = response.message || '게시글을 불러오는데 실패했습니다.'
        }
      } catch (err) {
        console.error('게시글 조회 실패:', err)
        error.value = '게시글을 불러오는데 실패했습니다.'
      } finally {
        loading.value = false
      }
    }
    
    // 날짜 포맷팅
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR')
    }
    
    // 좋아요 토글
    const toggleLike = async () => {
      try {
        const response = await communityApi.toggleLike(articleId)
        if (response.status === 'success') {
          isLiked.value = !isLiked.value
          // 좋아요 수 업데이트
          if (article.value) {
            article.value.likeCount += isLiked.value ? 1 : -1
          }
        }
      } catch (error) {
        console.error('좋아요 토글 실패:', error)
      }
    }
    
    // 뒤로가기
    const goBack = () => {
      router.push('/community')
    }

    const comments = ref([])
    const newComment = ref('')

    const fetchComments = async () => {
      try {
        const response = await communityApi.getComments(articleId)
        if (response.status === 'success') {
          comments.value = response.data || []
        } 
      } catch (error) {
        console.error('댓글 조회 실패:', error)
        error.value = '댓글을 불러오는데 실패했습니다.'
      }
    }

    const submitComment = async () => {
      if (!newComment.value.trim()) return
      
      try {
        const response = await communityApi.createComment(articleId, {
          content: newComment.value
        })
        if (response.status === 'success') {
          newComment.value = ''
          await fetchComments()
        }
      } catch (error) {
        console.error('댓글 작성 실패:', error)
        alert('댓글 작성에 실패했습니다.')
      }
    }

    const deleteComment = async (commentId) => {
      if (!confirm('댓글을 삭제하시겠습니까?')) return
      
      try {
        const response = await communityApi.deleteComment(articleId, {
          content: commentId  // API 명세에 따라 content 필드로 전송
        })
        if (response.status === 'success') {
          await fetchComments()
        }
      } catch (error) {
        console.error('댓글 삭제 실패:', error)
        alert('댓글 삭제에 실패했습니다.')
      }
    }

    // 댓글 수정 관련 함수들
    const startEditComment = (comment) => {
      comment.isEditing = true
      comment.editContent = comment.content
    }

    const saveEditComment = async (comment) => {
      if (!comment.editContent.trim()) return
      
      try {
        const response = await communityApi.updateComment(comment.id, {
          content: comment.editContent
        })
        if (response.status === 'success') {
          comment.content = comment.editContent
          comment.isEditing = false
          delete comment.editContent
        }
      } catch (error) {
        console.error('댓글 수정 실패:', error)
        alert('댓글 수정에 실패했습니다.')
      }
    }

    const cancelEditComment = (comment) => {
      comment.isEditing = false
      delete comment.editContent
    }
    
    // 페이지 로드 시 게시글 조회
    onMounted(() => {
      fetchArticle()
      fetchComments()
    })
    
    return {
      article,
      loading,
      error,
      isLiked,
      fetchArticle,
      formatDate,
      toggleLike,
      goBack,
      comments,
      newComment,
      submitComment,
      deleteComment,
      startEditComment,
      saveEditComment,
      cancelEditComment
    }
  }
}
</script>

 <style scoped>
.detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #e74c3c;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.article-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.article-header {
  padding: 30px;
  border-bottom: 1px solid #eee;
}

.article-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 15px;
}

.article-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 0.9rem;
}

.article-content {
  padding: 30px;
  line-height: 1.6;
  color: #333;
}

.article-actions {
  padding: 20px 30px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.article-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.article-actions button.liked {
  background: #e74c3c;
  color: white;
}

.back-button {
  background: #95a5a6;
  color: white;
}

.back-button:hover {
  background: #7f8c8d;
}

/* 댓글 섹션 스타일 */
.comment-section {
  margin-top: 30px;
  padding: 30px;
  border-top: 1px solid #eee;
}

.comment-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
}

.comment-form button {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-form button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.comment-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #3498db;
}

.comment-date {
  color: #666;
  font-size: 0.9rem;
}

.comment-actions {
  display: flex;
  gap: 5px;
}

.edit-btn, .delete-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
}

.comment-content {
  color: #333;
  line-height: 1.5;
}

.comment-edit-form {
  margin-top: 10px;
}

.comment-edit-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 8px;
}

.edit-actions {
  display: flex;
  gap: 5px;
}

.edit-actions button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.edit-actions button:first-child {
  background: #27ae60;
  color: white;
}

.edit-actions button:first-child:hover {
  background: #229954;
}

.edit-actions button:last-child {
  background: #95a5a6;
  color: white;
}

.edit-actions button:last-child:hover {
  background: #7f8c8d;
}
</style>    