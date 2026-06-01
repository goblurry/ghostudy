#!/bin/bash
set -e

echo "👻 Ghostudy 배포 시작..."

# 1. Tauri 빌드
echo "\n🔨 DMG 빌드 중..."
npm run tauri build

# 2. Vercel 배포
echo "\n🌐 Vercel 배포 중..."
npx vercel --prod --yes

# 3. ghostudy-app alias 재적용
echo "\n🔗 도메인 alias 적용 중..."
LATEST=$(npx vercel ls --yes 2>&1 | grep "study-desk-" | head -1 | awk '{print $3}')
npx vercel alias set "$LATEST" ghostudy-app.vercel.app

# 4. GitHub Release 업데이트
echo "\n📦 GitHub Release 업데이트 중..."
gh release delete v0.1.0 --yes 2>/dev/null || true
gh release create v0.1.0 \
  "src-tauri/target/release/bundle/dmg/Ghostudy_0.1.0_aarch64.dmg" \
  --title "Ghostudy v0.1.0" \
  --notes "👻 Ghostudy

## 설치 (macOS)
DMG 다운로드 후 Applications 폴더로 드래그

## 웹 버전
https://ghostudy-app.vercel.app"

echo "\n✅ 배포 완료!"
echo "   웹: https://ghostudy-app.vercel.app"
echo "   DMG: https://github.com/goblurry/ghostudy/releases/tag/v0.1.0"
