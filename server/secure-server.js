const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const cors = require('cors');

const app = express();

// 보안 헤더 설정
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.aws.amazon.com", "https://*.amazonaws.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate Limiting 설정
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 최대 10 요청 (업로드, 로그인 등)
  message: {
    error: 'Too many attempts from this IP, please try again later.'
  }
});

app.use('/api/', limiter);
app.use('/api/upload', strictLimiter);
app.use('/api/auth', strictLimiter);

// CORS 설정
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// JSON 파싱 제한
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 입력 검증 미들웨어
const validateInput = [
  body('title').trim().isLength({ min: 1, max: 200 }).escape(),
  body('content').trim().isLength({ min: 1, max: 50000 }),
  body('category').trim().isIn(['Manufacturing', 'Retail/CPG', 'Telco/Media', 'Finance', 'Amazon Q Dev']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }
    next();
  }
];

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 프로덕션에서는 상세한 에러 정보 숨기기
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = { app, validateInput };
