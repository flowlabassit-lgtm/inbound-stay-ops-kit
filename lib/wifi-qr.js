const WIFI_SECURITY_TYPES = new Set(["WPA", "WEP", "nopass"]);

const QR_LEVEL_L = 1;
const QR_MASK_PATTERN = 0;
const QR_VERSIONS = [
  null,
  { version: 1, size: 21, eccPerBlock: 7, dataBlocks: [19], alignment: [] },
  { version: 2, size: 25, eccPerBlock: 10, dataBlocks: [34], alignment: [6, 18] },
  { version: 3, size: 29, eccPerBlock: 15, dataBlocks: [55], alignment: [6, 22] },
  { version: 4, size: 33, eccPerBlock: 20, dataBlocks: [80], alignment: [6, 26] },
  { version: 5, size: 37, eccPerBlock: 26, dataBlocks: [108], alignment: [6, 30] },
  { version: 6, size: 41, eccPerBlock: 18, dataBlocks: [68, 68], alignment: [6, 34] }
];

export function buildWifiQrPayload({ ssid, password = "", security = "WPA", hidden = false }) {
  const normalizedSsid = String(ssid || "").trim();
  if (!normalizedSsid) {
    throw new Error("Wi-Fi QR requires an SSID.");
  }

  const normalizedSecurity = normalizeWifiSecurity(security);
  const fields = [
    `T:${normalizedSecurity}`,
    `S:${escapeWifiField(normalizedSsid)}`
  ];

  if (normalizedSecurity !== "nopass" && password) {
    fields.push(`P:${escapeWifiField(String(password))}`);
  }

  if (hidden === true) {
    fields.push("H:true");
  }

  return `WIFI:${fields.join(";")};;`;
}

export function getPublicWifiQrConfig(config = {}) {
  const wifiQr = config.wifiQr || {};
  if (wifiQr.enabled !== true || wifiQr.hostApproved !== true || !wifiQr.ssid) {
    return null;
  }

  const security = normalizeWifiSecurity(wifiQr.security);
  const hidden = wifiQr.hidden === true;

  return {
    ssid: String(wifiQr.ssid),
    security,
    hidden,
    showPasswordText: wifiQr.showPasswordText === true,
    payload: buildWifiQrPayload({
      ssid: wifiQr.ssid,
      password: wifiQr.password || "",
      security,
      hidden
    })
  };
}

export function createQrSvgFromText(text, { label = "QR code", scale = 6, border = 4 } = {}) {
  const matrix = createQrMatrix(String(text));
  const safeScale = Math.max(1, Number(scale) || 6);
  const safeBorder = Math.max(0, Number(border) || 4);
  const moduleCount = matrix.length;
  const viewSize = moduleCount + safeBorder * 2;
  const commands = [];

  for (let y = 0; y < moduleCount; y += 1) {
    for (let x = 0; x < moduleCount; x += 1) {
      if (matrix[y][x]) {
        commands.push(`M${x + safeBorder} ${y + safeBorder}h1v1h-1z`);
      }
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(label)}" viewBox="0 0 ${viewSize} ${viewSize}" width="${viewSize * safeScale}" height="${viewSize * safeScale}" shape-rendering="crispEdges">`,
    '<rect width="100%" height="100%" fill="#ffffff"/>',
    `<path d="${commands.join("")}" fill="#111820"/>`,
    "</svg>"
  ].join("");
}

function normalizeWifiSecurity(security) {
  const value = String(security || "WPA").trim();
  return WIFI_SECURITY_TYPES.has(value) ? value : "WPA";
}

function escapeWifiField(value) {
  return String(value).replace(/[\\;,:"]/g, (character) => `\\${character}`);
}

function createQrMatrix(text) {
  const dataBytes = Array.from(new TextEncoder().encode(text));
  const versionInfo = chooseVersion(dataBytes.length);
  const dataCodewords = createDataCodewords(dataBytes, versionInfo);
  const allCodewords = addErrorCorrection(dataCodewords, versionInfo);

  const modules = Array.from({ length: versionInfo.size }, () => Array(versionInfo.size).fill(false));
  const isFunction = Array.from({ length: versionInfo.size }, () => Array(versionInfo.size).fill(false));

  drawFunctionPatterns(modules, isFunction, versionInfo);
  drawCodewords(modules, isFunction, allCodewords);
  drawFormatBits(modules, isFunction, versionInfo.size, QR_MASK_PATTERN);

  return modules;
}

function chooseVersion(byteLength) {
  const requiredBits = 4 + 8 + byteLength * 8;
  for (const versionInfo of QR_VERSIONS.slice(1)) {
    const capacityBits = totalDataCodewords(versionInfo) * 8;
    if (requiredBits <= capacityBits) {
      return versionInfo;
    }
  }

  throw new Error(
    "Wi-Fi QR payload is too long for the built-in generator. Shorten SSID/password or use a dedicated QR tool."
  );
}

function totalDataCodewords(versionInfo) {
  return versionInfo.dataBlocks.reduce((sum, blockLength) => sum + blockLength, 0);
}

function createDataCodewords(dataBytes, versionInfo) {
  const capacityBits = totalDataCodewords(versionInfo) * 8;
  const bits = [];

  appendBits(bits, 0x4, 4);
  appendBits(bits, dataBytes.length, 8);
  for (const byte of dataBytes) {
    appendBits(bits, byte, 8);
  }

  appendBits(bits, 0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0;
    for (let j = 0; j < 8; j += 1) {
      value = (value << 1) | bits[i + j];
    }
    dataCodewords.push(value);
  }

  for (let pad = 0xec; dataCodewords.length < totalDataCodewords(versionInfo); pad ^= 0xfd) {
    dataCodewords.push(pad);
  }

  return dataCodewords;
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push((value >>> i) & 1);
  }
}

function addErrorCorrection(dataCodewords, versionInfo) {
  const divisor = reedSolomonComputeDivisor(versionInfo.eccPerBlock);
  const blocks = [];
  let offset = 0;

  for (const dataBlockLength of versionInfo.dataBlocks) {
    const data = dataCodewords.slice(offset, offset + dataBlockLength);
    offset += dataBlockLength;
    blocks.push({
      data,
      ecc: reedSolomonComputeRemainder(data, divisor)
    });
  }

  const result = [];
  const maxDataLength = Math.max(...blocks.map((block) => block.data.length));
  for (let i = 0; i < maxDataLength; i += 1) {
    for (const block of blocks) {
      if (i < block.data.length) {
        result.push(block.data[i]);
      }
    }
  }

  for (let i = 0; i < versionInfo.eccPerBlock; i += 1) {
    for (const block of blocks) {
      result.push(block.ecc[i]);
    }
  }

  return result;
}

function reedSolomonComputeDivisor(degree) {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;

  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }

  return result;
}

function reedSolomonComputeRemainder(data, divisor) {
  const result = Array(divisor.length).fill(0);

  for (const byte of data) {
    const factor = byte ^ result.shift();
    result.push(0);
    for (let i = 0; i < result.length; i += 1) {
      result[i] ^= reedSolomonMultiply(divisor[i], factor);
    }
  }

  return result;
}

function reedSolomonMultiply(x, y) {
  let result = 0;
  for (let i = 7; i >= 0; i -= 1) {
    result = ((result << 1) ^ (((result >>> 7) & 1) * 0x11d)) & 0xff;
    result ^= ((y >>> i) & 1) * x;
  }
  return result;
}

function drawFunctionPatterns(modules, isFunction, versionInfo) {
  const size = versionInfo.size;
  drawFinderPattern(modules, isFunction, 3, 3);
  drawFinderPattern(modules, isFunction, size - 4, 3);
  drawFinderPattern(modules, isFunction, 3, size - 4);

  for (const x of versionInfo.alignment) {
    for (const y of versionInfo.alignment) {
      const nearTop = y === 6;
      const nearLeft = x === 6;
      const nearRight = x === size - 7;
      if ((nearTop && nearLeft) || (nearTop && nearRight) || (!nearTop && nearLeft)) {
        continue;
      }
      drawAlignmentPattern(modules, isFunction, x, y);
    }
  }

  for (let i = 0; i < size; i += 1) {
    if (!isFunction[6][i]) {
      setFunctionModule(modules, isFunction, i, 6, i % 2 === 0);
    }
    if (!isFunction[i][6]) {
      setFunctionModule(modules, isFunction, 6, i, i % 2 === 0);
    }
  }

  drawFormatBits(modules, isFunction, size, QR_MASK_PATTERN);
  setFunctionModule(modules, isFunction, 8, size - 8, true);
}

function drawFinderPattern(modules, isFunction, centerX, centerY) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || y < 0 || y >= modules.length || x >= modules.length) {
        continue;
      }
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunctionModule(modules, isFunction, x, y, distance !== 2 && distance !== 4);
    }
  }
}

function drawAlignmentPattern(modules, isFunction, centerX, centerY) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunctionModule(modules, isFunction, centerX + dx, centerY + dy, distance !== 1);
    }
  }
}

function drawFormatBits(modules, isFunction, size, maskPattern) {
  const bits = getFormatBits(QR_LEVEL_L, maskPattern);

  for (let i = 0; i <= 5; i += 1) {
    setFunctionModule(modules, isFunction, 8, i, getBit(bits, i));
  }
  setFunctionModule(modules, isFunction, 8, 7, getBit(bits, 6));
  setFunctionModule(modules, isFunction, 8, 8, getBit(bits, 7));
  setFunctionModule(modules, isFunction, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i += 1) {
    setFunctionModule(modules, isFunction, 14 - i, 8, getBit(bits, i));
  }

  for (let i = 0; i < 8; i += 1) {
    setFunctionModule(modules, isFunction, size - 1 - i, 8, getBit(bits, i));
  }
  for (let i = 8; i < 15; i += 1) {
    setFunctionModule(modules, isFunction, 8, size - 15 + i, getBit(bits, i));
  }
  setFunctionModule(modules, isFunction, 8, size - 8, true);
}

function getFormatBits(errorCorrectionLevel, maskPattern) {
  const data = (errorCorrectionLevel << 3) | maskPattern;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }
  return ((data << 10) | remainder) ^ 0x5412;
}

function drawCodewords(modules, isFunction, codewords) {
  const size = modules.length;
  const bits = [];
  for (const codeword of codewords) {
    appendBits(bits, codeword, 8);
  }

  let bitIndex = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right = 5;
    }

    for (let vertical = 0; vertical < size; vertical += 1) {
      const y = upward ? size - 1 - vertical : vertical;
      for (let column = 0; column < 2; column += 1) {
        const x = right - column;
        if (isFunction[y][x]) {
          continue;
        }

        let black = bitIndex < bits.length && bits[bitIndex] === 1;
        bitIndex += 1;
        if ((x + y) % 2 === 0) {
          black = !black;
        }
        modules[y][x] = black;
      }
    }

    upward = !upward;
  }
}

function setFunctionModule(modules, isFunction, x, y, isBlack) {
  modules[y][x] = isBlack;
  isFunction[y][x] = true;
}

function getBit(value, index) {
  return ((value >>> index) & 1) !== 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
