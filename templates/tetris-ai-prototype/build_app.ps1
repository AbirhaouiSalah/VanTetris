<#
.SYNOPSIS
    Script standardisé pour construire et réparer le projet Tetris AI Prototype (Backend Flask + Frontend React).
.DESCRIPTION
    Ce script :
    1. Configure l'environnement backend (Python + Flask).
    2. Configure l'environnement frontend (React + TypeScript) en évitant les conflits EOVERRIDE.
    3. Vérifie et corrige les fichiers sources manquants (App.tsx, Tetris.tsx, index.tsx, index.html).
    4. Résout les conflits de dépendances (AJV v8, legacy peer dependencies).
.NOTES
    Version: 1.1.0
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
# Étape 1 : Configuration du Backend (Python)
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 1/3 : Configuration du Backend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (Test-Path $BackendPath) {
    Set-Location $BackendPath

    # Créer l'environnement virtuel si inexistant
    if (-not (Test-Path "venv")) {
        Write-Host "Création de l'environnement virtuel (venv)..." -ForegroundColor Gray
        python -m venv venv
    }

    # Activer l'environnement virtuel
    $VenvActivate = Join-Path $BackendPath "venv\Scripts\Activate.ps1"
    if (Test-Path $VenvActivate) {
        . $VenvActivate
        Write-Host "Environnement virtuel activé." -ForegroundColor Green
    } else {
        Write-Host "Avertissement : L'environnement virtuel n'a pas pu être activé." -ForegroundColor Yellow
        Write-Host "Utilisation de Python global." -ForegroundColor Yellow
    }

    # Mettre à jour pip et installer les dépendances
    Write-Host "Mise à jour de pip..." -ForegroundColor Gray
    python -m pip install --upgrade pip --quiet

    Write-Host "Installation des dépendances backend..." -ForegroundColor Gray
    try {
        pip install -r requirements.txt
        Write-Host "Backend prêt." -ForegroundColor Green
    } catch {
        Write-Host "Échec de l'installation standard. Tentative avec des dépendances explicites..." -ForegroundColor Red
        pip install "Flask>=3.1.1" "Flask-CORS>=4.0.1" "numpy>=2.1.0" pytest
        Write-Host "Backend prêt (dépendances explicites)." -ForegroundColor Green
    }

    Set-Location $RootPath
} else {
    Write-Host "ERREUR : Le dossier backend est introuvable à $BackendPath" -ForegroundColor Red
    exit 1
}

# =============================================
# Étape 2 : Configuration du Frontend (React)
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 2/3 : Configuration du Frontend" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (Test-Path $FrontendPath) {
    Set-Location $FrontendPath

    # Configurer .npmrc pour éviter les conflits de peer dependencies (TypeScript 5 vs react-scripts)
    Write-Host "Configuration de .npmrc pour les dépendances legacy..." -ForegroundColor Gray
    "legacy-peer-deps=true" | Out-File -FilePath .npmrc -Encoding utf8 -Force

    # Nettoyage preventif de package.json pour éviter l'erreur npm EOVERRIDE
    Write-Host "Vérification et assainissement de package.json..." -ForegroundColor Gray
    if (Test-Path "package.json") {
        $PkgContent = Get-Content "package.json" -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
        if (-not $PkgContent) {
            Write-Host "ERREUR : package.json est corrompu." -ForegroundColor Red
            exit 1
        }

        # Suppression du bloc 'overrides' s'il entre en conflit direct
        if ($PkgContent.PSObject.Properties['overrides']) {
            $PkgContent.PSObject.Properties.Remove('overrides')
            $PkgContent | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding utf8 -Force
            Write-Host "Bloc overrides nettoyé pour éviter EOVERRIDE." -ForegroundColor Gray
        }
    } else {
        Write-Host "ERREUR : package.json introuvable." -ForegroundColor Red
        exit 1
    }

    # Nettoyer node_modules et lockfile
    Write-Host "Nettoyage de node_modules et package-lock.json..." -ForegroundColor Gray
    if (Test-Path "node_modules") { Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path "package-lock.json") { Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue }

    Write-Host "Installation ciblée d'AJV v8..." -ForegroundColor Gray
    npm install ajv@^8.17.1 ajv-keywords@^5.1.0 --save-dev --legacy-peer-deps

    Write-Host "Installation complète des dépendances frontend..." -ForegroundColor Gray
    try {
        npm install --legacy-peer-deps
        Write-Host "Frontend prêt." -ForegroundColor Green
    } catch {
        Write-Host "Échec de l'installation standard npm. Tentative de secours..." -ForegroundColor Red
        npm install --force
        Write-Host "Frontend prêt (mode force)." -ForegroundColor Green
    }

    Set-Location $RootPath
} else {
    Write-Host "ERREUR : Le dossier frontend est introuvable à $FrontendPath" -ForegroundColor Red
    exit 1
}

# =============================================
# Étape 3 : Vérification des fichiers sources
# =============================================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Étape 3/3 : Vérification des fichiers sources" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

if (Test-Path $FrontendPath) {
    Set-Location $FrontendPath
    $SrcPath = Join-Path $FrontendPath "src"

    # Créer le dossier src s'il n'existe pas
    if (-not (Test-Path $SrcPath)) {
        New-Item -ItemType Directory -Path $SrcPath -Force | Out-Null
        Write-Host "Dossier src créé." -ForegroundColor Gray
    }

    # Vérifier et créer App.tsx si manquant
    $AppFile = Join-Path $SrcPath "App.tsx"
    if (-not (Test-Path $AppFile)) {
        Write-Host "Création de App.tsx..." -ForegroundColor Gray
        @"
import React from 'react';
import Tetris from './Tetris';

const App: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Tetris + IA</h1>
      <Tetris />
    </div>
  );
};

export default App;
"@ | Out-File -FilePath $AppFile -Encoding utf8 -Force
    } else {
        Write-Host "App.tsx existe déjà." -ForegroundColor Gray
    }

    # Vérifier et créer Tetris.tsx si manquant
    $TetrisFile = Join-Path $SrcPath "Tetris.tsx"
    if (-not (Test-Path $TetrisFile)) {
        Write-Host "Création de Tetris.tsx..." -ForegroundColor Gray
        @"
import React, { useState } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const Tetris: React.FC = () => {
  const [board] = useState<(string | null)[][]>(
    Array(BOARD_HEIGHT).fill(Array(BOARD_WIDTH).fill(null))
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Tetris Game Component</h2>
      <div style={{ width: '250px', height: '500px', border: '2px solid #333', margin: '0 auto', backgroundColor: '#111' }}>
        {board.map((row, y) => (
          <div key={y} style={{ display: 'flex' }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: '25px',
                  height: '25px',
                  backgroundColor: cell || 'black',
                  border: '1px solid #222',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tetris;
"@ | Out-File -FilePath $TetrisFile -Encoding utf8 -Force
    } else {
        Write-Host "Tetris.tsx existe déjà." -ForegroundColor Gray
    }

    # Vérifier et créer index.tsx si manquant
    $IndexFile = Join-Path $SrcPath "index.tsx"
    if (-not (Test-Path $IndexFile)) {
        Write-Host "Création de index.tsx..." -ForegroundColor Gray
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
    } else {
        Write-Host "index.tsx existe déjà." -ForegroundColor Gray
    }

    # Vérifier public/index.html
    $PublicPath = Join-Path $FrontendPath "public"
    if (-not (Test-Path $PublicPath)) {
        New-Item -ItemType Directory -Path $PublicPath -Force | Out-Null
        Write-Host "Dossier public créé." -ForegroundColor Gray
    }

    $IndexHtmlFile = Join-Path $PublicPath "index.html"
    if (-not (Test-Path $IndexHtmlFile)) {
        Write-Host "Création de public/index.html..." -ForegroundColor Gray
        @"
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetris + IA Prototype</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@ | Out-File -FilePath $IndexHtmlFile -Encoding utf8 -Force
    } else {
        Write-Host "public/index.html existe déjà." -ForegroundColor Gray
    }

    Write-Host "Fichiers sources vérifiés et corrigés." -ForegroundColor Green
    Set-Location $RootPath
} else {
    Write-Host "ERREUR : Le dossier frontend est introuvable." -ForegroundColor Red
    exit 1
}

# =============================================
# Résumé et instructions de lancement
# =============================================
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Construction et réparation terminées !" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pour démarrer le backend :" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\venv\Scripts\activate" -ForegroundColor White
Write-Host "  python app.py" -ForegroundColor White
Write-Host ""
Write-Host "Pour démarrer le frontend :" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Le backend sera accessible sur : http://localhost:5000" -ForegroundColor Cyan
Write-Host "Le frontend sera accessible sur : http://localhost:3000" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green