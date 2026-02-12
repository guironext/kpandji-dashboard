# PowerShell script to run Prisma Studio with DATABASE_URL from .env

$envFile = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $envFile) {
    $content = Get-Content $envFile
    $databaseUrl = $content | Where-Object { $_ -match '^DATABASE_URL=' } | ForEach-Object {
        $_.Split('=', 2)[1].Trim()
    }
    
    if ($databaseUrl) {
        Write-Host "✓ DATABASE_URL loaded from .env" -ForegroundColor Green
        Write-Host "Starting Prisma Studio..." -ForegroundColor Cyan
        
        # Set environment variable and run Prisma Studio
        $env:DATABASE_URL = $databaseUrl
        npx prisma studio --url $databaseUrl
    } else {
        Write-Host "✗ Error: DATABASE_URL not found in .env file" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Error: .env file not found at $envFile" -ForegroundColor Red
    exit 1
}
