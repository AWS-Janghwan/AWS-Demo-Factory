#!/bin/bash

echo "🔍 AWS Demo Factory 보안 검사 시작..."
echo "=================================================="

# 현재 디렉토리 확인
PROJECT_DIR=$(pwd)
echo "📁 프로젝트 디렉토리: $PROJECT_DIR"
echo ""

# 1. 하드코딩된 AWS 자격 증명 검사
echo "🔐 1. 하드코딩된 AWS 자격 증명 검사"
echo "--------------------------------------------------"

# AWS Access Key 패턴 검사
echo "🔍 AWS Access Key 패턴 검사 중..."
AKIA_RESULTS=$(grep -r "AKIA[0-9A-Z]\{16\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=build --exclude-dir=venv 2>/dev/null || true)
if [ -n "$AKIA_RESULTS" ]; then
    echo "❌ 하드코딩된 AWS Access Key 발견:"
    echo "$AKIA_RESULTS"
else
    echo "✅ 하드코딩된 AWS Access Key 없음"
fi

# AWS Secret Key 패턴 검사
echo "🔍 AWS Secret Key 패턴 검사 중..."
SECRET_RESULTS=$(grep -r "[A-Za-z0-9/+=]\{40\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=build --exclude-dir=venv --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test\|example\|placeholder" || true)
if [ -n "$SECRET_RESULTS" ]; then
    echo "⚠️ 의심스러운 Secret Key 패턴 발견 (수동 확인 필요):"
    echo "$SECRET_RESULTS" | head -5
else
    echo "✅ 의심스러운 Secret Key 패턴 없음"
fi

echo ""

# 2. 환경 변수 노출 검사
echo "🌍 2. 환경 변수 노출 검사"
echo "--------------------------------------------------"

ENV_VARS=$(grep -r "process\.env\." . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=build --exclude-dir=venv --include="*.js" --include="*.jsx" 2>/dev/null | grep -E "(ACCESS_KEY|SECRET_KEY|PASSWORD|TOKEN)" || true)
if [ -n "$ENV_VARS" ]; then
    echo "⚠️ 민감한 환경 변수 사용 발견:"
    echo "$ENV_VARS"
else
    echo "✅ 민감한 환경 변수 직접 사용 없음"
fi

echo ""

# 3. .env 파일 보안 검사
echo "📄 3. .env 파일 보안 검사"
echo "--------------------------------------------------"

if [ -f ".env" ]; then
    echo "🔍 .env 파일 검사 중..."
    
    # 실제 자격 증명 값 검사
    if grep -q "AKIA[0-9A-Z]\{16\}" .env 2>/dev/null; then
        echo "❌ .env 파일에 실제 AWS Access Key 발견!"
    else
        echo "✅ .env 파일에 실제 AWS Access Key 없음"
    fi
    
    # 빈 값이 아닌 SECRET_ACCESS_KEY 검사
    if grep -q "SECRET_ACCESS_KEY=.\+" .env 2>/dev/null; then
        echo "⚠️ .env 파일에 SECRET_ACCESS_KEY 값이 설정되어 있음"
    else
        echo "✅ .env 파일에 SECRET_ACCESS_KEY 값 없음"
    fi
else
    echo "✅ .env 파일 없음"
fi

echo ""

# 4. 로그 파일 민감 정보 검사
echo "📋 4. 로그 파일 민감 정보 검사"
echo "--------------------------------------------------"

LOG_FILES=$(find . -name "*.log" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./build/*" 2>/dev/null || true)
if [ -n "$LOG_FILES" ]; then
    echo "🔍 로그 파일에서 민감 정보 검사 중..."
    for log_file in $LOG_FILES; do
        if grep -q -E "(AKIA|password|secret|token)" "$log_file" 2>/dev/null; then
            echo "⚠️ $log_file 에서 민감한 정보 발견 가능성"
        fi
    done
    echo "✅ 로그 파일 검사 완료"
else
    echo "✅ 로그 파일 없음"
fi

echo ""

# 5. 백업 및 임시 파일 검사
echo "🗂️ 5. 백업 및 임시 파일 검사"
echo "--------------------------------------------------"

BACKUP_FILES=$(find . -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*.tmp" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null || true)
if [ -n "$BACKUP_FILES" ]; then
    echo "⚠️ 백업/임시 파일 발견:"
    echo "$BACKUP_FILES"
    echo "💡 이 파일들을 검토하고 민감한 정보가 있다면 삭제하세요."
else
    echo "✅ 백업/임시 파일 없음"
fi

echo ""

# 6. 패키지 보안 검사
echo "📦 6. 패키지 보안 검사"
echo "--------------------------------------------------"

if command -v npm >/dev/null 2>&1; then
    echo "🔍 npm audit 실행 중..."
    npm audit --audit-level=high 2>/dev/null || echo "⚠️ npm audit에서 문제 발견됨"
else
    echo "⚠️ npm이 설치되지 않음"
fi

echo ""

# 7. 파일 권한 검사
echo "🔒 7. 파일 권한 검사"
echo "--------------------------------------------------"

echo "🔍 실행 가능한 파일 검사 중..."
EXECUTABLE_FILES=$(find . -type f -perm +111 -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./build/*" -not -path "./venv/*" 2>/dev/null || true)
if [ -n "$EXECUTABLE_FILES" ]; then
    echo "📋 실행 가능한 파일들:"
    echo "$EXECUTABLE_FILES"
else
    echo "✅ 예상치 못한 실행 파일 없음"
fi

echo ""

# 8. Git 보안 검사
echo "🔧 8. Git 보안 검사"
echo "--------------------------------------------------"

if [ -d ".git" ]; then
    echo "🔍 Git 설정 검사 중..."
    
    # .gitignore 검사
    if [ -f ".gitignore" ]; then
        if grep -q "\.env" .gitignore; then
            echo "✅ .env 파일이 .gitignore에 포함됨"
        else
            echo "❌ .env 파일이 .gitignore에 없음!"
        fi
        
        if grep -q "\.log" .gitignore; then
            echo "✅ 로그 파일이 .gitignore에 포함됨"
        else
            echo "⚠️ 로그 파일이 .gitignore에 없음"
        fi
    else
        echo "⚠️ .gitignore 파일이 없음"
    fi
    
    # Git 히스토리에서 민감한 파일 검사
    echo "🔍 Git 히스토리에서 민감한 파일 검사 중..."
    SENSITIVE_IN_HISTORY=$(git log --name-only --pretty=format: | grep -E "\.(env|key|pem|p12|pfx)$" | sort | uniq 2>/dev/null || true)
    if [ -n "$SENSITIVE_IN_HISTORY" ]; then
        echo "⚠️ Git 히스토리에서 민감한 파일 발견:"
        echo "$SENSITIVE_IN_HISTORY"
        echo "💡 git filter-branch를 사용하여 히스토리에서 제거를 고려하세요."
    else
        echo "✅ Git 히스토리에 민감한 파일 없음"
    fi
else
    echo "⚠️ Git 저장소가 아님"
fi

echo ""

# 9. 보안 권장사항
echo "💡 9. 보안 권장사항"
echo "--------------------------------------------------"
echo "✅ 권장사항:"
echo "   1. AWS 자격 증명은 ~/.aws/credentials 파일 사용"
echo "   2. .env 파일에 실제 자격 증명 저장 금지"
echo "   3. 정기적으로 npm audit 실행"
echo "   4. 로그 파일에 민감한 정보 출력 금지"
echo "   5. 백업 파일은 정기적으로 정리"
echo "   6. Git에 민감한 파일 커밋 금지"
echo "   7. 프로덕션 환경에서는 IAM 역할 사용"

echo ""
echo "🎉 보안 검사 완료!"
echo "=================================================="
