# AIMLAB_Multimodal_Dataset
옴니시엔에스와의 멀티모달 데이터셋 데이터통신을 위한 API

## 프로젝트 구조

```
multimodal/                 
├── node_modules/            # 설치된 라이브러리 폴더
├── routes/                  # API 라우터
│   ├── upload.js            # 멀티미디어 파일 업로드 처리
│   └── user.js              # 유저 메타데이터(JSON) 기록 처리
├── uploads/                 # 파일 저장소
│   └── user001/             # (예시) 유저별로 생성된 데이터 폴더
├── .env                     # 환경 변수 (IP, 포트 등 비밀 설정값)
├── .gitignore               
├── config.js                # 설정 제어판 (.env 값을 불러와서 관리)
├── package.json             # 프로젝트 정보 및 설치된 라이브러리 목록
├── package-lock.json        # 라이브러리 버전 잠금 파일
└── server.js                # 서버 본체
```

## 데이터베이스 스키마

데이터베이스 스키마는 `multimodal/` 폴더에 정의되어 있음:

- `server.js` - 턴 별 영상, 음성, 발화 전달하는 엔드포인트
- `config.js` - 환경 변수 및 공통 설정 관리
- `user.js` - 유저 메타데이터 업로드하는 엔드포인트
- `upload.js` - 멀티미디어 파일 업로드


## 설치 및 실행

### 설치

```bash
git clone https://github.com/gony-ryu/AIMLAB_Multimodal_API_Server.git
# 가상환경 설치
$ conda create -n Server(이름은 아무거나 상관 없습니다)
# 만약 섞여도 상관 없다면 가상환경은 설치 안해도 상관 없습니다)
$ conda install -c conda-forge nodejs=18

```

### Multimodal API 서버 설정

`multimodal/.env` 파일을 생성하고 다음 항목 작성:

```dotenv
# 서버 설정
PORT=3333 #필요에따라 변경
NODE_ENV=development

# URL 설정
BASE_URL=http://115.145.18.221:3333 #사용자 필요에 따라 변경
HOST=0.0.0.0 #사용자 필요에 따라 변경

# 파일 업로드 설정
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600

# 로깅 설정
LOG_LEVEL=info

```

### 실행

```bash

# 서버 터미널 : API 서버 실행
cd multimodal
conda activate server
node server.js

# 키오스크 로컬 터미널
#예시
curl -X POST http://115.145.18.221:3333/api/user \ #상황에 맞게 ip 및 포트를 수정합니다.
  -H "X-User-ID: user001" \
  -F "metadata=@user001_metadata.json" 

curl -X POST http://115.145.18.221:3333/api/upload \
  -H "X-User-ID: user001" \
  -H "X-Session-ID: session001" \
  -H "X-Turn-ID: turn001" \
  -F "video=@video_user001_session001_turn001.mp4" \
  -F "audio=@audio_user001_session001_turn001.mp3" \
  -F "utterance=@utterance_user001_session001_turn001.json"
```

## 주의사항
- API를 실행 중이어야 키오스크에서 전송이 가능합니다.
- 코드 수정 없이 .env만 생성 후 수정하면 됩니다.
- 이때 Multimodal API 서버 설정 내용에서 IP 및 Port만 변경하면 됩니다.
