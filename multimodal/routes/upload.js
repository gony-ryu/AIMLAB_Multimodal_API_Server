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
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 3 // 최대 3개 파일 (video, audio, utterance)
  },
  fileFilter: (req, file, cb) => {
    // 파일 확장자 검증
    const allowedExtensions = {
      video: ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
      audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
      utterance: ['.json']
    };
    
    const ext = path.extname(file.originalname).toLowerCase();
    const fieldName = file.fieldname;
    
    if (allowedExtensions[fieldName] && allowedExtensions[fieldName].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${fieldName}. Allowed: ${allowedExtensions[fieldName].join(', ')}`), false);
    }
  }
});

// POST /api/upload - 멀티미디어 데이터 업로드
router.post('/', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'utterance', maxCount: 1 }
]), async (req, res) => {
  try {
    // 헤더에서 ID들 가져오기
    const user_id = req.headers['x-user-id'] || req.headers['X-User-ID'];
    const session_id = req.headers['x-session-id'] || req.headers['X-Session-ID'];
    const turn_id = req.headers['x-turn-id'] || req.headers['X-Turn-ID'];
    const files = req.files;
    
    // 필수 파라미터 검증
    if (!user_id || !session_id || !turn_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'X-User-ID, X-Session-ID, X-Turn-ID headers are required'
      });
    }
    
    // 턴 디렉토리 생성: uploads/user_id/session_id/turn_id/
    const turnDir = path.join(__dirname, '../uploads', user_id, session_id, turn_id);
    await fs.ensureDir(turnDir);
    
    const uploadedFiles = {};
    
    // MIME 타입 결정 함수
    const getMimeType = (ext) => {
      const mimeTypes = {
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.json': 'application/json'
      };
      return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
    };
    
    // 비디오 파일 처리
    if (files.video && files.video[0]) {
      const videoFile = files.video[0];
      const videoFilename = videoFile.originalname;
      const videoPath = path.join(turnDir, videoFilename);
      
      await fs.writeFile(videoPath, videoFile.buffer);
      uploadedFiles.video = {
        filename: videoFilename,
        originalName: videoFile.originalname,
        size: videoFile.size,
        path: videoPath
      };
    }
    
    // 오디오 파일 처리
    if (files.audio && files.audio[0]) {
      const audioFile = files.audio[0];
      const audioFilename = audioFile.originalname;
      const audioPath = path.join(turnDir, audioFilename);
      
      await fs.writeFile(audioPath, audioFile.buffer);
      uploadedFiles.audio = {
        filename: audioFilename,
        originalName: audioFile.originalname,
        size: audioFile.size,
        path: audioPath
      };
    }
    
    // 텍스트 파일 처리 (utterance)
    if (files.utterance && files.utterance[0]) {
      const utteranceFile = files.utterance[0];
      const utteranceFilename = utteranceFile.originalname;
      const utterancePath = path.join(turnDir, utteranceFilename);
      
      await fs.writeFile(utterancePath, utteranceFile.buffer);
      uploadedFiles.utterance = {
        filename: utteranceFilename,
        originalName: utteranceFile.originalname,
        size: utteranceFile.size,
        path: utterancePath
      };
    }
    
    // 응답
    res.status(201).json({
      success: true,
      message: 'Files uploaded successfully',
      data: {
        user_id,
        session_id,
        turn_id,
        timestamp: new Date().toISOString(),
        uploaded_files: uploadedFiles,
        file_count: Object.keys(uploadedFiles).length,
        total_size: Object.values(uploadedFiles).reduce((sum, file) => sum + file.size, 0),
        turn_dir: turnDir
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Multer 에러 처리
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Maximum file size is 100MB'
      });
    }
    
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

module.exports = router;