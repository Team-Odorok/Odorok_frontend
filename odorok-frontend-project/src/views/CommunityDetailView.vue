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
    
    <!-- 게시글 상세 -->
    <div v-else-if="article" class="article-detail">
      <!-- 게시글 헤더 -->
      <div class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span class="author">작성자 {{ article.nickname }}</span>
          <span class="date">{{ formatDate(article.createdAt) }}</span>
          <span class="views">조회수 {{ article.viewCount }}</span>
        </div>
      </div>
      
      <!-- 게시글 내용 -->
      <div class="article-content">
        <p>{{ article.content }}</p>
      </div>
      
      <!-- 게시글 액션 -->
      <div class="article-actions">
        <button @click="toggleLike" :disabled="liking" :class="{ liked: isLiked }">
          {{ likeButtonLabel }} {{ articleLikeCount }}
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
            placeholder="댓글을 입력해주세요"
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
            
            <!-- 댓글 내용 (수정 모드가 아닌 경우) -->
            <div v-if="!comment.isEditing" class="comment-content">
              {{ comment.content }}
            </div>
            
            <!-- 댓글 수정 폼 (수정 모드일 때) -->
            <div v-else class="comment-edit-form">
              <textarea 
                v-model="comment.editContent" 
                rows="2"
                placeholder="댓글을 수정해주세요"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { communityApi } from '@/api/communityApi'

export default {
  name: 'CommunityDetailView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    const article = ref(null)
    const comments = ref([])
    const loading = ref(false)
    const error = ref(null)
    const liking = ref(false)
    const isLiked = ref(false)
    const newComment = ref('')
    const likeButtonLabel = computed(() => (isLiked.value ? '좋아요 취소' : '좋아요'))
    const articleLikeCount = computed(() => Number(article.value?.likeCount ?? 0))

    const getArticleId = () => {
      return article.value?.id ?? article.value?.articleId ?? article.value?.articleIdx ?? route.params.id
    }
    
    // 게시글 조회
    const fetchArticle = async () => {
      loading.value = true
      error.value = null
      
      try {
        const articleId = route.params.id
        const response = await communityApi.getArticle(articleId)
        
        if (response && response.status === 'success') {
          const payload = response.data ?? response.article ?? response

          article.value = payload
          isLiked.value = payload?.isLiked ?? payload?.liked ?? false

          if (article.value) {
            const normalized = Number(article.value.likeCount ?? article.value.likes ?? 0)
            article.value.likeCount = Number.isFinite(normalized) ? normalized : 0
          }
        } else {
          error.value = '게시글을 불러올 수 없습니다.'
        }
      } catch (err) {
        console.error('게시글 조회 실패:', err)
        error.value = '게시글을 불러오는데 실패했습니다.'
      } finally {
        loading.value = false
      }
    }
    
    // 댓글 조회
    const fetchComments = async () => {
      try {
        const articleId = route.params.id
        const response = await communityApi.getComments(articleId)
        
        if (response && response.status === 'success') {
          comments.value = response.data.map(comment => ({
            ...comment,
            isEditing: false,
            editContent: comment.content
          }))
        }
      } catch (err) {
        console.error('댓글 조회 실패:', err)
      }
    }
    
    // 좋아요 토글
    const toggleLike = async () => {
      if (liking.value) return
      
      liking.value = true
      try {
        const articleId = getArticleId()
        const response = await communityApi.toggleLike(articleId)
        
        if (response && response.status === 'success') {
          isLiked.value = !isLiked.value
          const newCount = response.data?.likeCount ?? response.data?.likes ?? article.value.likeCount
          if (article.value) {
            article.value.likeCount = Number(newCount)
          }
        }
      } catch (err) {
        console.error('좋아요 처리 실패:', err)
      } finally {
        liking.value = false
      }
    }
    
    // 댓글 작성
    const submitComment = async () => {
      if (!newComment.value.trim()) return
      
      try {
        const articleId = getArticleId()
        const response = await communityApi.createComment(articleId, {
          content: newComment.value.trim()
        })
        
        if (response && response.status === 'success') {
          newComment.value = ''
          await fetchComments() // 댓글 목록 새로고침
        }
      } catch (err) {
        console.error('댓글 작성 실패:', err)
        alert('댓글 작성에 실패했습니다.')
      }
    }
    
    // 댓글 수정 시작
    const startEditComment = (comment) => {
      comment.isEditing = true
      comment.editContent = comment.content
    }
    
    // 댓글 수정 취소
    const cancelEditComment = (comment) => {
      comment.isEditing = false
      comment.editContent = comment.content
    }
    
    // 댓글 수정 저장
    const saveEditComment = async (comment) => {
      if (!comment.editContent.trim()) return
      
      try {
        const response = await communityApi.updateComment(comment.id, {
          content: comment.editContent.trim()
        })
        
        if (response && response.status === 'success') {
          comment.content = comment.editContent.trim()
          comment.isEditing = false
        }
      } catch (err) {
        console.error('댓글 수정 실패:', err)
        alert('댓글 수정에 실패했습니다.')
      }
    }
    
    // 댓글 삭제
    const deleteComment = async (commentId) => {
      if (!confirm('댓글을 삭제하시겠습니까?')) return
      
      try {
        const response = await communityApi.deleteComment(commentId)
        
        if (response && response.status === 'success') {
          comments.value = comments.value.filter(comment => comment.id !== commentId)
        }
      } catch (err) {
        console.error('댓글 삭제 실패:', err)
        alert('댓글 삭제에 실패했습니다.')
      }
    }
    
    // 날짜 포맷팅
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // 뒤로가기
    const goBack = () => {
      router.push('/community')
    }
    
    onMounted(() => {
      fetchArticle()
      fetchComments()
    })
    
    return {
      article,
      comments,
      loading,
      error,
      liking,
      isLiked,
      newComment,
      likeButtonLabel,
      articleLikeCount,
      fetchArticle,
      toggleLike,
      submitComment,
      startEditComment,
      cancelEditComment,
      saveEditComment,
      deleteComment,
      formatDate,
      goBack
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
}

.error {
  color: #dc3545;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.article-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.article-header {
  padding: 24px;
  border-bottom: 1px solid #e9ecef;
}

.article-header h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 700;
  color: #212529;
}

.article-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6c757d;
}

.article-content {
  padding: 24px;
  line-height: 1.6;
  color: #495057;
}

.article-actions {
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
  align-items: center;
}

.article-actions button {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.article-actions button:hover {
  background: #f8f9fa;
}

.article-actions button.liked {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.back-button {
  background: #6c757d !important;
  color: white !important;
  border-color: #6c757d !important;
}

.comment-section {
  padding: 24px;
  border-top: 1px solid #e9ecef;
}

.comment-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 12px;
}

.comment-form button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-form button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #495057;
}

.comment-date {
  font-size: 12px;
  color: #6c757d;
}

.comment-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .delete-btn {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.edit-btn:hover {
  background: #e3f2fd;
  border-color: #2196f3;
}

.delete-btn:hover {
  background: #ffebee;
  border-color: #f44336;
}

.comment-content {
  color: #495057;
  line-height: 1.5;
}

.comment-edit-form textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  margin-bottom: 8px;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.edit-actions button {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.edit-actions button:first-child {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.edit-actions button:first-child:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}
</style>