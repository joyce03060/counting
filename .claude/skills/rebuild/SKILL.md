---
name: rebuild
description: 清除旧的打包产物，将记账app重新打包成安装程序（.exe / .msi）
---

# 重新打包应用

## 这个技能做什么

- 删除之前打包留下的旧 `.exe` 和 `.msi` 安装程序
- 从头编译前端 + Rust 后端，打包成全新的安装文件

打个比方：就像把旧衣服全扔掉，去裁缝店从头做一件新衣服。比 `npm run tauri dev`（临时试穿）要久得多，但产出的是可以直接发给别人安装的文件。

---

## 打包命令

```powershell
# 第一步：删除旧的打包产物
Remove-Item -Recurse -Force "src-tauri/target/release/bundle" -ErrorAction SilentlyContinue

# 第二步：重新打包
npm run tauri build
```

---

## 打包产物

打包成功后，在 `src-tauri/target/release/bundle/` 下会生成：

| 平台 | 文件类型 | 示例 |
|------|----------|------|
| Windows | `.msi` 安装包 | `记账app_0.1.0_x64_zh-CN.msi` |
| Windows | `.exe` 安装程序 | `记账app_0.1.0_x64-setup.exe` |

---

## 耗时

| 阶段 | 耗时 |
|------|------|
| 前端构建（TypeScript + Vite） | ~10 秒 |
| Rust 编译（420 个包，release 模式优化） | ~5-10 分钟 |
| 打包成安装程序 | ~30 秒 |

总共预计 **5-10 分钟**（首次更久，后续增量编译会快一些）。

---

## 清理范围说明

只删除 `src-tauri/target/release/bundle/` 目录（打包产物），**不删 Rust 编译缓存**（`src-tauri/target/release/` 下的其他文件），这样 rebuild 能利用已有的编译结果，不用从头编译 420 个包。

如果完全从头来（比如改了 Rust 代码或 ta Conf），可以清整个 target：

```powershell
Remove-Item -Recurse -Force "src-tauri/target" -ErrorAction SilentlyContinue
npm run tauri build
```

但这会让编译时间回到 10 分钟左右。

---

## 版本号

打包出来的文件名里包含版本号，当前版本是 `0.1.0`。要改版本号，编辑 `src-tauri/tauri.conf.json` 里的 `"version"` 字段。
