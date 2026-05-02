# Strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ProfilerPath = Join-Path $ProjectRoot "backend\scripts\profile_performance_headless.py"
$LogDir = Join-Path $ProjectRoot "reports"
$LogFile = Join-Path $LogDir "performance_log.txt"

# Main
try {
    # Check for reports directory
    if (-not (Test-Path $LogDir)) {
        Write-Output "[i] Creating reports directory..."
        New-Item -Path $LogDir -ItemType Directory | Out-Null
    }

    # Verify profiler script exists
    if (-not (Test-Path $ProfilerPath)) {
        Write-Warning "[!] Profiler script not found at: $ProfilerPath"
        exit 1
    }

    Write-Output "[...] Starting SignBridge Performance Profiling..."
    
    # Run profiling using uv
    # We use Start-Process or just direct call. Since we want output, direct call or & is better.
    # Adhering to skill: Wrap cmdlet calls in parentheses when using logical operators (not used here yet but good practice).
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "--- Benchmarking Session: $Timestamp ---" | Out-File $LogFile -Append -Encoding ascii

    # Run with uv
    # Use -NoNewWindow to keep output in same terminal if needed, but here we just run it.
    & uv run python $ProfilerPath | Tee-Object -FilePath $LogFile -Append

    Write-Output "[+] Profiling complete. Results saved to: $LogFile"
    exit 0
}
catch {
    Write-Warning "[!] Error during benchmarking: $_"
    exit 1
}
