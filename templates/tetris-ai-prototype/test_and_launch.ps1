<#
.SYNOPSIS
    Script pour tester la configuration et lancer l'application Tetris AI Prototype.
.DESCRIPTION
    Ce script :
    1. Vérifie que tous les fichiers nécessaires existent.
    2. Teste les dépendances backend (Python/Flask).
    3. Teste les dépendances frontend (Node.js/React).
    4. Lance le backend et le frontend dans des terminaux séparés.
.NOTES
    Version: 1.0.0
    Auteur: Salaheddine Abirhaoui
    Date: 14/08/2026
#>

# Arrêter le script en cas d'erreur
$ErrorActionPreference = "Stop"

# =============================================
# Configuration des chemins
# =============================================
$RootPath = Get-Location
$BackendPath = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"

# =============================================
# Fonctions utilitaires
# =============================================
function Test-FileExists {
    param (
        [string]$Path,
        [string]$Name
    )
    if (Test-Path $Path) {
        Write-Host "✅ $Name existe ($Path)." -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Name manquant ($Path)." -ForegroundColor Red
        return $false
    }
}

function Test-Command {
    param (
        [string]$Command,
        [string]$Name
    )
    try {
        Invoke-Expression $Command -ErrorAction Stop | Out-Null
        Write-Host "✅ $Name est disponible." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Name n'est pas disponible." -ForegroundColor Red
        return $false
    }
}

function Test-PythonPackage {
    param (
        [string]$Package
    )
    try {
        python -m pip show $Package | Out-Null
        Write-Host "✅ Package Python $Package est installé." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Package Python $Package manquant." -ForegroundColor Red
        return $false
    }
}

function Test-NpmPackage {
    param (
        [string]$Package
    )
    try {
        npm list $Package | Out-Null
        Write-Host "✅ Package npm $Package est installé." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Package npm $Package manquant." -ForegroundColor Red
        return $false
    }
}

# =============================================
# Étape 1 : Vérification des fichiers du projet
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 1/4 : Vérification des fichiers" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$AllFilesOk = $true

# Backend
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $BackendPath "app.py") -Name "app.py")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $BackendPath "tetris_ai.py") -Name "tetris_ai.py")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $BackendPath "requirements.txt") -Name "requirements.txt")

# Frontend
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $FrontendPath "package.json") -Name "package.json")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $FrontendPath "src\App.tsx") -Name "App.tsx")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $FrontendPath "src\Tetris.tsx") -Name "Tetris.tsx")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $FrontendPath "src\index.tsx") -Name "index.tsx")
$AllFilesOk = $AllFilesOk -and (Test-FileExists -Path (Join-Path $FrontendPath "public\index.html") -Name "public/index.html")

if (-not $AllFilesOk) {
    Write-Host "❌ Des fichiers manquants ont été détectés." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Tous les fichiers nécessaires sont présents." -ForegroundColor Green
}

# =============================================
# Étape 2 : Vérification de l'environnement Backend
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 2/4 : Vérification du Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Vérifier Python
$PythonOk = Test-Command -Command "python --version" -Name "Python"
$PipOk = Test-Command -Command "python -m pip --version" -Name "pip"

# Vérifier l'environnement virtuel
$VenvPath = Join-Path $BackendPath "venv"
if (Test-Path $VenvPath) {
    Write-Host "✅ Environnement virtuel Python existe." -ForegroundColor Green
    $VenvOk = $true
} else {
    Write-Host "❌ Environnement virtuel Python manquant." -ForegroundColor Red
    $VenvOk = $false
}

# Vérifier les packages Python
$FlaskOk = Test-PythonPackage -Package "Flask"
$FlaskCorsOk = Test-PythonPackage -Package "Flask-CORS"
$NumpyOk = Test-PythonPackage -Package "numpy"

$BackendOk = $PythonOk -and $PipOk -and $VenvOk -and $FlaskOk -and $FlaskCorsOk -and $NumpyOk

if (-not $BackendOk) {
    Write-Host "❌ L'environnement backend n'est pas correctement configuré." -ForegroundColor Red
    Write-Host "Exécutez d'abord : .\build_app.ps1" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ L'environnement backend est prêt." -ForegroundColor Green
}

# =============================================
# Étape 3 : Vérification de l'environnement Frontend
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 3/4 : Vérification du Frontend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Vérifier Node.js et npm
$NodeOk = Test-Command -Command "node --version" -Name "Node.js"
$NpmOk = Test-Command -Command "npm --version" -Name "npm"

# Vérifier les packages npm
Set-Location $FrontendPath
$ReactOk = Test-NpmPackage -Package "react"
$ReactDomOk = Test-NpmPackage -Package "react-dom"
$ReactScriptsOk = Test-NpmPackage -Package "react-scripts"
Set-Location $RootPath

$FrontendOk = $NodeOk -and $NpmOk -and $ReactOk -and $ReactDomOk -and $ReactScriptsOk

if (-not $FrontendOk) {
    Write-Host "❌ L'environnement frontend n'est pas correctement configuré." -ForegroundColor Red
    Write-Host "Exécutez d'abord : .\build_app.ps1" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ L'environnement frontend est prêt." -ForegroundColor Green
}

# =============================================
# Étape 4 : Lancement des applications
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 4/4 : Lancement des applications" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Lancer le backend dans un nouveau terminal
Write-Host "Démarrage du backend (Flask)..." -ForegroundColor Yellow
$BackendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd $BackendPath; .\venv\Scripts\activate; python app.py" -PassThru
Start-Sleep -Seconds 2  # Attendre que le backend démarre

# Tester que le backend répond
try {
    $BackendResponse = Invoke-RestMethod -Uri "http://localhost:5000" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend est accessible sur http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend non accessible. Vérifiez les logs dans le terminal." -ForegroundColor Yellow
}

# Lancer le frontend dans un nouveau terminal
Write-Host "Démarrage du frontend (React)..." -ForegroundColor Yellow
$FrontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd $FrontendPath; npm start" -PassThru
Start-Sleep -Seconds 3  # Attendre que le frontend démarre

# Tester que le frontend répond
try {
    $FrontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -ErrorAction Stop
    Write-Host "✅ Frontend est accessible sur http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend non accessible. Vérifiez les logs dans le terminal." -ForegroundColor Yellow
}

# =============================================
# Résumé
# =============================================
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Tests et lancement terminés !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backends et frontends lancés dans des terminaux séparés." -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour arrêter les applications :" -ForegroundColor Cyan
Write-Host "  1. Fermez les terminaux ouverts." -ForegroundColor White
Write-Host "  2. Ou exécutez : taskkill /IM powershell.exe /F" -ForegroundColor White
Write-Host ""
Write-Host "Si des erreurs persistent, exécutez d'abord : .\build_app.ps1" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green