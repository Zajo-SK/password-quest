@echo off
rem Password Quest - spustenie na Windows: lokalny server a otvorenie v prehliadaci.
cd /d "%~dp0"
echo Password Quest bezi na http://localhost:8080
echo Toto okno nechaj otvorene. Aplikaciu ukoncis zatvorenim okna.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080"
where py >nul 2>nul && (py -3 -m http.server 8080 & goto :eof)
where python >nul 2>nul && (python -m http.server 8080 & goto :eof)
echo.
echo Python nie je nainstalovany. Stiahni ho z https://www.python.org/downloads/
echo (pri instalacii zaskrtni "Add Python to PATH") a spusti tento subor znova.
pause
