from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
from .database import engine, Base
from .routers import auth, dashboard
from .config import THEMES

# Base.metadata.create_all(bind=engine) # Descomentar solo si usas SQLite local

app = FastAPI(title="NotiSAAS")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# --- MIDDLEWARE CAMALEÓN (Detecta el dominio) ---
@app.middleware("http")
async def add_domain_context(request: Request, call_next):
    host = request.headers.get("host", "")
    
    # Aquí ocurre la magia
    if "notificado.pro" in host:
        request.state.theme = THEMES["notificado"]
    elif "leavisamos.pro" in host:
        request.state.theme = THEMES["leavisamos"]
    else:
        request.state.theme = THEMES["default"]
    
    response = await call_next(request)
    return response

# --- RUTAS ---
app.include_router(auth.router)
app.include_router(dashboard.router)

@app.get("/service-worker.js")
async def get_service_worker():
    return FileResponse("static/service-worker.js", media_type="application/javascript")

@app.get("/manifest.json")
async def get_manifest():
    return FileResponse("static/manifest.json", media_type="application/json")

# LOGIN (Pasamos el tema al template)
@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("pages/login.html", {
        "request": request,
        "theme": request.state.theme # <--- IMPORTANTE
    })