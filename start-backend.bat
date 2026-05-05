@echo off
REM SpeechOcean Backend Startup Script for Windows

echo.
echo ====================================
echo   SpeechOcean Backend Startup
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python and add it to your system PATH
    pause
    exit /b 1
)

REM Navigate to backend directory
cd /d "%~dp0speechocean762\app\backend" || (
    echo Error: Could not find backend directory
    echo Expected: %~dp0speechocean762\app\backend
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -q -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo Installing Whisper and PyTorch...
pip install -q openai-whisper torch
if %errorlevel% neq 0 (
    echo Warning: Some dependencies may not have installed fully
)

echo.
echo ====================================
echo   Starting Flask Backend Server
echo ====================================
echo.
echo Server will run on: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Start the Flask app
python app.py

pause
