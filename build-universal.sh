#!/bin/bash

# 构建通用二进制文件 (Universal Binary)
# 支持 Apple Silicon (arm64) 和 Intel (x86_64)

set -e

echo "🚀 开始构建通用二进制文件..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_TAURI_DIR="$PROJECT_DIR/src-tauri"
TARGET_DIR="$SRC_TAURI_DIR/target"
RELEASE_BUNDLE_DIR="$TARGET_DIR/release/bundle"

echo -e "${YELLOW}📦 项目目录: $PROJECT_DIR${NC}"

# 清理旧的构建产物
echo -e "${YELLOW}🧹 清理旧的构建产物...${NC}"
rm -rf "$TARGET_DIR/universal"

# 1. 构建 Apple Silicon (arm64) 版本
echo -e "${GREEN}🍎 构建 Apple Silicon (arm64) 版本...${NC}"
cd "$SRC_TAURI_DIR"
cargo build --release --target aarch64-apple-darwin

# 2. 构建 Intel (x86_64) 版本
echo -e "${GREEN}🔧 构建 Intel (x86_64) 版本...${NC}"
cargo build --release --target x86_64-apple-darwin

# 3. 创建 Universal Binary
echo -e "${GREEN}🔗 合并 Universal Binary...${NC}"
mkdir -p "$TARGET_DIR/universal/release"

# 使用 lipo 合并二进制文件
lipo -create \
    "$TARGET_DIR/aarch64-apple-darwin/release/etools" \
    "$TARGET_DIR/x86_64-apple-darwin/release/etools" \
    -output "$TARGET_DIR/universal/release/etools"

# 验证 Universal Binary
echo -e "${YELLOW}✅ 验证 Universal Binary 架构:${NC}"
lipo -info "$TARGET_DIR/universal/release/etools"

# 4. 复制 arm64 版本的 .app 结构作为模板
echo -e "${GREEN}📦 创建 .app 包...${NC}"
UNIVERSAL_APP_BUNDLE="$TARGET_DIR/universal/release/bundle/macos/etools.app"
ARM64_APP_BUNDLE="$TARGET_DIR/aarch64-apple-darwin/release/bundle/macos/etools.app"

mkdir -p "$(dirname "$UNIVERSAL_APP_BUNDLE")"
cp -R "$ARM64_APP_BUNDLE" "$UNIVERSAL_APP_BUNDLE"

# 5. 替换二进制文件为 Universal Binary
echo -e "${GREEN}🔄 替换二进制文件...${NC}"
cp "$TARGET_DIR/universal/release/etools" "$UNIVERSAL_APP_BUNDLE/Contents/MacOS/etools"

# 6. 重新签名（Universal Binary 需要重新签名）
echo -e "${GREEN}✍️  重新签名应用...${NC}"
codesign --force --deep --sign - "$UNIVERSAL_APP_BUNDLE" 2>/dev/null || true

# 7. 创建 DMG（使用 Tauri 的 bundle 工具）
echo -e "${GREEN}💿 创建 DMG 安装包...${NC}"
cd "$PROJECT_DIR"

# 使用 Tauri CLI 构建 DMG（指定 universal target）
echo -e "${YELLOW}📝 注意：DMG 将仅包含当前架构的图标和元数据${NC}"

# 检查是否有 bundle-dmg.sh
if [ -f "$TARGET_DIR/aarch64-apple-darwin/release/bundle/dmg/bundle_dmg.sh" ]; then
    echo -e "${GREEN}使用现有 DMG 构建脚本...${NC}"

    # 手动创建 DMG
    DMG_DIR="$TARGET_DIR/universal/release/bundle/dmg"
    mkdir -p "$DMG_DIR"

    DMG_FILE="$DMG_DIR/etools_0.1.0_universal.dmg"

    # 创建临时磁盘镜像
    hdiutil create -volname "etools" -srcfolder "$UNIVERSAL_APP_BUNDLE" -ov -format UDZO "$DMG_FILE"

    echo -e "${GREEN}✅ DMG 创建完成: $DMG_FILE${NC}"
else
    echo -e "${YELLOW}⚠️  未找到 DMG 构建脚本，跳过 DMG 创建${NC}"
fi

# 8. 显示构建结果
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 构建完成！${NC}"
echo ""
echo -e "${YELLOW}📦 构建产物:${NC}"
echo -e "  - App Bundle: $UNIVERSAL_APP_BUNDLE"
echo -e "  - Binary: $TARGET_DIR/universal/release/etools"
if [ -f "$DMG_FILE" ]; then
    echo -e "  - DMG: $DMG_FILE"
    ls -lh "$DMG_FILE"
fi
echo ""
echo -e "${YELLOW}📊 架构信息:${NC}"
lipo -info "$TARGET_DIR/universal/release/etools"
echo ""
echo -e "${YELLOW}📏 文件大小:${NC}"
du -sh "$UNIVERSAL_APP_BUNDLE"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
