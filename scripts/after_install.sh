#!/bin/bash

echo "🚀 [$(date)] 배포 시작 - AfterInstall 단계"

# 필요 패키지 설치
#yum -y install nfs-utils
#yum -y install nfs-utils nfs4-acl-tools

# EFS 사용 환경 설정
#mkdir /data
#echo "/data *(rw,sync,no_root_squash)" >> /etc/exports #172.31 대역의 접근 허용
#systemctl restart nfs-server.service
#systemctl enable nfs-server.service

#mount -t nfs 172.31.2.191:/backup /backup
#echo "172.31.2.191:/backup /data nfs defaults 0 0">>/etc/fstab

# video 복사
#if [ ! -d /data/AWS-Demo-Factory/public/source/movie ]; then
#    mkdir -p /data/AWS-Demo-Factory/public/source/movie
#fi
# mkdir /data/AWS-Demo-Factory/public/source/video
#yes | cp -r /data/video/* /data/AWS-Demo-Factory/public/source/movie/

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

echo "⚙️ [$(date)] 1/6 프로덕션 환경 변수 설정 중..."
# 프로덕션 환경 변수 설정
chmod +x setup-production-env.sh
./setup-production-env.sh
echo "✅ [$(date)] 환경 변수 설정 완료"

echo "🗑️ [$(date)] 2/6 기존 파일 정리 중..."
# node_module 삭제
rm -rf /data/AWS-Demo-Factory/node_modules/
# 기존 빌드 파일 삭제
rm -rf /data/AWS-Demo-Factory/build/
echo "✅ [$(date)] 파일 정리 완료"

echo "📦 [$(date)] 3/6 npm 패키지 설치 중... (예상 시간: 10초)"
# npm 패키지 설치
npm install --force
echo "✅ [$(date)] npm 패키지 설치 완료"

echo "🏗️ [$(date)] 4/6 React 애플리케이션 빌드 중... (예상 시간: 30초)"
# 서버에서 안전한 프로덕션 빌드 생성 (환경 변수 순환 참조 방지)
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
npm run build
echo "✅ [$(date)] React 빌드 완료"

echo "🐍 [$(date)] 5/6 Python 환경 설정 중... (예상 시간: 5분)"
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
pip install -r requirements.txt --quiet

# 원래 디렉토리로 복귀
cd /data/AWS-Demo-Factory
echo "✅ [$(date)] Python 환경 설정 완료"

echo "🔧 [$(date)] 6/6 권한 설정 중..."
# 권한 재설정
#sudo chown -R root:ec2-user /data/AWS-Demo-Factory
#sudo chmod -R 775 /data/AWS-Demo-Factory
echo "✅ [$(date)] 권한 설정 완료"

echo "🎉 [$(date)] 배포 완료 - AfterInstall 단계 성공!"
echo "Deployment completed successfully" 
