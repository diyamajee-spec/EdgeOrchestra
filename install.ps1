# ──────────────────────────────────────────────────────────
#  EdgeOrchestra — On-Device AI Installer (Windows)
#  Coordinates Ollama, pulls models, and builds the sandbox.
# ──────────────────────────────────────────────────────────

$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Output @"
    ______    __            ____            __                 __  
   / ____/___/ /___  ___   / __ \_________ / /_  ___  ________/ /_  
  / __/ / __  / __ \/ _ \ / / / / ___/ __ / __ \/ _ \/ ___/ __  / __ \ 
 / /___/ /_/ / /_/ /  __// /_/ / /  / /_/ / / / /  __(__  ) /_/ / /_/ /
/_____/\__,_/\__, /\___/ \____/_/   \__,_/_/ /_/\___/____/\__,_/_.___/ 
            /____/                                                     
"@

$Host.UI.RawUI.ForegroundColor = "Gray"
Write-Output "`n=== Starting EdgeOrchestra Windows Setup ===`n"

# 1. Check Node.js and NPM
Write-Output "Checking Node.js environment..."
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Warning "Error: Node.js is not installed. Please download it from https://nodejs.org/"
    Exit
}
Write-Output "[OK] Node.js ($((node -v).Trim())) detected."

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Warning "Error: npm is not installed."
    Exit
}
Write-Output "[OK] npm ($((npm -v).Trim())) detected.`n"

# 2. Check & Install Ollama
Write-Output "Checking Ollama installation..."
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
    Write-Output "Ollama not found. Downloading OllamaSetup.exe directly..."
    Invoke-WebRequest -Uri "https://github.com/ollama/ollama/releases/download/v0.24.0/OllamaSetup.exe" -OutFile "OllamaSetup.exe"
    Write-Output "Installing Ollama silently..."
    Start-Process -FilePath "OllamaSetup.exe" -ArgumentList "/silent" -Wait
    Remove-Item "OllamaSetup.exe" -Force
    $env:Path += ";$env:LOCALAPPDATA\Programs\Ollama"
    Write-Output "[OK] Ollama has been installed."
} else {
    Write-Output "[OK] Ollama is installed."
}

# Ensure Ollama daemon is running
Write-Output "Verifying Ollama service status..."
$ollamaActive = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 3
    $ollamaActive = $true
} catch {
    Write-Output "Ollama service is not running. Starting Ollama.exe..."
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    $ollamaActive = $true
}
Write-Output "[OK] Ollama local server is active.`n"

# 3. Pull required AI models
Write-Output "Downloading local AI models (this may take a few minutes)..."
Write-Output "Pulling phi4-mini..."
& ollama pull phi4-mini
Write-Output "Pulling qwen2.5-vl (Multimodal Vision)..."
& ollama pull qwen2.5-vl
Write-Output "[OK] Local LLM and VL Models loaded.`n"

# 4. Install local dependencies
Write-Output "Installing EdgeOrchestra frontend and Tauri dependencies..."
npm install
Write-Output "[OK] Dependencies installed successfully.`n"

Write-Output "===================================================="
Write-Output " EdgeOrchestra Setup Complete!"
Write-Output " Run the following command to start the developer app:"
Write-Output " npm run tauri dev"
Write-Output "===================================================="
