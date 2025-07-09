# Odorok Frontend Project

Vue 3를 사용한 여행 일지 관리 애플리케이션입니다.

## 주요 기능

- 📝 **일지 목록 조회**: 카드 형태로 일지 목록을 표시
- 📅 **연도별 그룹핑**: 일지를 연도별로 그룹핑하여 조회
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱에 최적화
- 🔄 **로딩 상태**: 데이터 로딩 중 스피너 표시
- ⚠️ **에러 처리**: API 오류 시 사용자 친화적 메시지

## 기술 스택

- **Vue 3** - Composition API
- **Vue Router 4** - 라우팅
- **Pinia** - 상태 관리
- **Vite** - 빌드 도구

## 프로젝트 구조

```
src/
├── components/
│   └── DiaryCard.vue          # 일지 카드 컴포넌트
├── views/
│   └── DiaryListView.vue      # 일지 목록 페이지
├── services/
│   └── diaryService.js        # API 서비스
├── router/
│   └── index.js               # 라우터 설정
└── App.vue                    # 메인 앱 컴포넌트
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## API 연동

현재는 목업 데이터를 사용하고 있습니다. 백엔드 API가 준비되면 다음 단계로 연동할 수 있습니다:

1. `src/services/diaryService.js`에서 실제 API 엔드포인트 설정
2. `src/views/DiaryListView.vue`에서 주석 처리된 API 호출 코드 활성화
3. JWT 토큰 관리 로직 구현

### API 엔드포인트

- `GET /api/diaries` - 일지 목록 조회
- `GET /api/diaries?groupBy=year` - 연도별 그룹핑된 일지 목록

## 주요 컴포넌트

### DiaryListView
- 일지 목록을 그리드 형태로 표시
- 연도별 그룹핑 토글 기능
- 로딩 및 에러 상태 처리

### DiaryCard
- 개별 일지 정보를 카드 형태로 표시
- 방문일, 작성일 정보 표시
- 보기/수정 버튼 제공

## 스타일링

- CSS Grid를 사용한 반응형 레이아웃
- 한 줄에 최대 6개의 카드 표시 (화면 크기에 따라 자동 조정)
- 호버 효과 및 부드러운 애니메이션
- 모던하고 깔끔한 디자인

## 개발 가이드

### 새로운 기능 추가
1. `src/views/`에 새로운 페이지 컴포넌트 생성
2. `src/router/index.js`에 라우트 추가
3. 필요한 경우 `src/services/`에 API 서비스 추가

### 스타일 수정
- 각 컴포넌트의 `<style scoped>` 섹션에서 수정
- 전역 스타일은 `src/assets/`에 추가

## 라이센스

MIT License
