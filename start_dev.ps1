
# start_dev.ps1
Write-Host "Starting backend server..."
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd backend; node src/index.js`""

Write-Host "Starting frontend development server..."
Start-Process powershell.exe -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`""

Write-Host "Development servers started in separate windows."
Write-Host "You can close this window after the other two have launched."
