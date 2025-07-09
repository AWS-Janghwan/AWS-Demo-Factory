const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// AWS S3 설정
const s3 = new AWS.S3({
  region: 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4'
});

// S3 버킷 이름
const BUCKET_NAME = 'aws-demo-factory';

// S3 버킷 존재 여부 확인
const checkBucketExists = async () => {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log(`S3 bucket '${BUCKET_NAME}' exists and is accessible.`);
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      console.error(`S3 bucket '${BUCKET_NAME}' does not exist.`);
    } else if (error.statusCode === 403) {
      console.error(`Access to S3 bucket '${BUCKET_NAME}' is forbidden.`);
    } else {
      console.error(`Error checking S3 bucket: ${error.message}`);
    }
    return false;
  }
};

// 서버 시작 시 S3 버킷 확인
checkBucketExists().then(exists => {
  if (!exists) {
    console.warn('Using local storage fallback for file uploads.');
  }
});

// Presigned URL 생성 API 엔드포인트
app.post('/api/get-presigned-url', async (req, res) => {
  const { fileName, fileType, folderPath } = req.body;
  
  if (!fileName || !fileType) {
    return res.status(400).json({ error: 'fileName and fileType are required' });
  }
  
  // 파일 확장자 추출
  const fileExtension = path.extname(fileName);
  
  // 고유한 파일 이름 생성
  const uniqueFileName = `${uuidv4()}${fileExtension}`;
  
  // S3 키 생성 (폴더 경로 포함)
  const key = folderPath ? `${folderPath}${uniqueFileName}` : uniqueFileName;
  
  // Presigned URL 생성 파라미터
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    Expires: 60 * 5 // 5분 동안 유효
  };
  
  try {
    // S3 버킷 존재 여부 확인
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      return res.status(503).json({ 
        error: 'S3 bucket is not accessible. Check your AWS credentials and bucket configuration.',
        useLocalFallback: true
      });
    }
    
    // Presigned URL 생성
    const url = s3.getSignedUrl('putObject', params);
    
    // 클라이언트에게 Presigned URL과 파일 URL 반환
    res.json({
      presignedUrl: url,
      fileUrl: `https://${BUCKET_NAME}.s3.${s3.config.region}.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      message: error.message,
      useLocalFallback: true
    });
  }
});

// S3 객체 삭제 API 엔드포인트
app.post('/api/delete-s3-object', async (req, res) => {
  const { key } = req.body;
  
  if (!key) {
    return res.status(400).json({ error: 'Object key is required' });
  }
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };
  
  try {
    // S3 버킷 존재 여부 확인
    const bucketExists = await checkBucketExists();
    if (!bucketExists) {
      return res.status(503).json({ 
        error: 'S3 bucket is not accessible. Check your AWS credentials and bucket configuration.'
      });
    }
    
    await s3.deleteObject(params).promise();
    res.json({ message: 'Object deleted successfully' });
  } catch (error) {
    console.error('Error deleting S3 object:', error);
    res.status(500).json({ error: 'Failed to delete S3 object', message: error.message });
  }
});

// S3 버킷 정보 확인 API 엔드포인트
app.get('/api/check-s3-bucket', async (req, res) => {
  try {
    const bucketExists = await checkBucketExists();
    if (bucketExists) {
      res.json({ 
        status: 'success',
        message: `S3 bucket '${BUCKET_NAME}' exists and is accessible.`,
        bucketName: BUCKET_NAME,
        region: s3.config.region
      });
    } else {
      res.status(404).json({ 
        status: 'error',
        message: `S3 bucket '${BUCKET_NAME}' is not accessible.`
      });
    }
  } catch (error) {
    console.error('Error checking S3 bucket:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to check S3 bucket status',
      error: error.message
    });
  }
});

// 메일 발송 설정 (AWS SES 사용)
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// 메일 발송 API (AWS SES 사용)
app.post('/api/send-inquiry', async (req, res) => {
  try {
    const { name, email, company, inquiryType, subject, message } = req.body;

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
      Source: process.env.SES_FROM_EMAIL || 'noreply@aws-demo-factory.com',
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
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
      error: error.message
    });
  }
});

// 모든 요청을 React 앱으로 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
