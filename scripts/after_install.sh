#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory

# # npm 패키지 설치
# npm install

# # 리액트 앱 빌드
# npm run build

# 권한 재설정
sudo chown -R ec2-user:ec2-user /data/AWS-Demo-Factory
sudo chmod -R 775 /data/AWS-Demo-Factory

# video 복사
cp -r /data/video/* /data/AWS-Demo-Factory/public/source/video/

echo "Deployment completed successfully"