@echo off
echo Dang tim tien trinh dang dung cong 8081 (Metro bundler cho app mobile)...
powershell -NoProfile -Command "$conn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue; if ($conn) { $targetId = $conn[0].OwningProcess; try { Stop-Process -Id $targetId -Force -ErrorAction Stop; Write-Output ('Da dung tien trinh PID ' + $targetId) } catch { Write-Output ('Khong the tu dung PID ' + $targetId + ' (' + $_.Exception.Message + '). Hay mo Task Manager (chuot phai vao thanh taskbar - Task Manager), tim tien trinh Node.js co PID ' + $targetId + ', bam End Task. Neu van khong duoc, mo Task Manager bang quyen Administrator.') } } else { Write-Output 'Khong co tien trinh nao dang dung cong 8081 - Metro co the da dung san roi.' }"
pause
