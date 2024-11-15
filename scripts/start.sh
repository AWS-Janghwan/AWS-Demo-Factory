#!/bin/bash

# 애플리케이션 디렉토리로 이동
cd /data/AWS-Demo-Factory



# React 앱 시작
pm2 start ./node_modules/react-scripts/scripts/start.js --name "demo-factory" --watch

pm2 restart

# 기존 서버 stop(kill)
# lsof -i | grep node |kill -9 `awk '{print $2}'`

# nohup npm run start & 
# sleep 10
# echo "Deployment completed successfully."


# if [ "$NODE_ENV" == "production" ]; then
#     npm run start
# else
#     npm run dev
# fi