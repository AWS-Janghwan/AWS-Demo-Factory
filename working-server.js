const http = require('http');
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS SES 설정
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

console.log('AWS SES Server Starting...');
console.log('Region:', process.env.AWS_REGION);
console.log('Access Key:', process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...' : 'Not set');

const server = http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
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
        
        console.log('문의 접수:', { name, email, company, inquiryType, subject });

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
          'service': '서비스 도입 문의',
          'architecture': '아키텍처 문의',
          'demo': '데모 관련 문의',
          'pricing': '비용 문의',
          'other': '기타'
        };

        const inquiryTypeKorean = inquiryTypeMap[inquiryType] || inquiryType || '미지정';

        // HTML 이메일 템플릿 (표 형식)
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #232F3E; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">AWS Demo Factory - 지원 문의</h1>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">새로운 지원 문의가 접수되었습니다.</p>
              
              <table style="width: 100%; border-collapse: collapse; background-color: white; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr style="background-color: #f1f1f1;">
                  <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold; width: 30%; color: #232F3E;">항목</td>
                  <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold; color: #232F3E;">내용</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">이름</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">이메일</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd;"><a href="mailto:${email}" style="color: #FF9900; text-decoration: none;">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">회사명</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd;">${company || '미입력'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">문의 유형</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd;"><span style="background-color: #FF9900; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${inquiryTypeKorean}</span></td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">제목</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; font-weight: bold; color: #232F3E;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600; vertical-align: top;">문의 내용</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; white-space: pre-wrap; line-height: 1.6;">${message}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: 600;">접수 시간</td>
                  <td style="padding: 12px 15px; border: 1px solid #ddd;">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #FF9900; border-radius: 4px;">
                <p style="margin: 0; color: #232F3E; font-weight: 600;">
                  📧 <strong>답변 방법:</strong> 위 이메일 주소로 직접 답변하시면 됩니다.
                </p>
              </div>
            </div>
            
            <div style="background-color: #232F3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">AWS Demo Factory | Powered by Amazon Web Services</p>
              <p style="margin: 5px 0 0 0; opacity: 0.8;">이 메일은 자동으로 발송되었습니다.</p>
            </div>
          </div>
        `;

        // 텍스트 버전 (HTML을 지원하지 않는 클라이언트용)
        const textContent = `
AWS Demo Factory - 지원 문의

새로운 지원 문의가 접수되었습니다.

=== 문의 정보 ===
이름: ${name}
이메일: ${email}
회사명: ${company || '미입력'}
문의 유형: ${inquiryTypeKorean}
제목: ${subject}
접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

=== 문의 내용 ===
${message}

답변은 위 이메일 주소(${email})로 직접 보내주시면 됩니다.

---
AWS Demo Factory | Powered by Amazon Web Services
이 메일은 자동으로 발송되었습니다.
        `;

        // AWS SES 이메일 파라미터
        const params = {
          Source: 'awsdemofactory@gmail.com', // verified된 발송 이메일 주소
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
              },
              Text: {
                Data: textContent,
                Charset: 'UTF-8'
              }
            }
          },
          ReplyToAddresses: [email] // 답장 시 문의자 이메일로 전송
        };

        console.log('AWS SES로 이메일 발송 중...');

        // AWS SES로 이메일 발송
        const result = await ses.sendEmail(params).promise();
        
        console.log('✅ 이메일 발송 성공:', result.MessageId);

        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'success',
          message: '문의가 성공적으로 전송되었습니다.',
          messageId: result.MessageId
        }));

      } catch (error) {
        console.error('❌ AWS SES 이메일 발송 오류:', error);
        
        // AWS SES 특정 에러 처리
        let errorMessage = '메일 발송 중 오류가 발생했습니다.';
        let statusCode = 500;
        
        if (error.code === 'MessageRejected') {
          errorMessage = '이메일 주소가 AWS SES에서 인증되지 않았습니다. 관리자에게 문의하세요.';
          statusCode = 400;
        } else if (error.code === 'SendingPausedException') {
          errorMessage = '메일 발송이 일시 중단되었습니다. 잠시 후 다시 시도해주세요.';
          statusCode = 503;
        } else if (error.code === 'MailFromDomainNotVerifiedException') {
          errorMessage = '발신 도메인이 AWS SES에서 확인되지 않았습니다.';
          statusCode = 400;
        } else if (error.code === 'ConfigurationSetDoesNotExistException') {
          errorMessage = 'AWS SES 구성 오류입니다. 관리자에게 문의하세요.';
          statusCode = 500;
        } else if (error.code === 'InvalidParameterValue') {
          errorMessage = '잘못된 이메일 주소 형식입니다.';
          statusCode = 400;
        }

        res.writeHead(statusCode);
        res.end(JSON.stringify({
          status: 'error',
          message: errorMessage,
          error: error.message,
          code: error.code
        }));
      }
    });
    return;
  }

  // GET /api/health - 헬스 체크
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'AWS Demo Factory SES Server',
      timestamp: new Date().toISOString(),
      aws_region: process.env.AWS_REGION,
      ses_configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    }));
    return;
  }

  // 404 Not Found
  res.writeHead(404);
  res.end(JSON.stringify({ 
    status: 'error', 
    message: 'Not Found',
    available_endpoints: ['/api/send-inquiry', '/api/health']
  }));
});

const port = 5004;
server.listen(port, () => {
  console.log(`🚀 AWS SES Server is running on port ${port}`);
  console.log('📧 Email service: AWS SES');
  console.log('🌏 Region:', process.env.AWS_REGION);
  console.log('✅ Server ready to handle inquiries!');
});
