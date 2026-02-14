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

  build: {
    rollupOptions: {
      output: {
        // 多块打包：拆分为 vendor / 按路由的页面块，利于首屏加载与长期缓存
        manualChunks(id) {
          // React 全家桶单独成块，变更少、利于缓存
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/react-router")) {
            return "vendor-router";
          }
          // 动画与 UI 库可单独成块，首屏未必用到
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // 工具库
          if (id.includes("node_modules/axios") || id.includes("node_modules/dayjs")) {
            return "vendor-utils";
          }
          if (id.includes("node_modules/blueimp-md5")) {
            return "vendor-md5";
          }
          // 其余 node_modules 归为 vendor-other，避免主 chunk 过大
          if (id.includes("node_modules")) {
            return "vendor-other";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
