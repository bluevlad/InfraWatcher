# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 도메인/URL/포트 규칙: [DOMAIN_MANAGEMENT.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/infrastructure/DOMAIN_MANAGEMENT.md) — `https://도메인:포트` 사용 금지

## 실행 환경 감지 (SSH 재접속 금지)

- Claude는 현재 호스트에서 직접 실행 중 — **SSH 재접속을 시도하지 말 것**
- `uname -s` = `Darwin` → MacBook 운영환경 (172.30.1.72), docker/docker compose 직접 실행 가능
- `uname -s` 결과가 Windows/MINGW/MSYS → Windows 개발환경 (172.30.1.100)
- Docker 명령은 현재 호스트에서 바로 실행 (별도 SSH 접속 불필요)
- compose 파일 선택: Darwin → `docker-compose.yml` / Windows → `docker-compose.local.yml`

## Project Overview

InfraWatcher - Docker 컨테이너 모니터링 및 인프라 상태 대시보드

## Environment

- **Backend**: Python 3.11+ / FastAPI 0.115 / Uvicorn (포트 9090)
- **Frontend**: React 18 / TypeScript / Vite 5 / Ant Design 5 (포트 4090)
- **Database**: SQLite / aiosqlite (WAL 모드)
- **Target Server**: MacBook Docker (172.30.1.72) / Windows 로컬 개발

## Git Workflow (필수)

> 표준: [FEATURE_BRANCH_LIFECYCLE.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/git/FEATURE_BRANCH_LIFECYCLE.md) · [MAIN_PROD_WORKFLOW.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/git/MAIN_PROD_WORKFLOW.md) · [BRANCH_CONVENTION.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/git/BRANCH_CONVENTION.md) · [COMMIT_CONVENTION.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/git/COMMIT_CONVENTION.md)
> InfraWatcher는 **`main` SSoT + `prod` 배포 트리거** 모델을 사용 (서비스 repo 라이프사이클 적용 대상)

### 5단계 라이프사이클 (코드 변경 동반 작업 시 필수)

| 단계 | 명령 | 트리거 |
|------|------|--------|
| **1. main 동기화** | `git fetch origin && git switch main && git pull --ff-only origin main` | 작업 시작 시 |
| **2. 작업 브랜치 생성** | `git switch -c <type>/<scope>` (베이스는 항상 main) | 구현 시작 시 |
| **3. 구현 & main 머지** | 작업 브랜치 commit → `git switch main && git merge --squash <branch> && git commit && git push origin main` | 구현 완료 시 |
| **4. prod 머지 & 배포 검증** | `git switch prod && git pull --rebase origin prod && git merge main && git push origin prod` → `gh run watch` | "prod 반영"·"docker 재빌드"·"배포해줘" 요청 시 |
| **5. 브랜치 정리** | `git switch main && git pull --ff-only origin main && git branch -D <branch> && git push origin --delete <branch>` | 배포 검증 성공 후 |

### 브랜치 네이밍 — `<type>/<scope>`

- type: `feat/` `fix/` `refactor/` `docs/` `chore/` `hotfix/`
- scope: 영문 소문자·하이픈, 30자 이내 (예: `feat/realtime-ws-reconnect`, `fix/healthcheck-timeout`)

### Commit 메시지 — Conventional Commits

- 형식: `<type>(<scope>): <subject>` (subject 50자 이내, 명령형, 마침표 X)
- 예: `feat(api): add container restart endpoint`, `fix(scheduler): resolve health check race`

### Claude 동작 기준

| 사용자 발화 | Claude 동작 |
|-------------|-------------|
| "X 구현/수정해줘" (코드 변경 동반) | §1 → §2 (브랜치 생성) → §3 (main 머지) — **§4 prod 머지는 별도 요청 전까지 대기** |
| 단일 파일 오타·주석·설정값 1토글 | 브랜치 생략 가능 (사용자 의도 확인 권장) |
| "prod 반영"·"docker 재빌드"·"배포해줘" | §4 (prod 머지+`gh run watch` 검증) → §5 (정리) |
| "장애 났어, 빨리" | hotfix 경로: `prod`에서 `hotfix/<scope>` 분기 → prod merge → 자동 환류 대기 |

### 작업 시작 전 필수 점검

```bash
git rev-parse --abbrev-ref HEAD    # 현재 브랜치
git status --short                  # 미커밋 변경
git log --oneline -3                # 최근 컨텍스트
```

- 현재 브랜치가 `main`이 아니면 → 의도 확인 후 §1로 정렬
- 잔재 작업 브랜치(머지 후 미삭제) 발견 시 → 정리 제안

### 금지 패턴

- ❌ `prod`에서 직접 작업·commit (hotfix 외)
- ❌ 작업 브랜치 베이스를 `prod`로 잡기
- ❌ §4 배포 검증(`gh run watch` 또는 `gh run list --branch prod`) 누락 후 §5 정리
- ❌ 미머지 브랜치 `-D` 강제 삭제 (squash merge 후는 정상)

## Help Page 관리

> 작성 표준: [HELP_PAGE_GUIDE.md](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/documentation/HELP_PAGE_GUIDE.md)
> HTML 템플릿: [help-page-template.html](https://github.com/bluevlad/Claude-Opus-bluevlad/blob/main/standards/documentation/templates/help-page-template.html)

- **기능 추가/변경/삭제 시 반드시 헬프 페이지도 함께 업데이트**
- 헬프 파일 위치: `frontend/public/help/`
- 서비스 accent-color: `#06b6d4` (Cyan)
- 대상 가이드 파일:
  - `user-guide.html` — 대시보드 사용 가이드
  - `api-guide.html` — API 문서 가이드

## Do NOT

- .env 파일 커밋 금지
- 운영 Docker 컨테이너 직접 조작 금지
- 서버 주소, 비밀번호 추측 금지 — 반드시 확인 후 사용
