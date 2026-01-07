import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "secret_dev_key")

# --- LÓGICA DE TEMAS (Personalidades) ---
THEMES = {
    "leavisamos": {
        "site_name": "LeAvisamos",
        "primary_color": "#6366f1",  # Indigo (Tu color actual)
        "logo_icon": "ph-hand-waving",
        "tone": "friendly",
        "hero_text": "Tu comunidad conectada"
    },
    "notificado": {
        "site_name": "Notificado",
        "primary_color": "#ef4444",  # Rojo (Para el futuro)
        "logo_icon": "ph-gavel",
        "tone": "formal",
        "hero_text": "Gestión de Notificaciones Oficiales"
    },
    "default": {
        "site_name": "LeAvisamos (Dev)",
        "primary_color": "#6366f1",
        "logo_icon": "ph-code",
        "tone": "friendly",
        "hero_text": "Modo Desarrollo"
    }
}