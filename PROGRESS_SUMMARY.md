# AWS Demo Factory - 개발 진행 상황 요약

## 프로젝트 개요
- **프로젝트명**: AWS Demo Factory
- **목적**: AWS의 최신 기술 트렌드와 데모, 튜토리얼, 베스트 프랙티스를 경험하고 클라우드 혁신의 무한한 가능성을 실현할 수 있는 웹 서비스 플랫폼
- **기술 스택**: React 18.3.1, Material-UI, Express.js, AWS SDK
- **주요 AWS 서비스**: Amazon S3, Amazon Cognito, AWS CodeDeploy

## 완료된 주요 기능

### 1. 콘텐츠 수정 기능 개선 ✅
- **문제**: 콘텐츠 수정 시 무한 리렌더링 발생
- **해결**: useCallback을 사용한 함수 메모이제이션
- **파일**: `src/pages/ContentEditPage.js`
- **변경사항**:
  - `canEditContent` 함수를 useCallback으로 메모이제이션
  - `loadContent` 함수 최적화
  - 의존성 배열 최적화

### 2. 미디어 태그 렌더링 시스템 구현 ✅
- **기능**: 본문에서 `[image:파일명]`, `[video:파일명]` 태그를 실제 미디어로 표시
- **파일**: `src/components/SimpleMarkdownRenderer.js`
- **구현 내용**:
  - 미디어 태그 파싱 및 파일 매칭
  - React 컴포넌트 직접 렌더링 (HTML 문자열 방식에서 변경)
  - 이미지/비디오 별도 처리

### 3. 파일 업로드 최적화 ✅
- **문제**: localStorage 용량 초과, 큰 파일 처리 문제
- **해결**: 파일 크기별 처리 방식 분리
- **파일**: `src/utils/amplifyConfig.js`
- **변경사항**:
  - 이미지 2MB, 비디오 5MB 제한
  - Data URL 길이 제한 (1MB)
  - 큰 파일은 Object URL 사용

### 4. 폰트 문제 해결 ✅
- **문제**: Amazon Ember 폰트 CORS 에러
- **해결**: Google Fonts의 Inter 폰트로 대체
- **파일**: `public/index.html`, `src/theme.js`, `src/index.css`, `src/App.js`

### 5. 미디어 갤러리 제거 ✅
- **목적**: 콘텐츠 상단의 중복 미디어 표시 제거
- **파일**: `src/pages/ContentDetailPage.js`
- **제거된 내용**:
  - MediaGallery 컴포넌트 import 및 사용
  - 별도 이미지/비디오 섹션
  - 사이드바 미디어 파일 개수 표시

### 6. 미디어 표시 개선 ✅
- **기능**: 파일명 제거, 이미지 클릭 시 확대 보기
- **파일**: `src/components/SimpleMarkdownRenderer.js`
- **구현 내용**:
  - 이미지/비디오 하단 파일명 제거
  - 이미지 클릭 시 전체 화면 모달 표시
  - 라이트박스 스타일 구현

## 현재 상태

### 작동하는 기능
1. ✅ 콘텐츠 생성/수정/삭제
2. ✅ 미디어 파일 업로드 (이미지/비디오)
3. ✅ 본문 내 미디어 태그 렌더링
4. ✅ 이미지 확대 보기
5. ✅ 사용자 권한 관리
6. ✅ 카테고리별 분류
7. ✅ 마크다운 지원

### 사용 방법
- **미디어 태그**: `[image:파일명.jpg]`, `[video:파일명.mp4]`
- **이미지 확대**: 이미지 클릭
- **서비스 실행**: `./start-dev.sh`

## 다음 개발 예정 사항

### 우선순위 높음
1. **백엔드 통합**: DynamoDB 연동, Lambda API 구현
2. **검색 기능**: 전체 텍스트 검색, 태그 검색
3. **사용자 프로필**: 프로필 페이지, 활동 내역

### 우선순위 중간
1. **댓글 시스템**: 콘텐츠별 댓글 기능
2. **평가 시스템**: 좋아요, 별점 기능
3. **알림 시스템**: 새 콘텐츠, 댓글 알림

### 우선순위 낮음
1. **분석 기능**: 조회수, 인기 콘텐츠 분석
2. **소셜 기능**: 공유, 북마크
3. **모바일 앱**: React Native 구현

## 주요 파일 구조

```
src/
├── components/
│   ├── SimpleMarkdownRenderer.js  # 미디어 태그 렌더링
│   └── MediaGallery.js           # (제거됨)
├── pages/
│   ├── ContentDetailPage.js      # 콘텐츠 상세 페이지
│   ├── ContentEditPage.js        # 콘텐츠 수정 페이지
│   └── ContentUploadPage.js      # 콘텐츠 업로드 페이지
├── context/
│   ├── ContentContext.js         # 콘텐츠 상태 관리
│   └── AuthContext.js           # 인증 상태 관리
└── utils/
    ├── amplifyConfig.js          # 파일 업로드 처리
    └── s3Upload.js              # S3 업로드 유틸
```

## 개발 환경 설정

### 필수 요구사항
- Node.js (v14 이상)
- npm 또는 yarn
- AWS 계정 및 S3 버킷 설정

### 환경 변수 (.env)
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=aws-demo-factory
```

### 실행 명령어
```bash
# 개발 서버 시작
./start-dev.sh

# 또는
npm install
npm start
```

## 문제 해결 가이드

### 자주 발생하는 문제
1. **무한 리렌더링**: useCallback 사용으로 해결됨
2. **CORS 에러**: 폰트 문제는 해결됨, S3 설정 확인 필요
3. **localStorage 용량 초과**: 파일 크기 제한으로 해결됨
4. **이미지 로드 실패**: blob URL 또는 data URL 확인

### 디버깅 팁
- 브라우저 콘솔에서 `[SimpleMarkdownRenderer]` 로그 확인
- localStorage 용량: 개발자 도구 > Application > Storage
- 네트워크 탭에서 파일 로드 상태 확인

## 연락처
- 프로젝트 관련 문의: janghwan@amazon.com
- GitHub: (저장소 URL 추가 필요)

---
**마지막 업데이트**: 2025-06-13
**버전**: v1.0-beta
