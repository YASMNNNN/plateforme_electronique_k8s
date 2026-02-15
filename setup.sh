#!/bin/bash
set -e

# --- CONFIG ---
PROJECT_DIR="$HOME/plateforme_electronique_k8s"
VENV_DIR="$HOME/aider_venv"
MISTRAL_API_KEY="PmfRhBqrPdJRFf3PmIlguKz4Ll3134Uc"

# --- Vérifier version Python ---
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Version Python détectée: $PYTHON_VERSION"

# Utiliser python3 par défaut
PYTHON_CMD="python3"

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

# --- Installer Aider depuis PyPI ---
echo "Installation de aider-chat..."
pip install aider-chat

# --- Définir clé Mistral ---
export MISTRAL_API_KEY="$MISTRAL_API_KEY"
echo "Mistral API key définie."

# --- Vérifier l'installation ---
if ! command -v aider &> /dev/null; then
    echo "Erreur: aider n'est pas installé correctement."
    exit 1
fi

# --- Initialiser git si nécessaire ---
cd "$PROJECT_DIR"
if [ ! -d ".git" ]; then
    echo "Initialisation du dépôt git..."
    git init
    git add .
    git commit -m "Initial commit"
fi

# --- Lancer Aider sur le projet avec Mistral ---
echo "Lancement de Aider sur $PROJECT_DIR avec Mistral..."
aider --model mistral/codestral-latest --api-key "mistral=$MISTRAL_API_KEY"
