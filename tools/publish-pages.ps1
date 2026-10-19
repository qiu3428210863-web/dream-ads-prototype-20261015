param()
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$repo = 'qiu3428210863-web/dream-ads-prototype-20261015'
$url = 'https://qiu3428210863-web.github.io/dream-ads-prototype-20261015/'
$origin = (& git remote get-url origin)
if ($origin -ne "https://github.com/${repo}.git") { throw 'Unexpected repository. Publication stopped.' }
if ((& git branch --show-current) -ne 'main') { throw 'Publish from main after committing the verified change.' }
& git diff --quiet
if ($LASTEXITCODE -ne 0) { throw 'Commit the intended tracked changes before publishing.' }
& git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { throw 'Commit staged changes before publishing.' }
& npm run check
if ($LASTEXITCODE -ne 0) { throw 'Checks failed; nothing was published.' }
& git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Source push failed.' }
$pagesCommit = & git subtree split --prefix dist
if ($LASTEXITCODE -ne 0) { throw 'Pages branch generation failed.' }
$pagesCommit = ($pagesCommit | Select-Object -Last 1).Trim()
& git push origin "${pagesCommit}:refs/heads/gh-pages"
if ($LASTEXITCODE -ne 0) { throw 'Pages push failed.' }
$built = $false
for ($attempt = 0; $attempt -lt 36; $attempt++) {
    $raw = & gh api "repos/${repo}/pages/builds/latest"
    if ($LASTEXITCODE -ne 0) { throw 'Could not verify Pages build.' }
    $build = $raw | ConvertFrom-Json
    if ($build.commit -eq $pagesCommit) {
        if ($build.status -eq 'built') { $built = $true; break }
        if ($build.status -eq 'errored') { throw "Pages build failed: $($build.error.message)" }
    }
    Write-Output "Waiting for Pages commit $pagesCommit ($($build.status))"
    Start-Sleep -Seconds 5
}
if (-not $built) { throw 'Pages did not finish in time. Inspect its deployment status before claiming success.' }
$online = (Invoke-WebRequest -Uri $url -TimeoutSec 30).Content
$expected = (& git show "${pagesCommit}:index.html") -join "`n"
if ($online.Replace("`r`n", "`n").TrimEnd() -ne $expected.Replace("`r`n", "`n").TrimEnd()) {
    throw 'Online page differs from the published commit. Check CDN propagation before claiming success.'
}
Write-Output "Published and verified: $url"
Write-Output "Pages commit: $pagesCommit"
