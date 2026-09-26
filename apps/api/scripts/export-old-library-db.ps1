<#
  Đọc file Access (.accdb/.mdb) của phần mềm thư viện cũ (lược đồ TpTacPham*/DgDocGia/DgMuonTra)
  và xuất ra 1 file JSON chuẩn hoá {books, patrons, loans} để apps/api nhập vào CSDL mới.

  Không trích ảnh đại diện độc giả (trường "Hinh" là đối tượng OLE nhúng - Word/Metafile,
  không phải ảnh JPEG thuần, không dùng được) - xem CLAUDE.md/HANDOFF.md để biết chi tiết.

  Usage: powershell -File export-old-library-db.ps1 -DbPath "C:\path\DataThuVien.accdb" -OutPath "C:\out.json"
#>
param(
  [Parameter(Mandatory = $true)][string]$DbPath,
  [Parameter(Mandatory = $true)][string]$OutPath
)

$ErrorActionPreference = "Stop"

function Esc([object]$v) {
  if ($null -eq $v) { return "null" }
  $s = "$v" -replace '\\', '\\\\' -replace '"', '\"'
  $s = [regex]::Replace($s, '[\x00-\x1F]', ' ')
  return "`"$s`""
}

function EscDate([object]$v) {
  if ($null -eq $v) { return "null" }
  return "`"" + ([DateTime]$v).ToString("yyyy-MM-ddTHH:mm:ss") + "`""
}

$provider = $null
foreach ($p in @("Microsoft.ACE.OLEDB.16.0", "Microsoft.ACE.OLEDB.12.0")) {
  try {
    $test = New-Object System.Data.OleDb.OleDbConnection("Provider=$p;Data Source=$DbPath;")
    $test.Open()
    $test.Close()
    $provider = $p
    break
  } catch {}
}
if (-not $provider) {
  Write-Error "Không kết nối được file Access. Cần cài 'Microsoft Access Database Engine' (ACE OLEDB) trên máy chạy thuvien-api."
  exit 1
}

$conn = New-Object System.Data.OleDb.OleDbConnection("Provider=$provider;Data Source=$DbPath;")
$conn.Open()

$sb = New-Object System.Text.StringBuilder
[void]$sb.Append("{")

# ---------- books (1 dòng = 1 bản sao vật lý, kèm mã vạch gốc) ----------
[void]$sb.Append("`"books`":[")
$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT p.MaTpPop, c.TenTacPham, g.TenTacGia, g.KyHieuTg, x.NhaXB, p.NamXuatBan,
       c.ISBN, c.TomLuoc, n.NgonNgu, d.DDC
FROM (((((TpTacPhamPop p
  INNER JOIN TpTacPhamCom c ON p.MaTpCom = c.MaTpCom)
  LEFT JOIN TpDDC d ON c.MaDDC = d.MaDDC)
  LEFT JOIN TpNhaXB x ON p.MaNhaXB = x.MaNhaXB)
  LEFT JOIN TpNgonNgu n ON c.MaNgonNgu = n.MaNgonNgu)
  LEFT JOIN TpListTacGia g ON c.MaKyHieuTg = g.MaListTG)
"@
$rdr = $cmd.ExecuteReader()
$first = $true
while ($rdr.Read()) {
  if (-not $first) { [void]$sb.Append(",") }
  $first = $false
  [void]$sb.Append("{")
  [void]$sb.Append("`"barcode`":" + (Esc($rdr.GetValue(0))) + ",")
  [void]$sb.Append("`"title`":" + (Esc($rdr.GetValue(1))) + ",")
  [void]$sb.Append("`"author`":" + (Esc($rdr.GetValue(2))) + ",")
  [void]$sb.Append("`"authorMark`":" + (Esc($rdr.GetValue(3))) + ",")
  [void]$sb.Append("`"publisher`":" + (Esc($rdr.GetValue(4))) + ",")
  [void]$sb.Append("`"publishedYear`":" + (Esc($rdr.GetValue(5))) + ",")
  [void]$sb.Append("`"isbn`":" + (Esc($rdr.GetValue(6))) + ",")
  [void]$sb.Append("`"description`":" + (Esc($rdr.GetValue(7))) + ",")
  [void]$sb.Append("`"language`":" + (Esc($rdr.GetValue(8))) + ",")
  [void]$sb.Append("`"ddc`":" + (Esc($rdr.GetValue(9))))
  [void]$sb.Append("}")
}
$rdr.Close()
[void]$sb.Append("],")

# ---------- patrons ----------
[void]$sb.Append("`"patrons`":[")
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT MaDocGia, HoVaTen, Email, MaArchive FROM DgDocGia"
$rdr = $cmd.ExecuteReader()
$first = $true
while ($rdr.Read()) {
  if (-not $first) { [void]$sb.Append(",") }
  $first = $false
  [void]$sb.Append("{")
  [void]$sb.Append("`"oldCode`":" + (Esc($rdr.GetValue(0))) + ",")
  [void]$sb.Append("`"fullName`":" + (Esc($rdr.GetValue(1))) + ",")
  [void]$sb.Append("`"email`":" + (Esc($rdr.GetValue(2))) + ",")
  [void]$sb.Append("`"maArchive`":" + (Esc($rdr.GetValue(3))))
  [void]$sb.Append("}")
}
$rdr.Close()
[void]$sb.Append("],")

# ---------- loans (lịch sử mượn/trả) ----------
[void]$sb.Append("`"loans`":[")
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT MaDocGia, MaTpPop, NgayMuon, HanTra, NgayTra FROM DgMuonTra"
$rdr = $cmd.ExecuteReader()
$first = $true
while ($rdr.Read()) {
  if (-not $first) { [void]$sb.Append(",") }
  $first = $false
  [void]$sb.Append("{")
  [void]$sb.Append("`"oldPatronCode`":" + (Esc($rdr.GetValue(0))) + ",")
  [void]$sb.Append("`"barcode`":" + (Esc($rdr.GetValue(1))) + ",")
  if ($rdr.IsDBNull(2)) { [void]$sb.Append("`"borrowedAt`":null,") } else { [void]$sb.Append("`"borrowedAt`":" + (EscDate($rdr.GetValue(2))) + ",") }
  if ($rdr.IsDBNull(3)) { [void]$sb.Append("`"dueDate`":null,") } else { [void]$sb.Append("`"dueDate`":" + (EscDate($rdr.GetValue(3))) + ",") }
  if ($rdr.IsDBNull(4)) { [void]$sb.Append("`"returnedAt`":null") } else { [void]$sb.Append("`"returnedAt`":" + (EscDate($rdr.GetValue(4)))) }
  [void]$sb.Append("}")
}
$rdr.Close()
[void]$sb.Append("]")

[void]$sb.Append("}")
$conn.Close()

[System.IO.File]::WriteAllText($OutPath, $sb.ToString(), [System.Text.Encoding]::UTF8)
Write-Output "OK"
