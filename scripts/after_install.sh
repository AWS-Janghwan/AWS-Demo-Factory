#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

# 환경 변수 파일 설정
if [ "$DEPLOYMENT_GROUP_NAME" == "prod" ]; then
    cp .env.production .env
else
    cp .env.development .env
fi

# npm 패키지 설치
npm install

# 리액트 앱 빌드
npm run build

# 권한 재설정
sudo chown -R ec2-user:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 755 /data/AWS-Demo-Factory

# 기존에 실행 중인 PM2 프로세스 확인 및 중지
if pm2 list | grep -q "react-app"; then
    pm2 stop react-app
    pm2 delete react-app
fi

# PM2로 서버 시작
pm2 start npm --name "react-app" -- start

# PM2 startup script 생성 및 저장
sudo pm2 startup
pm2 save

# nginx 설정이 있다면 재시작
if systemctl is-active --quiet nginx; then
    sudo systemctl restart nginx
fi

echo "Deployment completed successfully"