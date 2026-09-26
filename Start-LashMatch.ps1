$ErrorActionPreference = 'Stop'
try {
    Set-Location -LiteralPath $PSScriptRoot
    $phpCandidates = @('C:\xamppppp\php\php.exe', 'C:\xampp\php\php.exe', 'C:\xamp\php\php.exe')
    $phpCommand = Get-Command php -ErrorAction SilentlyContinue
    if ($phpCommand) { $phpCandidates += $phpCommand.Source }
    $lashPhp = $phpCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $lashPhp) { throw 'PHP was not found. Install XAMPP or update the PHP path in Start-LashMatch.ps1.' }
    & $lashPhp (Join-Path $PSScriptRoot 'check-database.php')
    if ($LASTEXITCODE -ne 0) { throw 'Start MySQL from your XAMPP Control Panel, then open START-LASHMATCH.cmd again.' }
    & $lashPhp (Join-Path $PSScriptRoot 'migrate.php')
    if ($LASTEXITCODE -ne 0) { throw 'Database upgrade failed. Check the message above.' }
    $url = 'http://localhost:8080/'
    $existing = $null
    try { $existing = Invoke-RestMethod 'http://localhost:8080/api.php?action=session' -TimeoutSec 2 } catch {}
    if (-not $existing.csrf) {
        $server = Start-Process -FilePath $lashPhp -ArgumentList '-S localhost:8080 -t .' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $PSScriptRoot 'lashmatch-server.log') -RedirectStandardError (Join-Path $PSScriptRoot 'lashmatch-server-error.log') -PassThru
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            Start-Sleep -Milliseconds 250
            if ($server.HasExited) { throw 'The web server could not start. Check lashmatch-server-error.log; port 8080 may be in use.' }
            try { $existing = Invoke-RestMethod 'http://localhost:8080/api.php?action=session' -TimeoutSec 1 } catch {}
            if ($existing.csrf) { break }
        }
        if (-not $existing.csrf) { throw 'The web server did not respond. Check lashmatch-server-error.log.' }
    }
    Write-Host "LashMatch is ready: $url"
    Start-Process $url
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}
