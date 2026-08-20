# AGENTS.md

马拉松报名管理系统-小程序端 (marathon registration mini-program). A **uni-app (Vue 3)** WeChat Mini Program frontend, backed by a **RuoYi (若依 v3.9.2) Spring Boot backend at `D:\hzwxwork\marathon-backend`** (port 8080). No tests, no linter. Pages keep hardcoded mock fallback data; live data loads through `src/api/*` request modules with graceful degradation.

## Commands

- `npm run dev:mp-weixin` — watch-build to `dist/dev/mp-weixin` (target platform is WeChat; ignore the other `dev:*` scripts unless asked).
- After dev build, open **WeChat DevTools → Import** the project root. `project.config.json` already sets `miniprogramRoot` to `dist/dev/mp-weixin`.
- `npm run build:mp-weixin` — production build; `npm run dev:h5` — browser preview.
- First `dev:mp-weixin` compile takes ~90s (Dart Sass legacy-js-api deprecation warnings are noise, not errors); later rebuilds are incremental.
- No test/lint/typecheck scripts exist — don't hunt for them.

## Structure & wiring

- `src/pages.json` — page registry + tabBar. **Every new page must be registered here.** 3 tab pages: `index` (custom nav), `activity`, `mine` (service tab removed — its entries duplicated other tabs; `pages/service/service.vue` kept on disk but unregistered, restore by re-adding to `pages` + `tabBar.list`); plus non-tab pages: `pages/news/news` (赛事咨讯 list, fetches `/api/content/notice`), `pages/route-map` (赛道轨迹: real `<map>` centered on current location via `uni.getLocation` gcj02; 轨迹 = 赛道摄像头 GPS 点位连成的 polyline, 拉取 `/api/camera/list?eventId=` 按点位里程排序绘制), `pages/live-track` (实时轨迹 — 按摄像头点位 GPS 生成赛道轨迹: 拉 `/api/registration/my` 取我已完赛的赛事 (event_status=3, 结束比赛后才能查看) → 拉 `/api/camera/list?eventId=` 按里程排序连成 polyline, 与 route-map 的区别是本页自动定位到我的完赛赛事、不手动选赛事), `pages/result` (成绩查询 — `getMyResults()` 我的成绩列表, 未登录显示引导登录), `pages/my-registrations` (我的报名 — `getMyRegistrations()` 列表, 未登录显示引导登录), `pages/my-results` (我的成绩 — `getMyResults()` 列表, 未登录显示引导登录).
- `src/manifest.json` — app config; `mp-weixin.appid` is empty → runs in tourist mode.
- `src/App.vue` — global styles: `.mz-card` (white card) and `.safe-bottom` (safe-area spacer). New page styles should reuse these.
- `src/main.js` — standard uni-app `createSSRApp` bootstrap; no plugin/request setup.
- `src/api/request.js` — **request layer**: `uni.request` wrapper + `wxLogin()` (POST `/api/auth/wx-login`) + auto `wx-token` header + 401 auto-re-login/retry. Response shape `ApiResult = { code, message, data }`, **code 0 = success**.
- `src/api/content.js` — content API: `getNoticeList()` (`/api/content/notice`, used by index 赛事资讯 and `pages/news/news`), `getBannerList()` (`/api/content/banner`).
- `src/api/event.js` — event API: `getEventList({status,pageNum,pageSize})` (`/api/event/list`, returns `{list,total}`), `getEventDetail(id)` + `mapEvent()` mapper (backend `Event.status` is numeric 1/2/3; `startTime`/`signupStart~signupEnd` are datetimes). Backend has no 组别/报名费 fields yet — `mapEvent` fills placeholders (see its TODO comments). Used by activity 赛事列表 and index 热门赛事.
- `src/api/payment.js` — **payment interface stub (mock)**: `createOrder`/`pay`/`payForRegistration` simulate order creation + a `showModal` payment cashier. The activity 报名 flow calls it; the real WeChat Pay swap-in points (`POST /api/payment/order` → `uni.requestPayment`) are documented in its comments — keep the interface shape when integrating.
- `src/api/registration.js` — registration API: `createRegistration({eventId, name, phone})` (POST `/api/registration/create`, called after mock payment succeeds; backend back-fills person name/phone then creates the registration), `getPhoneByCode(code)` (POST `/api/auth/phone` — WeChat phone-number quick-fill; needs a certified appid, errors clearly otherwise), and `getMyRegistrations()` (GET `/api/registration/my` — my registrations with `eventId`/`eventName`/`bib`/`eventStatus`; used by live-track to auto-locate my ongoing race).
- `src/api/camera.js` — camera point API: `getCameraList(eventId)` (GET `/api/camera/list?eventId=`, returns enabled 计时摄像头 GPS points `{cameraId, name, lng, lat}`; used by `pages/route-map` to draw the race route). Backend: `ApiCameraController`. `camera` table rows carry `camera_id` like `CP-START`/`CP-05KM`/`CP-FINISH` — mileage embedded for sorting.
- `src/api/auth.js` — auth/user API: `getMe()` (GET `/api/auth/me` → `{id,name,phone}`, used by `pages/mine/mine` for login state), `isLoggedIn()` (local token check), `ensureLogin()` (token 存在直接返回，否则 `wxLogin()` 静默登录), `logout()` (clear local token). Re-exports `getToken`/`setToken`/`wxLogin` from `request.js`.

## Conventions

- `<script setup>` + Composition API (`ref`/`computed`), plain JS in pages; `<style scoped lang="scss">`, **rpx units** (750rpx design width).
- `src/uni.scss` is **auto-injected into every SFC** — no `@import` needed. Use `$mz-*`/`$uni-*` vars (primary green `#16A34A`, page bg `#F4F8F4`) instead of hand-writing hex.
- **Images are generated assets, not hand-made**: entry-grid icons stay pure CSS shapes (`.sicon`, `.sh-*` classes); the home hero background is `src/static/hero.png` — either a real poster dropped in by hand (current state) or the SDF-drawn placeholder from `scripts/gen-hero-image.js`. Don't add random image files; regenerate via the script only if the placeholder is needed again.
- Undeveloped features get `uni.showToast({ title: '功能建设中，敬请期待', icon: 'none' })` placeholders; tab jumps use `uni.switchTab`.
- `index` uses custom navigation (`navigationStyle: "custom"`) — must reserve `statusBarHeight` itself via `uni.getSystemInfoSync()`.

## Gotchas

- **WXSS `background-image` cannot reference local image files on WeChat** (network URL or base64 only) — DevTools errors out with "本地资源图片无法通过 WXSS 获取". Any local-image "background" must be an absolutely-positioned `<image mode="aspectFill">` layer under the content (see `.hero-bg` in `index.vue`).

- **Backend auth is `wx-token`, not `Authorization`**: `/api/**` routes are guarded by the backend `WxAuthInterceptor` (Spring Security permits `/api/**`); every request needs the `wx-token` header (JWT from `/api/auth/wx-login`). Only `/api/auth/wx-login` is token-free. With `wx.appid` empty (dev mode) any login `code` works (openid = `mock_ + code`, auto-registers a `person` row). Request wrapper handles this — just call `request()`.
- **Never send `undefined` as a query param**: `uni.request` serializes `undefined` values into the literal string `"undefined"`, which 400s on the Spring backend (e.g. `event.status` Integer → typeMismatch). `request()` strips `undefined`/`null` params via `cleanData` — don't work around it, rely on it.
- **Backend has no `/api/payment/*` endpoint yet** — `payment.js` is still a mock; the backend `person.name` column now defaults to `''` so auto-registration works (was `NOT NULL` without default → wx-login 500 on first login; fix applied to both the live DB and `sql/ry_marathon.sql`).
- **DevTools must have "不校验合法域名" enabled** to call `http://localhost:8080`. `project.config.json` has `urlCheck: false`, but **`project.private.config.json` also sets `urlCheck` (per-dev overrides win)** — keep both `false`, or toggle 详情 → 本地设置 → 不校验合法域名 in DevTools.
- **Not a git repo** — no VCS history; don't run git commands expecting commits/branches.
- **tabBar icons are generated**: `node scripts/gen-tabbar-icons.js` writes the 8 PNGs in `src/static/tabbar/` from SDF shapes (colors `#9CA3AF`/`#16A34A` hardcoded — keep in sync with `pages.json` tabBar colors). Same story for `src/static/hero.png` (`node scripts/gen-hero-image.js`). Both depend on `pngjs`, which is **not a declared dependency** (only hoisted transitively) — a fresh/clean install may break them. Regenerate after changing icons/colors or the hero poster; `git`-style hand-editing PNGs is not a thing here.
- **Location APIs need privacy declarations**: `index` auto-locates via `uni.getLocation` and opens the map picker via `uni.chooseLocation`. Both are declared in `manifest.json` (`mp-weixin.permission.scope.userLocation` + `requiredPrivateInfos`) — WeChat fails these APIs outright without that declaration. Only coordinates are fetched; reverse geocoding to a city name needs a map-service key, which is intentionally not integrated (tap-to-pick via `chooseLocation` fills that gap).
- `project.private.config.json` is per-developer WeChat DevTools settings (`libVersion: 3.17.1`), not source config.
