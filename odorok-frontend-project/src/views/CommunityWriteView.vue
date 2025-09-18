<template>
  <div class="write-container">
    <div class="write-header">
      <h1>글쓰기</h1>
      <p>여행 경험을 공유해보세요</p>
    </div>

    <div class="write-content">
      <!-- 제목 입력 컴포넌트  -->
      <TitleInput @title-changed="handleTitleChange"/>
      
      <!-- 게시판 설정 -->
      <div class="form-section">
        <h3>게시판 설정</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="boardType">게시판 타입</label>
            <select id="boardType" v-model="formData.boardType" class="form-select">
              <option v-for="option in boardTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <div class="form-group" v-if="formData.boardType === 3">
            <label for="diseaseId">질병 선택</label>
            <select id="diseaseId" v-model="formData.diseaseId" class="form-select">
              <option v-for="option in diseaseOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- 이미지 업로드 컴포넌트 -->
      <ImageUpload @image-changed="handleImageChange"/>
      <!-- 내용 입력 컴포넌트 -->
      <ContentEditor @content-changed="handleContentChange"/>

      <WriteActions
        @submit="submitArticle"
        @cancel="goBack"
        :isSubmitting="isSubmitting"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { communityApi } from '@/api/communityApi'
import { handleApiError, showSuccess } from '@/utils/errorHandler.js'
import TitleInput from '@/components/TitleInput.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import ContentEditor from '@/components/ContentEditor.vue'
import WriteActions from '@/components/WriteActions.vue'

export default {
  name: "CommunityWriteView",
  components: {
    TitleInput,
    ImageUpload,
    ContentEditor,
    WriteActions,
  },
  setup() {
    const router = useRouter()

    const formData = ref({
      title: '',
      content: '',
      notice: false,
      // 게시판 타입: 1=일반, 2=공지사항, 3=질병별 추천
      boardType: 1,
      diseaseId: null,
      courseId: null,
    })
    
    // 게시판 타입 옵션
    const boardTypeOptions = ref([
      { value: 1, label: '일반 게시판' },
      { value: 2, label: '공지사항' },
      { value: 3, label: '질병별 추천' }
    ])
    
    // 질병 옵션
    const diseaseOptions = ref([
      { value: null, label: '질병을 선택하세요' },
      { value: 1, label: '고혈압' },
      { value: 2, label: '당뇨' },
      { value: 3, label: '허리디스크' },
      { value: 4, label: '관절염' },
      { value: 5, label: '고지혈증' }
    ])
    
    const selectedImages = ref([])
    const isSubmitting = ref(false)

    const handleTitleChange = (title) => {
      formData.value.title = title
    }

    const handleImageChange = (images) => {
      selectedImages.value = images
    }

    const handleContentChange = (content) => {
      formData.value.content = content
    }

    const submitArticle = async () => {
      try {
        isSubmitting.value = true
      
        if (!formData.value.title.trim()) {
          handleApiError({ message: '제목을 입력해주세요' }, '게시글 작성')
          return
        }

        if (!formData.value.content.trim()) {
          handleApiError({ message: '내용을 입력해주세요' }, '게시글 작성')
          return
        }

        const formDataToSend = new FormData()

        // 이미지가 있을 때만 추가
        if (selectedImages.value && selectedImages.value.length > 0) {
          selectedImages.value.forEach((image) => {
            formDataToSend.append('images', image.file)
          })
        }

        const jsonData = {
          title: formData.value.title,
          content: formData.value.content,
          notice: !!formData.value.notice,
        }
        // 숫자 필드가 유효하면 포함(스펙: boardType, diseaseId, courseId)
        const bt = Number(formData.value.boardType)
        if (!Number.isNaN(bt)) jsonData.boardType = bt
        const did = Number(formData.value.diseaseId)
        if (!Number.isNaN(did) && formData.value.diseaseId !== null && formData.value.diseaseId !== '') jsonData.diseaseId = did
        const cid = Number(formData.value.courseId)
        if (!Number.isNaN(cid) && formData.value.courseId !== null && formData.value.courseId !== '') jsonData.courseId = cid

        formDataToSend.append('data', new Blob([JSON.stringify(jsonData)], {
          type: 'application/json'
        }))

        const response = await communityApi.createArticle(formDataToSend)

        if (response.status === 'success') {
          showSuccess('게시글이 성공적으로 등록되었습니다.')
          router.push('/community')
        } else {
          handleApiError({ message: '게시글 등록에 실패했습니다.' }, '게시글 작성')
        }

      } catch (error) {
        handleApiError(error, '게시글 작성')
      } finally {
        isSubmitting.value = false
      }
    }

    const goBack = () => {
      router.push('/community')
    }

    return {
      formData,
      selectedImages,
      isSubmitting,
      boardTypeOptions,
      diseaseOptions,
      handleTitleChange,
      handleImageChange,
      handleContentChange,
      submitArticle,
      goBack,
    }
  }
}
</script>

<style scoped>
.write-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.write-header {
  text-align: center;
  margin-bottom: 40px;
}

.write-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
}

.write-header p {
  font-size: 1.1rem;
  color: #666;
}

.write-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-section h3 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #495057;
}

.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  color: #495057;
}

.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}
</style> 