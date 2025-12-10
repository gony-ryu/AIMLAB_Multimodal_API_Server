const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// Multer 설정 - 메모리 저장소 사용
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (JSON 파일이므로 작게 설정)
    files: 1 // 최대 1개 파일
  },
  fileFilter: (req, file, cb) => {
    // JSON 파일만 허용
    if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// POST /api/user - 유저 메타데이터 저장 (JSON 파일 또는 JSON 데이터)
router.post('/', upload.single('metadata'), async (req, res) => {
  try {
    // 헤더에서 user_id 가져오기
    const user_id = req.headers['x-user-id'] || req.headers['X-User-ID'];
    
    // 필수 파라미터 검증
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'X-User-ID header is required'
      });
    }
    
    let userMetadata = {};
    
    // 디버깅: 파일 업로드 상태 확인
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('========================');
    
    // JSON 파일이 업로드된 경우
    if (req.file) {
      try {
        const jsonContent = req.file.buffer.toString('utf8');
        userMetadata = JSON.parse(jsonContent);
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid JSON file',
          message: 'The uploaded file is not a valid JSON file'
        });
      }
    } else {
      // JSON 데이터가 body로 전송된 경우
      const { gender, age, occupation, gad7_result, phq9_result } = req.body;
      userMetadata = {
        gender: gender || null,
        age: age ? parseInt(age) : null,
        occupation: occupation || null,
        gad7_result: gad7_result ? parseInt(gad7_result) : null,
        phq9_result: phq9_result ? parseInt(phq9_result) : null
      };
    }
    
    // 데이터 검증
    const validationErrors = validateUserData(userMetadata);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: validationErrors.join(', ')
      });
    }
    
    // 유저 디렉토리 생성: uploads/user_id/
    const userDir = path.join(__dirname, '../uploads', user_id);
    await fs.ensureDir(userDir);
    
    // 최종 메타데이터 객체 생성
    const finalMetadata = {
      user_id,
      ...userMetadata,
      created_at: new Date().toISOString()
    };
    
    // 파일명 결정 (업로드된 파일이 있으면 원본 파일명 사용, 없으면 기본값)
    let filename = 'user_metadata.json';
    if (req.file && req.file.originalname) {
      filename = req.file.originalname;
    }
    const metadataPath = path.join(userDir, filename);
    await fs.writeFile(metadataPath, JSON.stringify(finalMetadata, null, 2));
    
    res.status(201).json({
      success: true,
      message: 'User metadata saved successfully',
      data: {
        user_id,
        metadata_path: metadataPath,
        created_at: finalMetadata.created_at,
        source: req.file ? 'file' : 'json_data'
      }
    });
    
  } catch (error) {
    console.error('User metadata save error:', error);
    
    // Multer 에러 처리
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    
    if (error.message && error.message.includes('Only JSON files are allowed')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JSON files are allowed'
      });
    }
    
    res.status(500).json({
      error: 'Failed to save user metadata',
      message: error.message
    });
  }
});

// 데이터 검증 함수
const validateUserData = (data) => {
  const errors = [];
  
  if (data.age && (isNaN(data.age) || data.age < 0 || data.age > 150)) {
    errors.push('Invalid age (must be between 0-150)');
  }
  
  if (data.gad7_result && (isNaN(data.gad7_result) || data.gad7_result < 0 || data.gad7_result > 21)) {
    errors.push('Invalid GAD-7 result (must be between 0-21)');
  }
  
  if (data.phq9_result && (isNaN(data.phq9_result) || data.phq9_result < 0 || data.phq9_result > 27)) {
    errors.push('Invalid PHQ-9 result (must be between 0-27)');
  }
  
  return errors;
};

module.exports = router;
