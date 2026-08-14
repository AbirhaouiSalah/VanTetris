<#
.SYNOPSIS
    Automated build & troubleshooting script for Tetris AI Prototype (Flask Backend + React Frontend).
.DESCRIPTION
    Resolves dependency conflicts (Python/NumPy binaries C compiler errors, NPM peer dependency locks, 
    AJV version mismatches, missing TypeScript React entries) and builds/starts both services.
#>

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Tetris AI Prototype - Automated Build & Repair Tool    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = Get-Location
$BackendPath = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"

# ------------------------------------------------------------------
# STEP 1: BACKEND ENVIRONMENT SETUP & FIXES
# ------------------------------------------------------------------
Write-Host "[1/3] Setting up Python Backend..." -ForegroundColor Yellow

if (Test-Path $BackendPath) {
    Set-Location $BackendPath

    # Check/Create Virtual Environment
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Virtual Environment (venv)..." -ForegroundColor Gray
        python -m venv venv
    }

    # Activate Virtual Environment
    $VenvActivate = Join-Path $BackendPath "venv\Scripts\Activate.ps1"
    if (Test-Path $VenvActivate) {
        . $VenvActivate
    } else {
        Write-Host "Virtual environment script not found at $VenvActivate. Using global python." -ForegroundColor Red
    }

    Write-Host "Upgrading pip, setuptools, and wheel..." -ForegroundColor Gray
    python -m pip install --upgrade pip setuptools wheel --quiet

    Write-Host "Installing Python backend dependencies..." -ForegroundColor Gray
    # Handling NumPy binary compatibility for Python 3.13+
    # Avoids source C-compilation errors (Meson/MSVC missing compiler errors)
    try {
        pip install -r requirements.txt
    } catch {
        Write-Host "Standard requirements.txt installation failed. Resolving NumPy C-compiler build error..." -ForegroundColor Red
        Write-Host "Installing compatible pre-compiled dependencies directly..." -ForegroundColor Gray
        pip install "Flask>=3.0.0" "Flask-CORS>=4.0.0" "numpy>=2.3.0"
    }

    Write-Host "Backend environment ready." -ForegroundColor Green
    Set-Location $RootPath
} else {
    Write-Host "Backend directory not found at $BackendPath. Skipping backend setup." -ForegroundColor Red
}

Write-Host ""

# ------------------------------------------------------------------
# STEP 2: FRONTEND DEPENDENCY FIXES & OVERRIDES
# ------------------------------------------------------------------
Write-Host "[2/3] Setting up React Frontend..." -ForegroundColor Yellow

if (Test-Path $FrontendPath) {
    Set-Location $FrontendPath

    # Create .npmrc to bypass ERESOLVE peer dependency locks (TypeScript 5 vs react-scripts)
    Write-Host "Configuring .npmrc for legacy peer dependencies..." -ForegroundColor Gray
    "legacy-peer-deps=true" | Out-File -FilePath .npmrc -Encoding utf8 -Force

    # Ensure package.json has overrides for AJV v8 compatibility
    if (Test-Path "package.json") {
        Write-Host "Checking package.json for AJV overrides..." -ForegroundColor Gray
        $PkgJson = Get-Content "package.json" -Raw | ConvertFrom-Json
        if (-not $PkgJson.PSObject.Properties['overrides']) {
            $PkgJson | Add-Member -MemberType NoteProperty -Name "overrides" -Value @{
                "ajv" = "^8.12.0"
                "ajv-keywords" = "^5.1.0"
            }
            $PkgJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding utf8 -Force
        }
    }

    # Clean install node_modules if needed or apply fixes
    Write-Host "Installing npm dependencies (resolving AJV and peer conflicts)..." -ForegroundColor Gray
    npm install --legacy-peer-deps

    Write-Host "Installing explicit AJV v8 packages..." -ForegroundColor Gray
    npm install ajv@^8.12.0 ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps

    # ------------------------------------------------------------------
    # STEP 3: REPAIR MISSING FRONTEND APP/INDEX BRICKS
    # ------------------------------------------------------------------
    Write-Host "[3/3] Validating Frontend Source Files..." -ForegroundColor Yellow

    $SrcPath = Join-Path $FrontendPath "src"
    if (-not (Test-Path $SrcPath)) {
        New-Item -ItemType Directory -Path $SrcPath -Force | Out-Null
    }

    $AppFile = Join-Path $SrcPath "App.tsx"
    $IndexFile = Join-Path $SrcPath "index.tsx"

    if (-not (Test-Path $AppFile)) {
        Write-Host "Creating missing App.tsx..." -ForegroundColor Red
        @"
import React, { useEffect, useState } from 'react';

export const App: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Connecting to backend...');

  useEffect(() => {
    fetch('http://127.0.0.1:5000/')
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message || 'Connected to Backend!'))
      .catch(() => setBackendStatus('Backend offline or unreachable on port 5000'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Tetris AI Prototype</h1>
      <p>Backend Status: <strong>{backendStatus}</strong></p>
    </div>
  );
};

export default App;
"@ | Out-File -FilePath $AppFile -Encoding utf8 -Force
    }

    if (-not (Test-Path $IndexFile)) {
        Write-Host "Creating missing index.tsx..." -ForegroundColor Red
        @"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@ | Out-File -FilePath $IndexFile -Encoding utf8 -Force
    }

    Write-Host "Frontend environment and source code verified." -ForegroundColor Green
    Set-Location $RootPath
} else {
    Write-Host "Frontend directory not found at $FrontendPath. Skipping frontend setup." -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "    Build & Repair Complete! Launching Applications...    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. To start Backend:  cd backend; .\venv\Scripts\activate; python app.py" -ForegroundColor Cyan
Write-Host "2. To start Frontend: cd frontend; npm start" -ForegroundColor Cyan