---
name: run-app
description: 启动记账app（Tauri 桌面应用）。Run `npm run tauri dev` on Windows to launch the app.
---

# 启动记账app

记账app 是一个 Tauri v2 桌面应用（React + TypeScript 前端，Rust 后端）。

## 启动命令

```bash
npm run tauri dev
```

这同时启动两个东西：
- **Vite 开发服务器** → `http://localhost:1420`
- **Tauri Rust 后端** → 编译后打开原生桌面窗口（900×700）

启动后窗口会自动出现在桌面上，底部有 4 个标签：📝 记账 / 📊 统计 / ⚙️ 设置 / 🎮 游戏。

## 前置条件

- **Node.js** + npm（`npm --version` 可用即可）
- **Rust 工具链**（Tauri 需要）— 安装方法：`winget install Rustlang.Rustup`
- 确保 `npm install` 已执行过

## 启动耗时

| 场景 | 耗时 |
|------|------|
| 首次编译（Rust 420 个包） | ~10 分钟 |
| 仅改前端代码（不改 Rust） | ~5 秒 |
| 改了 Rust 代码 | ~23 秒增量编译 |

## 常见问题

### 报错 "failed to read plugin permissions" (找不到路径)

这是构建缓存中残留了旧的项目路径。清理后重试：

```powershell
Remove-Item -Recurse -Force src-tauri/target -ErrorAction SilentlyContinue
npm run tauri dev
```

### Vite 启动但窗口没出现

Rust 编译还没完成——等进度条跑完。控制台会显示 `Building [=====> ] 420/420` 直到完成。

### 端口 1420 被占用

Vite 会自动尝试下一个端口。但 Tauri 配置写死了 1420，如果端口被占，杀掉占用进程：

```powershell
netstat -ano | findstr :1420
taskkill /PID <PID> /F
```

## 关闭应用

直接关闭桌面窗口即可（Vite + Rust 进程会自动退出）。如果在 PowerShell 中按 `Ctrl+C`，会同时终止前后端。
