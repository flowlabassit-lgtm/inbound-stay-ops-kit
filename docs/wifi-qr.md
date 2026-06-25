# Wi-Fi QR Boundary

This kit can generate a Wi-Fi QR code from host-approved network details.

## What Is Included

- Builds a standard `WIFI:T:...;S:...;P:...;;` QR payload.
- Renders the QR SVG locally in the browser.
- Does not call external QR services such as hosted QR APIs.
- Hides the password as visible page text by default.

## Safety Rules

- Do not commit real Wi-Fi passwords to a public GitHub repo.
- Use fake demo values for public samples.
- For real properties, use a private in-stay deployment, local print workflow, or a private `config.json` that is not published to a public repository.
- Only enable the QR after the host approves the network name, password, and whether the network is hidden.

## Korean Note

이 기능은 무료 오픈소스 범위에 포함됩니다. 다만 QR 안에는 접속 정보가 들어가므로, 실제 숙소 Wi-Fi 비밀번호를 공개 GitHub 저장소에 올리면 안 됩니다. 공개 데모에는 가짜 값을 쓰고, 실제 숙소에서는 비공개 배포나 숙소 내부에 놓는 인쇄 QR로 사용하는 흐름이 안전합니다.
