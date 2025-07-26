const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Static server starting...');
console.log(`📁 Current directory: ${__dirname}`);
console.log(`📁 Build directory: ${path.join(__dirname, 'build')}`);
console.log(`📄 Index.html exists: ${fs.existsSync(path.join(__dirname, 'build', 'index.html'))}`);

// 정적 파일 서빙 (build 폴더)
app.use(express.static(path.join(__dirname, 'build'), {
  index: 'index.html',
  maxAge: '1h'
}));

// React Router를 위한 fallback (모든 경로를 index.html로)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  console.log(`📄 Serving index.html for: ${req.path}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build files not found. Please run npm run build first.');
  }
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('❌ Static server error:', err);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, () => {
  console.log(`✅ Static server running on port ${PORT}`);
  console.log(`🌐 Access your app at: http://localhost:${PORT}`);
});

// 프로세스 종료 처리
process.on('SIGTERM', () => {
  console.log('🛑 Static server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Static server shutting down...');
  server.close(() => {
    process.exit(0);
  });
});