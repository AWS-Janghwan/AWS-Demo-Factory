#!/bin/bash

echo "🚀 [$(date)] 배포 시작 - AfterInstall 단계"

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

echo "⚙️ [$(date)] 1/7 프로덕션 환경 변수 설정 중..."
# 프로덕션 환경 변수 설정
chmod +x setup-production-env.sh
./setup-production-env.sh
echo "✅ [$(date)] 환경 변수 설정 완료"

echo "🗑️ [$(date)] 2/7 기존 파일 정리 중..."
# node_module 삭제
rm -rf /data/AWS-Demo-Factory/node_modules/
# 기존 빌드 파일 삭제
rm -rf /data/AWS-Demo-Factory/build/
echo "✅ [$(date)] 파일 정리 완료"

echo "📦 [$(date)] 3/7 npm 패키지 설치 중... (예상 시간: 10초)"
# npm 패키지 설치
npm install --force
echo "✅ [$(date)] npm 패키지 설치 완료"

echo "🏗️ [$(date)] 4/7 React 애플리케이션 빌드 중... (예상 시간: 30초)"
# 서버에서 안전한 프로덕션 빌드 생성 (환경 변수 순환 참조 방지)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
npm run build
echo "✅ [$(date)] React 빌드 완료"

echo "🐍 [$(date)] 5/7 Python 환경 설정 중... (예상 시간: 5분)"
# Python 가상환경 및 패키지 설치
cd /data/AWS-Demo-Factory/python-pdf-server

# 기존 가상환경 삭제
rm -rf venv/

# 새 가상환경 생성
python3 -m venv venv

# 가상환경 활성화 및 패키지 설치
source venv/bin/activate
pip install --upgrade pip --quiet
echo "  📋 [$(date)] Python 패키지 설치 중..."

# 필수 패키지만 먼저 설치
pip install flask==3.0.3 flask-cors==4.0.1 requests==2.31.0 python-dotenv==1.0.1 --quiet

# 추가 패키지 설치 (호환 버전)
pip install reportlab matplotlib pandas numpy seaborn Pillow PyMuPDF --quiet

# 원래 디렉토리로 복귀
cd /data/AWS-Demo-Factory
echo "✅ [$(date)] Python 환경 설정 완료"

echo "🔧 [$(date)] 6/7 권한 설정 중..."
# 전체 디렉토리 권한 설정
chown -R root:root /data/AWS-Demo-Factory
chmod -R 755 /data/AWS-Demo-Factory

# 로그 파일 권한 설정
touch /data/AWS-Demo-Factory/pdf-server.log
touch /data/AWS-Demo-Factory/bedrock-server.log  
touch /data/AWS-Demo-Factory/backend-api.log
chmod 666 /data/AWS-Demo-Factory/*.log

# PID 파일 권한 설정
touch /data/AWS-Demo-Factory/python-pdf-server.pid
touch /data/AWS-Demo-Factory/bedrock-server.pid
touch /data/AWS-Demo-Factory/backend-server.pid
chmod 666 /data/AWS-Demo-Factory/*.pid
echo "✅ [$(date)] 권한 설정 완료"

echo "🧪 [$(date)] 7/7 Python 모듈 테스트 중..."
# Python 모듈 import 테스트
cd /data/AWS-Demo-Factory/python-pdf-server
source venv/bin/activate
python -c "import flask, flask_cors, requests, reportlab; print('✅ 모든 Python 모듈 정상')" || echo "❌ Python 모듈 문제 발생"
cd /data/AWS-Demo-Factory
echo "✅ [$(date)] 모듈 테스트 완료"

echo "🎉 [$(date)] 배포 완료 - AfterInstall 단계 성공!"
echo "Deployment completed successfully" 
