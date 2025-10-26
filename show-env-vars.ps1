# 🔑 Environment Variables Helper for Vercel

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   VERCEL ENVIRONMENT VARIABLES GUIDE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 You need to copy these 10 environment variables to Vercel:" -ForegroundColor Green
Write-Host ""

# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "✅ Found .env.local file" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Here are your environment variable NAMES:" -ForegroundColor Yellow
    Write-Host "(Copy the VALUES from .env.local to Vercel)" -ForegroundColor White
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    # Read and display variable names
    $envVars = @(
        "NEXT_PUBLIC_SANITY_PROJECT_ID",
        "NEXT_PUBLIC_SANITY_DATASET",
        "NEXT_PUBLIC_SANITY_API_VERSION",
        "NEXT_PUBLIC_SANITY_READ_TOKEN",
        "SANITY_API_TOKEN",
        "SANITY_API_WRITE_TOKEN",
        "NEXT_PUBLIC_SANITY_EDITOR_TOKEN",
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    $count = 1
    foreach ($var in $envVars) {
        Write-Host "  $count. $var" -ForegroundColor White
        
        # Try to read the value length (without showing it)
        $content = Get-Content .env.local | Select-String "^$var="
        if ($content) {
            Write-Host "     ✅ Found in .env.local" -ForegroundColor Green
        } else {
            Write-Host "     ⚠️  NOT found in .env.local" -ForegroundColor Red
        }
        Write-Host ""
        $count++
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔐 SECURITY REMINDER:" -ForegroundColor Yellow
    Write-Host "   • Never share these values publicly" -ForegroundColor White
    Write-Host "   • Never commit .env.local to Git" -ForegroundColor White
    Write-Host "   • Only add them in Vercel's dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 How to add to Vercel:" -ForegroundColor Green
    Write-Host "   1. Go to: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   2. Select your project" -ForegroundColor White
    Write-Host "   3. Go to: Settings → Environment Variables" -ForegroundColor White
    Write-Host "   4. Add each variable:" -ForegroundColor White
    Write-Host "      • Name: (from the list above)" -ForegroundColor White
    Write-Host "      • Value: (copy from your .env.local)" -ForegroundColor White
    Write-Host "      • Environments: Production, Preview, Development" -ForegroundColor White
    Write-Host "   5. Click 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 TIP: Open .env.local in a text editor to see the values" -ForegroundColor Cyan
    Write-Host "   Then copy-paste each value to Vercel" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure .env.local exists in:" -ForegroundColor Yellow
    Write-Host "   $(Get-Location)" -ForegroundColor White
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Offer to show the .env.local content
$showEnv = Read-Host "Do you want to open .env.local in notepad? (yes/no)"
if ($showEnv -eq "yes" -and (Test-Path .env.local)) {
    notepad .env.local
}
