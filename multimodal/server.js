const config = require('./config'); 
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');

// 라우터 import
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-Session-ID', 'X-Turn-ID']
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 업로드 디렉토리 생성 (config 사용)
fs.ensureDirSync(config.upload.absoluteDir);

// 정적 파일 서빙
app.use('/uploads', express.static(config.upload.absoluteDir));

// API 라우트
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

// 루트 엔드포인트
app.get('/', (req, res) => {
  res.json({
    message: 'Multimedia Upload Server',
    version: '1.0.0',
    config: {
      maxFileSize: '100MB',
      uploadDir: config.upload.dir,
      externalUrl: config.public.getUrl() // config에서 URL 가져옴
    }
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'Maximum file size is 100MB'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(config.server.port, config.server.host, () => {
  console.log(`🚀 Multimedia Upload Server running on port ${config.server.port}`);
  console.log(`📁 Upload directory: ${config.upload.absoluteDir}`);
  
  // 수정된 부분: config.public.url을 바로 출력
  console.log(`🌐 External access: ${config.public.url}`);
  console.log(`🔧 Environment: ${config.server.env}`);
});

module.exports = app;