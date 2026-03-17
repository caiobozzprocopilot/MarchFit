@echo off
REM Inicia o WAHA (Docker) e o backend MarchFit automaticamente

REM Aguarda Docker estar pronto
timeout /t 10 /nobreak > nul

REM Inicia container WAHA (já existe, só precisa dar start)
docker start waha

REM Aguarda WAHA subir
timeout /t 5 /nobreak > nul

REM Inicia o backend via PM2
call C:\Users\caiob\AppData\Roaming\npm\pm2.cmd resurrect

echo MarchFit iniciado com sucesso!
