# 通行证检查脚本 — Bash(git *) 的 PreToolUse 钩子
# Claude Code 通过 stdin 传入工具调用的 JSON 信息
# 只在 git commit 和 git push 前检查通行证，其他 git 命令直接放行
# exit 0 = 放行，exit 1 = 拦截

$rawInput = $input | Out-String
if (-not $rawInput) { exit 0 }

try { $toolCall = $rawInput | ConvertFrom-Json } catch { exit 0 }

# 提取 git 命令（如 "git commit -m 'xxx'"、"git push origin main"）
$gitCmd = $toolCall.tool_input?.command ?? ""
if ($gitCmd -notmatch '^git\s') { exit 0 }

# 只拦截 commit 和 push
$isCommit = $gitCmd -match '^git\s+commit\b'
$isPush   = $gitCmd -match '^git\s+push\b'

if (-not $isCommit -and -not $isPush) { exit 0 }

# --- 以下只对 git commit / git push 执行 ---

$resultsDir = ".claude/results"
$unitFile = Join-Path $resultsDir "unit-test.json"
$qualityFile = Join-Path $resultsDir "quality.json"
$errors = @()

if (-not (Test-Path $unitFile)) {
    $errors += "缺少 unit-test 通行证"
} else {
    try {
        $unit = Get-Content $unitFile -Raw | ConvertFrom-Json
        if (-not $unit.passed) {
            $errors += "单元测试未通过（$($unit.failed)/$($unit.total) 失败）"
        }
    } catch {
        $errors += "unit-test 通行证格式损坏"
    }
}

if (-not (Test-Path $qualityFile)) {
    $errors += "缺少 quality 通行证"
} else {
    try {
        $quality = Get-Content $qualityFile -Raw | ConvertFrom-Json
        if ($quality.security_high_risks -gt 0) {
            $errors += "安全审计未通过（$($quality.security_high_risks) 个高危风险）"
        }
        if ($quality.comments_stale -gt 0) {
            $errors += "注释检查未通过（$($quality.comments_stale) 个过时注释）"
        }
    } catch {
        $errors += "quality 通行证格式损坏"
    }
}

if ($errors.Count -eq 0) {
    exit 0
} else {
    Write-Host ""
    Write-Host "🔴 质量门禁拦截 — 通行证无效"
    foreach ($e in $errors) { Write-Host "   ❌ $e" }
    Write-Host ""
    Write-Host "   请先运行 tester + quality-engineer 获取通行证"
    Write-Host "   或使用: /git-commit-agent 完整门禁提交"
    exit 1
}
