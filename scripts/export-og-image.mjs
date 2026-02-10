#!/usr/bin/env node
/**
 * 将 public/og-image.svg 转换为 public/og-image.png
 * 运行: pnpm og:export 或 node scripts/export-og-image.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "og-image.svg");
const pngPath = join(root, "public", "og-image.png");

try {
  const { Resvg } = await import("@resvg/resvg-js");
  const svg = readFileSync(svgPath, "utf-8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const { writeFileSync } = await import("fs");
  writeFileSync(pngPath, pngBuffer);
  console.log("✓ og-image.png 已生成");
} catch (err) {
  if (
    err.code === "ERR_MODULE_NOT_FOUND" ||
    err.message?.includes("@resvg/resvg-js")
  ) {
    console.warn(
      "提示: 需要安装 @resvg/resvg-js 才能自动转换。请运行: pnpm add -D @resvg/resvg-js",
    );
    console.warn(
      "或手动将 public/og-image.svg 在浏览器中打开并截图导出为 1200×630 PNG",
    );
  } else {
    throw err;
  }
}
