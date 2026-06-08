# OVERCLOCK auto-deploy watcher
# Watches the key files and pushes to GitHub whenever they change.
# Render then auto-deploys. Leave this window open while you work.
Set-Location -Path $PSScriptRoot
$files = @("game.htm","server.js","package.json")
function Stamp {
  ($files | Where-Object { Test-Path $_ } | ForEach-Object { (Get-Item $_).LastWriteTimeUtc.Ticks }) -join ","
}
$last = Stamp
Write-Host ""
Write-Host "  OVERCLOCK auto-deploy is now watching for changes." -ForegroundColor Cyan
Write-Host "  Keep this window open. (Ctrl+C or close it to stop.)"
Write-Host ""
while ($true) {
  Start-Sleep -Seconds 5
  $now = Stamp
  if ($now -ne $last) {
    $last = $now
    Start-Sleep -Seconds 2   # let the file finish writing
    $t = Get-Date -Format "HH:mm:ss"
    Write-Host "[$t] change detected -- deploying..." -ForegroundColor Yellow
    git add -A | Out-Null
    git commit -m ("auto-deploy " + (Get-Date -Format "yyyy-MM-dd HH:mm")) 2>$null | Out-Null
    git push origin main
    Write-Host "[$t] pushed. Render will redeploy in ~1-2 min." -ForegroundColor Green
  }
}
