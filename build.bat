@echo off
echo Building PowerPoint Remote WebApp...
pyinstaller --noconfirm --onefile --windowed --add-data "static;static" --name "PPRemote" main.py
echo Build complete! You can find the executable in the "dist" folder.
pause
