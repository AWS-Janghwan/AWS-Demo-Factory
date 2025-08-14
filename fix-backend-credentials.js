const fs = require('fs');

// 백엔드 서버 파일 읽기
let content = fs.readFileSync('backend-api-server.js', 'utf8');

// getLocalCredentials를 getAWSCredentials로 교체
content = content.replace(/getLocalCredentials/g, 'getAWSCredentials');

// 주석도 업데이트
content = content.replace(/로컬 AWS credentials 로드/g, 'AWS credentials 로드');
content = content.replace(/로컬 credentials 사용/g, 'AWS credentials 사용');

// 파일 저장
fs.writeFileSync('backend-api-server.js', content);

console.log('✅ backend-api-server.js에서 getLocalCredentials → getAWSCredentials 교체 완료');

// Bedrock 서버도 동일하게 처리
let bedrockContent = fs.readFileSync('server/bedrock-api.js', 'utf8');
bedrockContent = bedrockContent.replace(/getLocalCredentials/g, 'getAWSCredentials');
bedrockContent = bedrockContent.replace(/로컬 AWS credentials 로드/g, 'AWS credentials 로드');
bedrockContent = bedrockContent.replace(/로컬 credentials 사용/g, 'AWS credentials 사용');
fs.writeFileSync('server/bedrock-api.js', bedrockContent);

console.log('✅ server/bedrock-api.js에서 getLocalCredentials → getAWSCredentials 교체 완료');