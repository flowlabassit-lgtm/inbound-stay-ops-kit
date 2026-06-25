"""Decode the generated demo Wi-Fi QR with OpenCV.

This is an optional verification helper. It proves that the SVG emitted by
lib/wifi-qr.js can be read by an independent QR decoder.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError as exc:
    raise SystemExit(
        "This optional scan check requires opencv-python and numpy. "
        "Install them in your local Python environment, then rerun this script."
    ) from exc


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def generate_demo_svg() -> dict[str, str]:
    node_code = r"""
const { readFile } = await import('node:fs/promises');
const { buildWifiQrPayload, createQrSvgFromText } = await import('./lib/wifi-qr.js');
const config = JSON.parse(await readFile('./samples/demo.config.json', 'utf8'));
const wifi = config.wifiQr;
const payload = buildWifiQrPayload(wifi);
const svg = createQrSvgFromText(payload, { label: `${wifi.ssid} Wi-Fi QR`, scale: 4 });
console.log(JSON.stringify({ payload, svg, ssid: wifi.ssid }));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", node_code],
        cwd=PROJECT_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def rasterize_svg_path(svg: str, scale: int = 12):
    viewbox = re.search(r'viewBox="0 0 (\d+) (\d+)"', svg)
    path = re.search(r'<path d="([^"]+)"', svg)
    if not viewbox or not path:
        raise ValueError("Generated SVG does not contain the expected viewBox/path.")

    width, height = (int(value) for value in viewbox.groups())
    image = np.full((height * scale, width * scale), 255, dtype=np.uint8)

    for x_value, y_value in re.findall(r"M(\d+) (\d+)h1v1h-1z", path.group(1)):
        x = int(x_value)
        y = int(y_value)
        image[y * scale : (y + 1) * scale, x * scale : (x + 1) * scale] = 0

    return image


def main() -> int:
    data = generate_demo_svg()
    image = rasterize_svg_path(data["svg"])
    decoded, points, _ = cv2.QRCodeDetector().detectAndDecode(image)
    matched = decoded == data["payload"]

    print(
        json.dumps(
            {
                "ssid": data["ssid"],
                "expected": data["payload"],
                "decoded": decoded,
                "matched": matched,
                "pointsDetected": points is not None,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    return 0 if matched else 1


if __name__ == "__main__":
    sys.exit(main())
