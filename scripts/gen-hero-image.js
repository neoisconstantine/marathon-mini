/**
 * gen-hero-image.js
 * 生成首页顶部大图（hero 背景海报），750x900 PNG（适配 375px 宽屏的 2x）
 *
 * 原理：SDF（Signed Distance Field，有符号距离场）逐像素绘制
 *       "晨光山野 + 环形跑道" 海报，绿色主题系，无需外部图片资源。
 *
 * 输出：src/static/hero.png
 *
 * 用法：node scripts/gen-hero-image.js
 *       （与 gen-tabbar-icons.js 相同，依赖 pngjs，非 package.json 声明依赖）
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const W = 750; // 宽 750（375px @2x）
const H = 900; // 高 900（约占 62vh 屏高的 2x）
const OUT = path.resolve(__dirname, '../src/static/hero.png');

/* ---------------- 工具 ---------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/** '#rrggbb' -> [r, g, b] */
function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 分段线性取色（stops: [[t, hex], ...]，t 为 0~1） */
function gradientAt(stops, t) {
  const tt = clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (tt >= t0 && tt <= t1) {
      const k = (tt - t0) / (t1 - t0);
      const a = hexRgb(c0), b = hexRgb(c1);
      return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
    }
  }
  return hexRgb(stops[stops.length - 1][1]);
}

/** 叠加颜色：带透明度的前景色混合到底色上 */
function blend(base, fg, alpha) {
  const a = clamp(alpha, 0, 1);
  return [
    base[0] * (1 - a) + fg[0] * a,
    base[1] * (1 - a) + fg[1] * a,
    base[2] * (1 - a) + fg[2] * a,
  ];
}

/* ---------------- SDF 基础图元 ---------------- */
const sdCircle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;

/** 椭圆近似距离：等比缩放为单位圆再还原量纲（离心率适中时误差可接受） */
function sdEllipse(x, y, cx, cy, rx, ry) {
  const px = (x - cx) / rx, py = (y - cy) / ry;
  return (Math.hypot(px, py) - 1) * Math.min(rx, ry);
}

/** 点是否落在某个山丘圆内（用多个大圆叠加出连绵山脊） */
function inHills(x, y, circles) {
  for (const [cx, cy, r] of circles) {
    if (sdCircle(x, y, cx, cy, r) < 0) return true;
  }
  return false;
}

/* ---------------- 场景参数 ---------------- */
// 天空渐变（自顶向下，绿主题）
const SKY = [
  [0.0, '#14532D'],
  [0.35, '#16A34A'],
  [0.62, '#4ADE80'],
  [0.8, '#86EFAC'],
  [1.0, '#BBF7D0'],
];

// 太阳（辉光 + 日盘，暖色点缀）
const SUN_CX = W * 0.68, SUN_CY = H * 0.22;
const SUN_R = 80, SUN_GLOW_R = 175;

// 远山（较淡，推远层次）
const FAR_HILLS = {
  color: '#15803D',
  alpha: 0.92,
  circles: [
    [40, 555, 125],
    [200, 580, 145],
    [380, 550, 120],
    [540, 585, 150],
    [730, 565, 135],
  ],
};

// 环形跑道（白色，带内圈分道线）
const TRACK = { cx: W * 0.5, cy: H * 0.55, rx: 285, ry: 95, stroke: 24, lane: 8 };

// 跑道上的选手点缀（白色圆点，沿上弧分布）
const RUNNERS = [Math.PI * -0.4, Math.PI * -0.15, Math.PI * 0.25].map((th) => [
  TRACK.cx + TRACK.rx * Math.cos(th),
  TRACK.cy + TRACK.ry * Math.sin(th),
]);

// 近山（最深，压住跑道下缘，形成纵深感）
const NEAR_HILLS = {
  color: '#166534',
  alpha: 1,
  circles: [
    [30, 720, 170],
    [200, 760, 190],
    [400, 735, 165],
    [580, 765, 195],
    [780, 745, 185],
    [950, 775, 200],
  ],
};

// 山谷小路：近山上的浅色光带（软边），给底部增加细节与延伸感
const PATH = { cx: W * 0.5, cy: H * 0.78, rx: 330, ry: 62, stroke: 46, color: '#4ADE80', alpha: 0.4 };

/* ---------------- 渲染输出 ---------------- */
const png = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const px = x + 0.5, py = y + 0.5;
    let col = gradientAt(SKY, py / H);

    // 太阳辉光（软边）+ 日盘 + 亮芯
    const dGlow = sdCircle(px, py, SUN_CX, SUN_CY, SUN_GLOW_R);
    if (dGlow < 0) {
      const a = Math.pow(clamp(1 + dGlow / SUN_GLOW_R, 0, 1), 2) * 0.55;
      col = blend(col, hexRgb('#FEF3C7'), a);
    }
    const dSun = sdCircle(px, py, SUN_CX, SUN_CY, SUN_R);
    if (dSun < 0) col = blend(col, hexRgb('#FDE68A'), 1);
    const dCore = sdCircle(px, py, SUN_CX, SUN_CY, SUN_R * 0.72);
    if (dCore < 0) col = blend(col, hexRgb('#FEF9C3'), 0.8);

    // 远山
    if (inHills(px, py, FAR_HILLS.circles)) {
      col = blend(col, hexRgb(FAR_HILLS.color), FAR_HILLS.alpha);
    }

    // 跑道：白色跑道 + 内圈分道线；下半段渐隐"沉入"山体，避免与山脊产生硬切痕
    const dRing = Math.abs(sdEllipse(px, py, TRACK.cx, TRACK.cy, TRACK.rx, TRACK.ry));
    const trackFade = clamp((0.63 * H - py) / (0.08 * H), 0, 1);
    if (dRing < TRACK.stroke / 2) col = blend(col, [255, 255, 255], 0.88 * trackFade);
    if (dRing < TRACK.lane / 2) col = blend(col, [255, 255, 255], 0.45 * trackFade);

    // 跑道上的选手点（琥珀色，与白色跑道形成对比）
    for (const [rx0, ry0] of RUNNERS) {
      if (sdCircle(px, py, rx0, ry0, 10) < 0) col = blend(col, hexRgb('#F59E0B'), 0.95);
    }

    // 近山
    if (inHills(px, py, NEAR_HILLS.circles)) {
      col = blend(col, hexRgb(NEAR_HILLS.color), NEAR_HILLS.alpha);
    }

    // 山谷小路（软边光带）
    const dPath = sdEllipse(px, py, PATH.cx, PATH.cy, PATH.rx, PATH.ry);
    if (Math.abs(dPath) < PATH.stroke / 2) {
      const a = (1 - Math.abs(dPath) / (PATH.stroke / 2)) * PATH.alpha;
      col = blend(col, hexRgb(PATH.color), a);
    }

    // 底部收边：压暗，衬托上移重叠的功能卡片
    if (py > H * 0.92) {
      const a = clamp((py - H * 0.92) / (H * 0.08), 0, 1) * 0.6;
      col = blend(col, hexRgb('#14532D'), a);
    }

    const idx = (W * y + x) << 2;
    png.data[idx] = Math.round(col[0]);
    png.data[idx + 1] = Math.round(col[1]);
    png.data[idx + 2] = Math.round(col[2]);
    png.data[idx + 3] = 255;
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, PNG.sync.write(png));
console.log(`[ok] hero.png (${W}x${H}) -> ${OUT}`);
