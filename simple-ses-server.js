const http = require('http');
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS SES 설정
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

console.log('AWS SES Configuration:');
console.log('Region:', process.env.AWS_REGION);
console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'Not set');

const server = http.createServer(async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // OPTIONS 요청 처리 (Preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /api/test
  if (req.method === 'GET' && req.url === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'success',
      message: 'Simple SES Server is working!',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // POST /api/send-inquiry
  if (req.method === 'POST' && req.url === '/api/send-inquiry') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const formData = JSON.parse(body);
        const { name, email, company, inquiryType, subject, message } = formData;

        console.log('Received inquiry:', { name, email, subject });

        // 입력 검증
        if (!name || !email || !subject || !message) {
          res.writeHead(400);
          res.end(JSON.stringify({
            status: 'error',
            message: '필수 항목이 누락되었습니다.'
          }));
          return;
        }

        // 문의 유형 한글 변환
        const inquiryTypeMap = {
          'technical': '기술 문의',
          'pricing': '가격 문의',
          'demo': '데모 요청',
          'partnership': '파트너십 문의',
          'other': '기타'
        };

        const inquiryTypeKorean = inquiryTypeMap[inquiryType] || inquiryType || '미지정';

        // HTML 이메일 템플릿
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #232F3E; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">AWS Demo Factory - 지원 문의</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p style="font-size: 16px; color: #333;">새로운 지원 문의가 접수되었습니다.</p>
              
              <table style="width: 100%; border-collapse: collapse; background-color: white; margin: 20px 0;">
                <tr style="background-color: #f1f1f1;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 30%;">항목</td>
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">내용</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">이름</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">이메일</td>
                  <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">회사명</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${company || '미입력'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">문의 유형</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${inquiryTypeKorean}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">제목</td>
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; vertical-align: top;">문의 내용</td>
                  <td style="padding: 12px; border: 1px solid #ddd; white-space: pre-wrap;">${message}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">접수 시간</td>
                  <td style="padding: 12px; border: 1px solid #ddd;">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                </tr>
              </table>
            </div>
          </div>
        `;

        // AWS SES 이메일 파라미터
        const params = {
          Source: 'janghwan@amazon.com',
          Destination: {
            ToAddresses: ['janghwan@amazon.com']
          },
          Message: {
            Subject: {
              Data: `[AWS Demo Factory] ${inquiryTypeKorean} - ${subject}`,
              Charset: 'UTF-8'
            },
            Body: {
              Html: {
                Data: htmlContent,
                Charset: 'UTF-8'
              }
            }
          },
          ReplyToAddresses: [email]
        };

        console.log('Sending email with SES...');

        // AWS SES로 이메일 발송
        const result = await ses.sendEmail(params).promise();
        
        console.log('Email sent successfully:', result.MessageId);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          message: '문의가 성공적으로 전송되었습니다.',
          messageId: result.MessageId
        }));

      } catch (error) {
        console.error('Error:', error);
        
        let errorMessage = '메일 발송 중 오류가 발생했습니다.';
        
        if (error.code === 'MessageRejected') {
          errorMessage = '이메일 주소가 확인되지 않았습니다. 관리자에게 문의하세요.';
        }

        res.writeHead(500);
        res.end(JSON.stringify({
          status: 'error',
          message: errorMessage,
          error: error.message
        }));
      }
    });
    return;
  }

  // 404 Not Found
  res.writeHead(404);
  res.end(JSON.stringify({
    status: 'error',
    message: 'Not Found'
  }));
});

const port = 5003;
server.listen(port, () => {
  console.log(`Simple SES server is running on port ${port}`);
});
