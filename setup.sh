#!/bin/bash

set -e

# --- CONFIG ---
PROJECT_DIR="$HOME/plateforme_electronique_k8s"
AIDER_DIR="$HOME/aider"
VENV_DIR="$HOME/aider_venv"
MISTRAL_API_KEY="PmfRhBqrPdJRFf3PmIlguKz4Ll3134Uc"

# --- Vérifier version Python ---
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Version Python détectée: $PYTHON_VERSION"

if [[ "$PYTHON_VERSION" < "3.12" ]]; then
    echo "Python 3.12 non trouvé, installation..."
    sudo add-apt-repository -y ppa:deadsnakes/ppa
    sudo apt update
    sudo apt install -y python3.12 python3.12-venv python3.12-distutils
    PYTHON_CMD="python3.12"
else
    PYTHON_CMD="python3"
fi

# --- Créer venv propre ---
if [ ! -d "$VENV_DIR" ]; then
    echo "Création du venv dans $VENV_DIR..."
    $PYTHON_CMD -m venv "$VENV_DIR"
else
    echo "Venv existe déjà dans $VENV_DIR"
fi

# --- Activer le venv ---
source "$VENV_DIR/bin/activate"

# --- Mettre pip à jour ---
pip install --upgrade pip

# --- Correction pour Python 3.13 ---
if [[ "$PYTHON_VERSION" == "3.13"* ]]; then
    echo "Python 3.13 détecté, modification temporaire de pyproject.toml pour installation..."
    PYPROJECT="$AIDER_DIR/pyproject.toml"
    if grep -q 'requires-python' "$PYPROJECT"; then
        sed -i.bak 's/requires-python = ">=3.10,<3.13"/requires-python = ">=3.10,<3.14"/' "$PYPROJECT"
    fi
fi

# --- Installer Aider en mode editable ---
echo "Installation de Aider depuis $AIDER_DIR..."
pip install -e "$AIDER_DIR"

# --- Définir clé Mistral ---
export MISTRAL_API_KEY="$MISTRAL_API_KEY"
echo "Mistral API key définie."

# --- Vérifier l'installation ---
if ! command -v aider &> /dev/null; then
    echo "Erreur: aider n'est pas installé correctement."
    exit 1
fi

# --- Lancer Aider sur le projet ---
echo "Lancement de Aider sur $PROJECT_DIR..."
aider explain "$PROJECT_DIR"
