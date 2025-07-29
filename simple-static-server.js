#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

// MIME 타입 매핑
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// 범용 프록시 함수
const proxyToPort = (req, res, targetPort) => {
  console.log(`🔄 [Proxy] API 요청 프록시: ${req.method} ${req.url} -> :${targetPort}`);
  
  // OPTIONS 요청 직접 처리
  if (req.method === 'OPTIONS') {
    console.log(`✅ [Proxy] OPTIONS 요청 처리: ${req.headers.origin}`);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(200);
    res.end();
    return;
  }
  
  const options = {
    hostname: 'localhost',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`✅ [Proxy] 백엔드 응답: ${proxyRes.statusCode} ${req.url} (port ${targetPort})`);
    
    // CORS 헤더 추가 (백엔드 응답 헤더와 병합)
    const responseHeaders = { ...proxyRes.headers };
    responseHeaders['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
    responseHeaders['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name';
    responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    
    res.writeHead(proxyRes.statusCode, responseHeaders);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error(`❌ [Proxy] 백엔드 API 오류 (${req.url} -> :${targetPort}):`, err.message);
    console.error(`❌ [Proxy] 백엔드 서버 상태 확인 필요: localhost:${targetPort}`);
    
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json');
    
    res.writeHead(500);
    res.end(JSON.stringify({ 
      error: 'Backend API unavailable', 
      details: `Backend server at localhost:${targetPort} is not responding: ${err.message}`,
      url: req.url,
      port: targetPort,
      timestamp: new Date().toISOString(),
      suggestion: `Please check if the server is running on port ${targetPort}`
    }));
  });
  
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
};

// 백엔드 API 프록시 함수 (기존 호환성)
const proxyToBackend = (req, res) => {
  return proxyToPort(req, res, 3001);
};


  
  // 이 부분은 proxyToPort 함수로 대체됨
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} (Origin: ${req.headers.origin || 'none'})`);
  
  // 모든 요청에 기본 CORS 헤더 추가
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name');
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // API 프록시 처리
  if (pathname.startsWith('/api/')) {
    // Bedrock API 프록시 (5001 포트)
    if (pathname.startsWith('/api/bedrock/')) {
      return proxyToPort(req, res, 5001);
    }
    // PDF API 프록시 (5002 포트)
    if (pathname.startsWith('/api/pdf/') || pathname === '/health') {
      return proxyToPort(req, res, 5002);
    }
    // 기본 백엔드 API 프록시 (3001 포트)
    return proxyToBackend(req, res);
  }
  
  // OPTIONS 요청은 이미 위에서 처리됨 (중복 제거)
  
  // 루트 경로는 index.html로 리다이렉트
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  let filePath = path.join(BUILD_DIR, pathname);
  
  // 파일이 존재하지 않으면 index.html로 fallback (React Router 지원)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(BUILD_DIR, 'index.html');
    pathname = '/index.html';
  }
  
  const ext = path.parse(filePath).ext;
  const mimeType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error(`Error reading file ${filePath}:`, err);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600'
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Simple static server running on port ${PORT}`);
  console.log(`📁 Serving files from: ${BUILD_DIR}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
  console.log(`📄 Index.html exists: ${fs.existsSync(path.join(BUILD_DIR, 'index.html'))}`);
});

// 프로세스 종료 처리
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});