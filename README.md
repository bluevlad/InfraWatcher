# InfraWatcher

OrbStack Docker 컨테이너 통합 관제 시스템

## Overview

MacBook OrbStack 환경에서 운영 중인 24개 Docker 컨테이너의 상태, 리소스 사용량, 서비스 헬스체크를 실시간으로 모니터링하는 경량 관제 대시보드입니다.

## Features

- **실시간 컨테이너 모니터링**: Docker SDK를 통한 24개 컨테이너 상태/리소스 수집 (병렬 처리)
- **시스템 메트릭**: CPU, 메모리, 디스크, Load Average 실시간 모니터링
- **서비스 헬스체크**: HTTP/TCP/Docker 방식의 서비스 가용성 점검 (30초 주기)
- **WebSocket 실시간 대시보드**: 10초 간격 자동 갱신, 자동 재연결
- **시계열 데이터 저장**: SQLite WAL 모드로 24시간 메트릭 이력 보관

## Tech Stack

| 레이어 | 기술 |
|--------|------|
| Backend | Python 3.11+ / FastAPI 0.115 |
| Frontend | React 18 / TypeScript / Vite 5 |
| UI | Ant Design 5 |
| 실시간 통신 | WebSocket |
| 컨테이너 모니터링 | Docker SDK (Python) / psutil |
| 헬스체크 | httpx (비동기 HTTP/TCP) |
| 스케줄러 | APScheduler |
| Database | SQLite (aiosqlite, WAL 모드) |
| Deploy | Docker Compose |

## Quick Start

### Docker (권장)

```bash
docker compose up -d
```

- Frontend: http://localhost:4090
- Backend API: http://localhost:9090
- API Docs: http://localhost:9090/docs

### 개발 환경

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 9090 --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
InfraWatcher/
├── backend/               # FastAPI 백엔드
│   ├── app/
│   │   ├── main.py        # FastAPI 엔트리 (lifespan 패턴)
│   │   ├── core/          # 설정, DB, 스케줄러
│   │   ├── api/           # REST 엔드포인트 + WebSocket
│   │   ├── services/      # Docker, 시스템, 헬스체크 서비스
│   │   ├── models/        # Pydantic 스키마, SQLite DDL
│   │   └── data/          # 컨테이너 레지스트리 (24개 정의)
│   └── Dockerfile
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 대시보드 컴포넌트
│   │   ├── hooks/         # WebSocket 커스텀 훅
│   │   ├── services/      # API/WebSocket 클라이언트
│   │   └── pages/         # 대시보드 페이지
│   └── Dockerfile
└── docker-compose.yml
```

## API Endpoints

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 서비스 헬스체크 |
| GET | `/api/containers` | 컨테이너 목록 + 리소스 현황 |
| GET | `/api/system` | 시스템 메트릭 (CPU/메모리/디스크) |
| GET | `/api/healthchecks` | 서비스 헬스체크 결과 |
| WS | `/ws` | 실시간 대시보드 스냅샷 |

## 모니터링 대상 (24개 컨테이너)

| 그룹 | 컨테이너 | 포트 |
|------|----------|------|
| Academy | academy-admin-back-end, academy-user-back-end | 9001, 9002 |
| Academy | academy-admin-frontend, academy-user-frontend | 4001, 4002 |
| AllergyInsight | allergyinsight-backend, frontend, scheduler | 9040, 4040, - |
| CompanyAnalyzer | companyanalyzer-backend, frontend | 9080, 4080 |
| EduFit | edufit-backend, frontend, ai-crawler | 9070, 4070, - |
| Tools | standup-app, newsletterplatform-web, scheduler | 9060, 4050, - |
| HopenVision | hopenvision-api, web, admin | 9050, 4060, 4061 |
| unmong | unmong-main, unmong-gateway | 8888, 80 |
| DB/Infra | postgresql, mongodb, pgadmin, mongo-express | 5432, 27017, 8882, 8881 |

## 데이터 흐름

```
[APScheduler 10초] → Docker Stats (병렬) + psutil
                   → SQLite 저장 → WebSocket 브로드캐스트

[APScheduler 30초] → HTTP/TCP 헬스체크 (비동기 병렬)
                   → SQLite 저장 → WebSocket 브로드캐스트

[Frontend] ← WebSocket (실시간 DashboardSnapshot)
           ← REST API (초기 로드)
```

## License

```
Copyright (c) 2026 운몽시스템즈 (Unmong Systems). All rights reserved.
```
