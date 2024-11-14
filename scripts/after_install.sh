#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

# # npm 패키지 설치
npm install

# # 리액트 앱 빌드
npm run build

# video 복사
mkdir /data/AWS-Demo-Factory/public/source/video
cp -r /data/video/* /data/AWS-Demo-Factory/public/source/video/

# 권한 재설정
sudo chown -R root:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 775 /data/AWS-Demo-Factory

echo "Deployment completed successfully"