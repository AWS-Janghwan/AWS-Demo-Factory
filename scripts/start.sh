#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory


# 서버 시작
lsof -i | grep node |kill -9 `awk '{print $2}'`
nohup npm run start & 
sleep 10
echo "Deployment completed successfully."

# if [ "$NODE_ENV" == "production" ]; then
#     npm run start
# else
#     npm run dev
# fi