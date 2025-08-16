# Simple Expo URL Generator for Supabase
Write-Host "Getting your Expo development URL for Supabase..." -ForegroundColor Cyan
Write-Host ""

# Get local IP
$ip = (Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null}).IPv4Address.IPAddress

if ($ip) {
    $expoUrl = "exp://$ip:8081"
    Write-Host "SUCCESS! Your Expo URL is:" -ForegroundColor Green
    Write-Host $expoUrl -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Copy this SQL command for Supabase:" -ForegroundColor Cyan
    Write-Host "UPDATE auth.config SET site_url = '$expoUrl';" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually enter in Supabase Dashboard:" -ForegroundColor Cyan
    Write-Host "Authentication -> Settings -> Site URL: $expoUrl" -ForegroundColor White
} else {
    Write-Host "Could not auto-detect IP. Manual method:" -ForegroundColor Yellow
    Write-Host "1. Run: npx expo start" -ForegroundColor White
    Write-Host "2. Look for the exp:// URL in the output" -ForegroundColor White
    Write-Host "3. Use that URL in Supabase Site URL setting" -ForegroundColor White
}
