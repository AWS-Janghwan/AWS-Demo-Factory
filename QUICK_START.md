# AWS Demo Factory - 빠른 시작 가이드

## 🚀 Amazon Q Developer와 함께 개발 재개하기

### 1. 현재 상황 파악하기

다음 명령어로 현재 프로젝트 상태를 확인하세요:

```bash
# 프로젝트 디렉토리로 이동
cd /Users/janghwan/Test/AWS-Demo-Factory

# 진행 상황 요약 확인
cat PROGRESS_SUMMARY.md

# 기술적 변경사항 확인  
cat TECHNICAL_CHANGELOG.md
```

### 2. Amazon Q Developer에게 상황 설명하기

새로운 Q chat 세션에서 다음과 같이 말하세요:

```
안녕하세요! AWS Demo Factory 프로젝트를 계속 개발하고 싶습니다. 

현재 상황:
- React 기반 AWS 데모 공유 플랫폼
- 콘텐츠 수정, 미디어 태그 렌더링, 이미지 확대 보기 기능 완료
- 진행 상황은 PROGRESS_SUMMARY.md 파일에 정리되어 있습니다

다음 중 어떤 것을 도와드릴까요?
1. 백엔드 API 연동 (DynamoDB, Lambda)
2. 검색 기능 구현
3. 사용자 프로필 기능
4. 댓글 시스템
5. 기타 새로운 기능

현재 디렉토리: /Users/janghwan/Test/AWS-Demo-Factory
```

### 3. 개발 환경 재설정 (필요시)

```bash
# 의존성 재설치
npm install

# 환경 변수 확인
ls -la .env*

# 개발 서버 시작
./start-dev.sh
```

### 4. 백업 및 복원

#### 백업 생성
```bash
# 현재 상태 백업
./backup-project.sh
```

#### 백업에서 복원
```bash
# 백업 디렉토리로 이동
cd backups/aws-demo-factory-backup-YYYYMMDD_HHMMSS/

# 복원 실행
./restore-project.sh
```

## 📋 주요 완료 기능 체크리스트

- ✅ 콘텐츠 CRUD (생성, 읽기, 수정, 삭제)
- ✅ 미디어 파일 업로드 (이미지, 비디오)
- ✅ 본문 내 미디어 태그 렌더링 `[image:파일명]`, `[video:파일명]`
- ✅ 이미지 클릭 시 확대 보기
- ✅ 사용자 권한 관리 (Admin, Content Manager, Associate Member, Viewer)
- ✅ 카테고리별 분류 (Manufacturing, Retail/CPG, Telco/Media, Finance, Amazon Q Dev)
- ✅ 마크다운 지원
- ✅ 반응형 디자인

## 🔧 개발 중 자주 사용하는 명령어

```bash
# 서비스 시작
./start-dev.sh

# 빌드
npm run build

# 백업
./backup-project.sh

# 로그 확인 (브라우저 콘솔)
# [SimpleMarkdownRenderer] 태그로 미디어 렌더링 로그 확인
# [ContentEditPage] 태그로 콘텐츠 수정 로그 확인
```

## 🐛 문제 해결

### 자주 발생하는 문제들

1. **무한 리렌더링**: 이미 해결됨 (useCallback 적용)
2. **이미지 로드 실패**: blob URL 또는 파일 크기 확인
3. **localStorage 용량 초과**: 파일 크기 제한으로 해결됨
4. **CORS 에러**: 폰트 문제는 해결됨

### 디버깅 팁

```bash
# 브라우저 개발자 도구에서 확인할 로그들
🎬 [SimpleMarkdownRenderer] 미디어 태그 처리 시작
🔍 [SimpleMarkdownRenderer] 태그 발견
✅ [SimpleMarkdownRenderer] 파일 매칭 성공
🚀 [ContentEditPage] 폼 제출 시작
```

## 📞 도움 요청하기

Amazon Q Developer에게 도움을 요청할 때 다음 정보를 포함하세요:

1. **현재 작업 중인 기능**: 예) "검색 기능 구현 중"
2. **발생한 문제**: 구체적인 에러 메시지나 현상
3. **관련 파일**: 수정 중인 파일 경로
4. **콘솔 로그**: 브라우저 콘솔의 에러 메시지
5. **기대하는 결과**: 원하는 동작 방식

### 예시 질문

```
AWS Demo Factory 프로젝트에서 검색 기능을 추가하고 싶습니다.

현재 상황:
- 콘텐츠는 ContentContext에서 localStorage로 관리됨
- 제목, 설명, 본문, 태그로 검색하고 싶음
- 검색 결과는 기존 홈페이지 레이아웃과 동일하게 표시

어떻게 구현하면 좋을까요?
```

## 🎯 다음 개발 우선순위

1. **백엔드 연동** (높음)
2. **검색 기능** (높음)  
3. **사용자 프로필** (중간)
4. **댓글 시스템** (중간)
5. **분석 기능** (낮음)

---

**💡 팁**: 이 가이드를 북마크해두고 개발 재개 시 참고하세요!
