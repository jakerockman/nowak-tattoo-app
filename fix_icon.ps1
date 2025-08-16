# PowerShell script to fix the icon in ChatScreen.tsx
$content = Get-Content "screens\ChatScreen.tsx" -Raw
$content = $content -replace '<Text style=\{styles\.imageButtonIcon\}>.*?</Text>', '<ImageIcon size={24} color="#007AFF" strokeWidth={2} />'
$content | Set-Content "screens\ChatScreen.tsx" -Encoding UTF8
Write-Host "Icon replaced successfully!"
