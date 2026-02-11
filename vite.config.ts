import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ESM 环境下安全获取当前目录
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  // 路径别名配置（与 tsconfig.json 中的 @/* 保持一致）
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
