param(
    [Parameter(Mandatory = $true)]
    [string]$Video,
    [string]$OutputDir = ".\video-analysis",
    [int]$IntervalSeconds = 8,
    [int]$SegmentSeconds = 90,
    [int]$Columns = 4,
    [int]$ThumbWidth = 180
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $Video)) { throw "Video not found: $Video" }
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$duration = [double](& ffprobe -v error -show_entries format=duration -of csv=p=0 -- $Video)
$segmentCount = [Math]::Ceiling($duration / $SegmentSeconds)
$rows = [Math]::Ceiling(($SegmentSeconds / $IntervalSeconds) / $Columns)

for ($i = 0; $i -lt $segmentCount; $i++) {
    $start = $i * $SegmentSeconds
    $output = Join-Path $OutputDir ("overview-{0:D2}.jpg" -f ($i + 1))
    $filter = "fps=1/$IntervalSeconds,scale=${ThumbWidth}:-2,tile=${Columns}x${rows}:padding=4:margin=4"
    & ffmpeg -hide_banner -loglevel error -ss $start -t $SegmentSeconds -i $Video `
        -vf $filter -frames:v 1 -q:v 6 -y $output
}

Write-Host "Created $segmentCount contact sheet(s) in $OutputDir"
