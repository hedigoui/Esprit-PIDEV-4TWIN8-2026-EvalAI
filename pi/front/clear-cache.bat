@echo off
echo Clearing Vite cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache found.
)

if exist "dist" (
    rmdir /s /q "dist"
    echo Dist folder cleared!
)

echo.
echo Cache cleared! Now restart your dev server with: npm run dev
echo.
pause
