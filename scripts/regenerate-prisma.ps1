# Regenerate Prisma client - run this when you get "prisma.message is undefined" errors
# Close Prisma Studio and stop the dev server (Ctrl+C) before running this script

Write-Host "Regenerating Prisma client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! You can now restart the dev server with: npm run dev" -ForegroundColor Green
} else {
    Write-Host "Failed. Make sure the dev server and Prisma Studio are closed, then try again." -ForegroundColor Red
}
