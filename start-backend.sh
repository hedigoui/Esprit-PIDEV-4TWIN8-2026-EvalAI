#!/bin/bash

# SpeechOcean Backend Startup Script for macOS/Linux

echo ""
echo "===================================="
echo "  SpeechOcean Backend Startup"
echo "===================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Navigate to backend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/speechocean762/app/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Could not find backend directory at $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"
echo "Current directory: $(pwd)"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "Error: Failed to create virtual environment"
        exit 1
    fi
    echo "Virtual environment created successfully"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "Installing dependencies..."
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

echo "Installing Whisper and PyTorch..."
pip install -q openai-whisper torch
if [ $? -ne 0 ]; then
    echo "Warning: Some dependencies may not have installed fully"
fi

echo ""
echo "===================================="
echo "  Starting Flask Backend Server"
echo "===================================="
echo ""
echo "Server will run on: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Flask app
python app.py
