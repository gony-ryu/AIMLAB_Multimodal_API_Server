// config.js
require('dotenv').config();
const path = require('path');

const config = {
  // 서버 실행 설정
  server: {
    port: parseInt(process.env.PORT) || 3333,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // 외부 노출 주소 (.env의 BASE_URL 사용)
  public: {
    // BASE_URL이 없으면 로컬호스트를 기본값으로 사용
    url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3333}`
  },

  // 파일 업로드 설정
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    // 절대 경로 변환
    absoluteDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024
  },

  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

module.exports = config;