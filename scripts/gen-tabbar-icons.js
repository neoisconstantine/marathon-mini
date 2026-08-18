/**
 * gen-tabbar-icons.js
 * 生成微信小程序 tabBar 图标（81x81 PNG，透明背景）
 *
 * 原理：用 SDF（Signed Distance Field，有符号距离场）描述图标几何形状，
 *       逐像素计算到形状的带符号距离，再用 0.5 - d 做 1px 抗锯齿，
 *       无需任何图像资源或第三方设计工具即可重新生成图标。
 *
 * 输出：src/static/tabbar/ 下 8 个文件
 *   home.png / home-active.png       首页（房子）
 *   flag.png / flag-active.png       活动（旗帜）
 *   grid.png / grid-active.png       服务（四宫格）
 *   person.png / person-active.png   我的（人像）
 *
 * 用法：node scripts/gen-tabbar-icons.js
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SIZE = 81; // 微信建议的 tabBar 图标尺寸 81x81
const OUT_DIR = path.resolve(__dirname, '../src/static/tabbar');
const COLORS = {
  normal: [0x9c, 0xa3, 0xaf], // #9CA3AF 未选中灰
  active: [0x16, 0xa3, 0x4a], // #16A34A 主题绿
};

/* ---------------- SDF 基础图元 ---------------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** 圆：返回点到圆边的带符号距离（负值在圆内） */
const sdCircle = (x, y, cx, cy, r) => Math.hypot(x - cx, y - cy) - r;

/** 圆角矩形：中心 (cx,cy)，半宽 hw，半高 hh，圆角 r */
function sdRoundRect(x, y, cx, cy, hw, hh, r) {
  const qx = Math.abs(x - cx) - (hw - r);
  const qy = Math.abs(y - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** 圆头线段：从 (ax,ay) 到 (bx,by)，半径 r（用于旗杆等细长形状） */
function sdSegment(x, y, ax, ay, bx, by, r) {
  const pax = x - ax, pay = y - ay, bax = bx - ax, bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

/** 实心三角形（顶点 p0/p1/p2），移植自 Inigo Quilez 的 2D 三角形 SDF */
function sdTriangle(x, y, p0, p1, p2) {
  const e = [[p1[0] - p0[0], p1[1] - p0[1]], [p2[0] - p1[0], p2[1] - p1[1]], [p0[0] - p2[0], p0[1] - p2[1]]];
  const v = [[x - p0[0], y - p0[1]], [x - p1[0], y - p1[1]], [x - p2[0], y - p2[1]]];
  // 三角形朝向符号（保证内部为负值）
  const s = Math.sign(e[0][0] * e[2][1] - e[0][1] * e[2][0]) || 1;
  let dx = Infinity, dy = Infinity;
  for (let i = 0; i < 3; i++) {
    // 点到边的投影点，取最近边距离的平方与符号叉积
    const t = clamp((v[i][0] * e[i][0] + v[i][1] * e[i][1]) / (e[i][0] * e[i][0] + e[i][1] * e[i][1]), 0, 1);
    const qx = v[i][0] - e[i][0] * t, qy = v[i][1] - e[i][1] * t;
    dx = Math.min(dx, qx * qx + qy * qy);
    dy = Math.min(dy, s * (v[i][0] * e[i][1] - v[i][1] * e[i][0]));
  }
  return -Math.sqrt(dx) * Math.sign(dy);
}

/* 布尔运算：并 / 减（SDF 标准组合方式） */
const opUnion = (a, b) => Math.min(a, b);
const opSub = (a, b) => Math.max(a, -b);

/* ---------------- 四个图标的形状定义 ---------------- */

/** 首页：三角屋顶 + 圆角墙体，减去门洞 */
function sdHome(x, y) {
  const roof = sdTriangle(x, y, [40.5, 15], [13, 41], [68, 41]);
  const body = sdRoundRect(x, y, 40.5, 54, 20, 14, 3);
  const door = sdRoundRect(x, y, 40.5, 63, 5.5, 9, 2.5);
  return opSub(opUnion(roof, body), door);
}

/** 活动：圆头旗杆 + 圆角旗面 + 底座横条 */
function sdFlag(x, y) {
  const pole = sdSegment(x, y, 27, 13, 27, 68, 3.5);
  const cloth = sdRoundRect(x, y, 46, 25, 17, 11, 3);
  const base = sdRoundRect(x, y, 27, 70, 8, 2.5, 2.5);
  return opUnion(opUnion(pole, cloth), base);
}

/** 服务：2x2 四个圆角小方块 */
function sdGrid(x, y) {
  let d = 1e9;
  for (const [cx, cy] of [[26.5, 26.5], [54.5, 26.5], [26.5, 54.5], [54.5, 54.5]]) {
    d = opUnion(d, sdRoundRect(x, y, cx, cy, 12, 12, 4.5));
  }
  return d;
}

/** 我的：圆脑袋 + 胶囊形肩膀 */
function sdPerson(x, y) {
  const head = sdCircle(x, y, 40.5, 26, 12);
  const body = sdRoundRect(x, y, 40.5, 58.5, 17.5, 13.5, 13.5);
  return opUnion(head, body);
}

const ICONS = { home: sdHome, flag: sdFlag, grid: sdGrid, person: sdPerson };

/* ---------------- 渲染输出 ---------------- */

/** 将单个 SDF 形状渲染成 81x81 RGBA PNG Buffer */
function render(sdf, rgb) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // 以像素中心采样；alpha = clamp(0.5 - d) 得到约 1px 的抗锯齿边缘
      const d = sdf(x + 0.5, y + 0.5);
      const alpha = clamp(0.5 - d, 0, 1);
      const idx = (SIZE * y + x) << 2;
      png.data[idx] = rgb[0];
      png.data[idx + 1] = rgb[1];
      png.data[idx + 2] = rgb[2];
      png.data[idx + 3] = Math.round(alpha * 255);
    }
  }
  return PNG.sync.write(png);
}

// 主流程：确保输出目录存在，为每个图标生成 normal/active 两个配色
fs.mkdirSync(OUT_DIR, { recursive: true });
for (const [name, sdf] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), render(sdf, COLORS.normal));
  fs.writeFileSync(path.join(OUT_DIR, `${name}-active.png`), render(sdf, COLORS.active));
  console.log(`[ok] ${name}.png / ${name}-active.png`);
}
console.log(`\n8 个 tabBar 图标已生成到 ${OUT_DIR}`);