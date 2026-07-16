import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom 模拟浏览器环境，让 React 组件可以在测试中渲染
    environment: "jsdom",
    pool: "threads",
    // 不测这些目录
    exclude: ["src-tauri/**", "node_modules/**", "dist/**"],
  },
});
