# 빠른 시작

Inbound Stay Ops Kit은 외국인 게스트를 자주 받는 숙소 호스트를 위한 다국어 게스트 안내 키트입니다.

## 먼저 알아둘 점

Airbnb 숙소라면 외부 가이드 링크를 Airbnb 숙소 설명이나 Airbnb 메시지에 넣지 마세요. 이 키트는 Airbnb 내용을 번역해 Airbnb 안에 다시 붙여넣거나, 숙소 내부 QR처럼 선택적 안내 자료로 쓰는 방향이 안전합니다.

## 5분 흐름

1. 로컬 서버에서 `host-setup.html`을 엽니다.
2. 숙소명, 위치, 지원 언어를 입력합니다.
3. Airbnb 또는 숙소 플랫폼 설명을 호스트가 직접 붙여넣습니다.
4. 생성된 Codex / Hermes 프롬프트를 복사합니다.
5. Codex 또는 Hermes에게 `config.json` 생성을 요청합니다.
6. `approvedStayGuide`를 호스트가 검토합니다.
7. `index.html?lang=ko`, `index.html?lang=en`, `index.html?lang=ja`로 확인합니다.

## 명령

```bash
npm test
```

Telegram dry-run:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
```

## 샘플

```bash
cp samples/seoul-guesthouse.config.json config.json
```

## 유료/커스텀 범위

Kakao, LINE, WhatsApp 자동 연동, 숙소별 설치 대행, 가격진단 리포트는 무료 오픈소스 범위가 아닙니다.

