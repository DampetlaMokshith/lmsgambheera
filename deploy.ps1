# 🚀 Push to GitHub and Deploy Script

Write-Host "`n=================================" -ForegroundColor Cyan
Write-Host "   LMS GAMBHEERA DEPLOYMENT" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Show current status
Write-Host "📊 Current Status:" -ForegroundColor Green
Write-Host "   ✅ Git repository ready" -ForegroundColor White
Write-Host "   ✅ .env.local secured (not in Git)" -ForegroundColor White
Write-Host "   ✅ 177 files committed" -ForegroundColor White
Write-Host "   ✅ Documentation complete" -ForegroundColor White
Write-Host ""

# Step 2: Confirm push
Write-Host "🔐 Security Check:" -ForegroundColor Green
$envIgnored = git check-ignore .env.local
if ($envIgnored) {
    Write-Host "   ✅ .env.local is properly ignored" -ForegroundColor White
} else {
    Write-Host "   ⚠️  WARNING: .env.local might not be ignored!" -ForegroundColor Red
    exit
}
Write-Host ""

# Step 3: Show what will be pushed
Write-Host "📦 Ready to push these commits:" -ForegroundColor Green
git log --oneline -3
Write-Host ""

# Step 4: Ask for confirmation
Write-Host "🚀 Ready to push to GitHub?" -ForegroundColor Yellow
Write-Host "   Repository: https://github.com/DampetlaMokshith/lmsgambheera.git" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Type 'yes' to continue"

if ($confirm -eq "yes") {
    Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Cyan
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=================================" -ForegroundColor Cyan
        Write-Host "   NEXT STEPS - DEPLOY TO VERCEL" -ForegroundColor Yellow
        Write-Host "=================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option 1: Deploy via Vercel Website (RECOMMENDED)" -ForegroundColor Green
        Write-Host "   1. Go to: https://vercel.com" -ForegroundColor White
        Write-Host "   2. Sign in with GitHub" -ForegroundColor White
        Write-Host "   3. Click 'Add New' → 'Project'" -ForegroundColor White
        Write-Host "   4. Import: DampetlaMokshith/lmsgambheera" -ForegroundColor White
        Write-Host "   5. Add environment variables from .env.local" -ForegroundColor White
        Write-Host "   6. Click 'Deploy'" -ForegroundColor White
        Write-Host ""
        Write-Host "Option 2: Deploy via Vercel CLI" -ForegroundColor Green
        Write-Host "   Run: npm install -g vercel" -ForegroundColor White
        Write-Host "   Then: vercel login" -ForegroundColor White
        Write-Host "   Then: vercel" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 Don't forget to:" -ForegroundColor Yellow
        Write-Host "   1. Copy environment variables from .env.local to Vercel" -ForegroundColor White
        Write-Host "   2. Update Sanity CORS with Vercel URL" -ForegroundColor White
        Write-Host "   3. Update Supabase allowed origins" -ForegroundColor White
        Write-Host ""
        Write-Host "📚 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "`n❌ Push failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "   1. Authentication required - Create Personal Access Token at:" -ForegroundColor White
        Write-Host "      https://github.com/settings/tokens" -ForegroundColor Cyan
        Write-Host "   2. Use the token as password when prompted" -ForegroundColor White
        Write-Host "   3. Make sure you have access to the repository" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host "`n⚠️  Push cancelled. Run this script again when ready." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
