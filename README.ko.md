# Inbound Stay Ops Kit

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

외국인 게스트를 자주 받는 숙소 호스트를 위한 오픈소스 다국어 게스트 도움 키트입니다.

호스트가 승인한 숙소 설명과 하우스룰을 바탕으로, 게스트의 언어에 맞춰 보이는 모바일 안내 페이지를 만들 수 있습니다. 추가 질문은 안전한 에이전트 흐름이나 Telegram 호스트 확인 티켓으로 넘길 수 있습니다.

## 무엇인가요

```text
호스트가 승인한 숙소 정보
-> 번역된 숙소 안내
-> 모바일 게스트 페이지
-> 선택형 Telegram 호스트 확인
```

## 무엇이 아닌가요

- Airbnb 스크래퍼가 아닙니다
- Airbnb inbox 봇이 아닙니다
- 예약, 결제, 환불, 리뷰 자동화 도구가 아닙니다
- Airbnb 게스트를 플랫폼 밖으로 이동시키는 도구가 아닙니다
- Kakao / LINE / WhatsApp 자동화 스타터가 아닙니다

## 무료 오픈소스 범위

- 정적 게스트 도움 페이지
- 호스트가 승인한 Airbnb 또는 예약 플랫폼 텍스트 기반 번역 숙소 안내
- 에이전트와 Telegram bot이 쓰는 내부 FAQ / 답변 뱅크
- Airbnb 또는 다른 예약 플랫폼 링크를 위한 호스트 승인 소스 워크플로
- 차단 질문과 호스트 확인 질문을 위한 안전 규칙
- Telegram Bot adapter
- Local Wi-Fi QR generator without external QR API calls
- Telegram을 통한 호스트 확인 티켓
- 선택형 Hermes Agent 연결 가이드
- Codex 또는 Claude를 쓰는 비개발자용 워크북과 프롬프트

## 유료 / 맞춤 범위

- Kakao 자동 연동
- LINE 자동 연동
- WhatsApp 자동 연동
- 숙소별 맞춤 구현
- 가격진단 리포트

공식 숙소 링크를 수동 참고 자료로 넣는 것은 무료 키트 범위에 포함됩니다. Telegram 외 메신저 자동 연동은 포함하지 않습니다.

## 빠른 링크

- 한국어 quickstart: `docs/quickstart-ko.md`
- 영어 quickstart: `docs/quickstart-en.md`
- 일본어 quickstart: `docs/quickstart-ja.md`
- Airbnb 정책 경계: `docs/airbnb-policy-boundary.md`
- 호스트 콘텐츠 워크플로: `docs/host-content-workflow.md`
- 언어 라우팅: `docs/language-routing.md`
- Telegram dry-run: `docs/telegram-dry-run-rehearsal.md`
- 샘플: `samples/`

## 안전 모델

이 키트는 Airbnb나 예약 플랫폼을 스크래핑하지 않습니다.

플랫폼 링크는 소스 참고 자료로만 저장됩니다. 봇은 호스트가 직접 붙여넣고, 검토하고, `config.json`에 승인한 텍스트만 사용합니다.

Airbnb 숙소의 경우, Airbnb가 해당 상황에서 명시적으로 허용하지 않는 한 이 외부 안내 링크를 Airbnb 숙소 설명이나 Airbnb 메시지 스레드에 넣지 마세요. 이 키트는 Airbnb에 다시 붙여넣을 수 있는 번역 안내 문구를 만들거나, 숙소 안의 QR 코드 같은 선택형 리소스로 제공하는 용도에 맞습니다.

자세한 내용은 `docs/airbnb-policy-boundary.md`를 확인하세요.

이 키트는 다음을 하지 않습니다.

- Airbnb 비밀번호 요청
- 예약 플랫폼 로그인
- 비공개 게스트 메시지 스크래핑
- 예약, 환불, 취소, 결제, 법률, 안전 판단 자동 전송
- 예약/결제/환불 흐름을 예약 플랫폼 밖으로 이동
- 숙소 이용을 위해 게스트에게 Airbnb 밖 이동, Telegram 설치, 별도 계정 생성을 강제

## 빠른 시작

이 폴더에서 로컬 정적 서버를 실행한 뒤 다음 파일을 엽니다.

```text
host-setup.html
```

1. 로컬 웹 서버에서 `host-setup.html`을 엽니다.
2. 호스트가 승인한 숙소 설명과 숙소 규칙을 붙여넣습니다.
3. 생성된 Codex / Hermes 프롬프트를 복사합니다.
4. Codex 또는 Hermes에게 검토용 `config.json`을 만들게 합니다.
5. 공개 전 `approvedStayGuide`를 검토합니다. 이 내용이 게스트의 언어로 표시됩니다.
6. `npm test`를 실행합니다.
7. 로컬 웹 서버에서 `index.html`을 열거나 정적 사이트로 배포합니다.
8. Telegram을 쓸 경우 `docs/telegram-host-handoff.md`를 따릅니다.

문서 기반 흐름도 사용할 수 있습니다.

1. `config.example.json`을 `config.json`으로 복사합니다.
2. `host-workbook/host-info-form.md`를 채웁니다.
3. 공개 숙소 설명 텍스트를 `host-workbook/platform-source-form.md`에 붙여넣습니다.
4. Codex 또는 Claude에게 `ai-prompts/01-build-config-from-host-workbook.md`를 실행하게 합니다.

전체 호스트 콘텐츠 흐름은 `docs/host-content-workflow.md`를 확인하세요.

게스트 언어 자동 선택 방식은 `docs/language-routing.md`를 확인하세요.

## 샘플 실행

```bash
cp samples/seoul-guesthouse.config.json config.json
```

그다음 다음 URL을 엽니다.

```text
index.html?lang=en
index.html?lang=ja
index.html?lang=ko
```

## 폴더 구조

```text
config.example.json              호스트 승인 숙소 설정과 번역 안내 샘플
index.html                       게스트 도움 페이지
host-setup.html                  호스트용 브라우저 설정 마법사
assets/                          브라우저 UI
lib/                             공통 guest-ops 로직
tests/                           안전 및 라우팅 테스트
adapters/telegram/               무료 Telegram Bot adapter
host-workbook/                   호스트 입력 양식
ai-prompts/                      Codex 또는 Claude용 프롬프트
docs/                            설정 및 경계 문서
templates/                       재사용 가능한 정책 및 Hermes 프롬프트
```

## 명령어

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
```

Telegram adapter:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
npm start
```

## 릴리즈

공개 전 `RELEASE_CHECKLIST.md`를 확인하세요.
