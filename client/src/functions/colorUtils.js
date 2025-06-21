// src/utils/colorUtils.js
import axios from "axios";
import { average } from 'color.js';

export const rgbArrayToHex = ([r, g, b]) => {
  // Clamp and convert each channel to two hex digits
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export const getAverageColor = async (imageUrl) => {
  try {
    const colorArray = await average(imageUrl); // returns [r, g, b]
    // Convert [r,g,b] to hex string
    const hex = rgbArrayToHex(colorArray);
    return hex;
  } catch (error) {
    console.error('Error getting average color:', error);
    return "6bff7a";
  }
}

export const getEmojiColor = async (imageUrl) => {
  try {
    const response = await axios.get("https://api.sightengine.com/1.0/check.json", {
      params: {
        url: imageUrl.endsWith(".gif") ? imageUrl.replace(".gif", ".png") : imageUrl,
        models: "properties",
        api_user: "256690365",
        api_secret: "DSZ9GksrgKuzP6XsfgCw",
      },
    });
    const hex = response.data.colors?.dominant?.hex;
    return hex || `hsl(${Math.random() * 360}, 70%, 60%)`;
  } catch (err) {
    console.error(err.response?.data || err.message);
    return `hsl(${Math.random() * 360}, 70%, 60%)`;
  }
};

export const hexOpacity = (hex, opacityPercent) => {
  // Remove "#" if present
  const cleanedHex = hex.replace("#", "");

  // Parse RGB
  const r = parseInt(cleanedHex.slice(0, 2), 16);
  const g = parseInt(cleanedHex.slice(2, 4), 16);
  const b = parseInt(cleanedHex.slice(4, 6), 16);

  // Calculate alpha value (0–255), then convert to 2-digit hex
  const alpha = Math.round(((opacityPercent*10) / 100) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${cleanedHex}${alpha}`;
}

export const hexToHSL = (H) => {
  let r = 0, g = 0, b = 0;
  if (H.length === 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length === 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
  }

  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b);
  const cmax = Math.max(r, g, b);
  const delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
};

export const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;

  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const color = l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
};

export const neonizeHex = (hex) => {
  const { h } = hexToHSL(hex);
  return hslToHex(h, 100, 60);
};

export const lightenHex = (hex, amount = 20) => {
  const { h, s, l } = hexToHSL(hex);
  const newL = Math.min(l + amount, 100); // prevent exceeding 100%
  return hslToHex(h, s, newL);
};
