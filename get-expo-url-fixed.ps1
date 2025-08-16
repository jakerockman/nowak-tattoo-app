# Get Expo Development URL for Supabase Configuration
# Run this script to find your current Expo development URL

Write-Host "Finding your Expo development URL..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from your project root directory." -ForegroundColor Yellow
    Write-Host "Current directory: $currentDir" -ForegroundColor Gray
    exit 1
}

# Check if Expo CLI is available
try {
    $expoVersion = npx expo --version 2>$null
    Write-Host "Expo CLI found (version: $expoVersion)" -ForegroundColor Green
} catch {
    Write-Host "Expo CLI not found!" -ForegroundColor Red
    Write-Host "Installing Expo CLI..." -ForegroundColor Yellow
    npm install -g @expo/cli
}

Write-Host ""
Write-Host "Getting your local IP address..." -ForegroundColor Cyan

# Get local IP address
$localIP = (Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -eq "Dhcp"}).IPAddress | Select-Object -First 1

if ($localIP) {
    Write-Host "Found local IP: $localIP" -ForegroundColor Green
    
    # Construct Expo URL
    $expoUrl = "exp://$localIP:8081"
    
    Write-Host ""
    Write-Host "Your Expo Development URLs:" -ForegroundColor Cyan
    Write-Host "   Site URL:     $expoUrl" -ForegroundColor White
    Write-Host "   Redirect URL: $expoUrl/**" -ForegroundColor White
    
    Write-Host ""
    Write-Host "SQL Command for Supabase:" -ForegroundColor Cyan
    Write-Host "UPDATE auth.config SET site_url = '$expoUrl';" -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the SQL command above" -ForegroundColor White
    Write-Host "2. Go to Supabase Dashboard -> SQL Editor" -ForegroundColor White
    Write-Host "3. Paste and run the SQL command" -ForegroundColor White
    Write-Host "4. Or update manually in Dashboard -> Authentication -> Settings" -ForegroundColor White
    
    Write-Host ""
    Write-Host "To start your Expo app:" -ForegroundColor Cyan
    Write-Host "npx expo start" -ForegroundColor Yellow
    
} else {
    Write-Host "Could not find local IP address!" -ForegroundColor Red
    Write-Host "Manual steps:" -ForegroundColor Yellow
    Write-Host "1. Run: npx expo start" -ForegroundColor White
    Write-Host "2. Look for Metro waiting on exp://[IP_ADDRESS]:8081" -ForegroundColor White
    Write-Host "3. Use that URL in your Supabase configuration" -ForegroundColor White
}

Write-Host ""
Write-Host "Remember: Update this URL in Supabase every time your IP changes!" -ForegroundColor Magenta
