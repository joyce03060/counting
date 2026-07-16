# 通行证检查脚本 — git-save 的 PreToolUse 钩子
# Claude Code 通过 stdin 传入工具调用的 JSON 信息
# 只在 git-save 被调用时检查通行证，其他技能直接放行
# exit 0 = 放行，exit 1 = 拦截

# 读取 Claude Code 传入的工具调用信息
$rawInput = $input | Out-String
if (-not $rawInput) {
    # 没有 stdin 输入，可能是手动测试，直接放行
    exit 0
}

try {
    $toolCall = $rawInput | ConvertFrom-Json
} catch {
    exit 0
}

# 只拦截 git-save 技能
$skillName = $toolCall.tool_input?.skill
if ($skillName -ne "git-save") {
    exit 0
}

# --- 以下只对 git-save 执行 ---

$resultsDir = ".claude/results"
$unitFile = Join-Path $resultsDir "unit-test.json"
$qualityFile = Join-Path $resultsDir "quality.json"

$errors = @()

# 检查 unit-test 通行证
if (-not (Test-Path $unitFile)) {
    $errors += "缺少 unit-test 通行证"
} else {
    try {
        $unit = Get-Content $unitFile -Raw | ConvertFrom-Json
        if (-not $unit.passed) {
            $errors += "unit-test 未通过（$($unit.failed)/$($unit.total) 失败）"
        }
    } catch {
        $errors += "unit-test 通行证格式损坏"
    }
}

# 检查 quality 通行证
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

# 判断
if ($errors.Count -eq 0) {
    exit 0  # 放行
} else {
    Write-Host ""
    Write-Host "🔴 质量门禁拦截 — 通行证无效"
    foreach ($e in $errors) {
        Write-Host "   ❌ $e"
    }
    Write-Host ""
    Write-Host "   请先运行 tester + quality-engineer 获取通行证："
    Write-Host "   在 Claude Code 中输入: 运行单元测试和质量检查"
    Write-Host "   或使用: /git-commit-agent 完整门禁提交"
    exit 1  # 拦截
}
