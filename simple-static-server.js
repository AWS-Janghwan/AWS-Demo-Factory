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

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
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