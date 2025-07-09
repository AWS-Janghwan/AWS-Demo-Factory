const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = 5002;

// CORS 설정 개선
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 미들웨어 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Preflight 요청 처리
app.options('*', cors());

console.log('Starting AWS SES server...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- AWS_REGION:', process.env.AWS_REGION);
console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set (' + process.env.AWS_ACCESS_KEY_ID.substring(0, 8) + '...)' : 'Not set');

// AWS SES 설정
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// 간단한 테스트 API 추가
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'SES Server is working!',
    timestamp: new Date().toISOString()
  });
});

// 메일 발송 API (AWS SES 사용)
app.post('/api/send-inquiry', async (req, res) => {
  try {
    const { name, email, company, inquiryType, subject, message } = req.body;

    console.log('Received inquiry request:', { name, email, company, inquiryType, subject });

    // 입력 검증
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목이 누락되었습니다.'
      });
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

    // HTML 이메일 템플릿 (표 형식)
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
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1976D2;">
              <strong>답변 방법:</strong> 위 이메일 주소로 직접 답변하시면 됩니다.
            </p>
          </div>
        </div>
        
        <div style="background-color: #232F3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">AWS Demo Factory | Powered by Amazon Web Services</p>
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

답변은 위 이메일 주소로 직접 보내주시면 됩니다.
    `;

    // AWS SES 이메일 파라미터
    const params = {
      Source: 'janghwan@amazon.com', // 인증된 이메일 주소 사용
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
      ReplyToAddresses: [email]
    };

    console.log('Sending email with SES...');

    // AWS SES로 이메일 발송
    const result = await ses.sendEmail(params).promise();
    
    console.log('Email sent successfully:', result.MessageId);

    res.json({
      status: 'success',
      message: '문의가 성공적으로 전송되었습니다.',
      messageId: result.MessageId
    });

  } catch (error) {
    console.error('AWS SES Email sending error:', error);
    
    // AWS SES 특정 에러 처리
    let errorMessage = '메일 발송 중 오류가 발생했습니다.';
    
    if (error.code === 'MessageRejected') {
      errorMessage = '이메일 주소가 확인되지 않았습니다. 관리자에게 문의하세요.';
    } else if (error.code === 'SendingPausedException') {
      errorMessage = '메일 발송이 일시 중단되었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'MailFromDomainNotVerifiedException') {
      errorMessage = '발신 도메인이 확인되지 않았습니다. 관리자에게 문의하세요.';
    } else if (error.code === 'ConfigurationSetDoesNotExistException') {
      errorMessage = 'SES 구성 오류입니다. 관리자에게 문의하세요.';
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
      error: error.message,
      code: error.code
    });
  }
});

// 헬스 체크 API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AWS Demo Factory SES Server',
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(port, () => {
  console.log(`SES server is running on port ${port}`);
  console.log('Environment variables loaded:');
  console.log('- AWS_REGION:', process.env.AWS_REGION);
  console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
  console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
});
