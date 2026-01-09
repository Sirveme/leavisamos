from fastapi import APIRouter, Request, Depends, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Member, AccessLog, MemberRole
from app.routers.dashboard import get_current_member
import os

router = APIRouter(tags=["security"])
templates = Jinja2Templates(directory="app/templates")

# --- VISTA PRINCIPAL ---
@router.get("/centinela")
async def centinela_home(request: Request, member: Member = Depends(get_current_member)):
    # Validación de rol
    if member.role not in ["staff", "admin", "security"]:
         return templates.TemplateResponse("pages/errors/403.html", {"request": request})

    current_theme = getattr(request.state, "theme", None)

    return templates.TemplateResponse("pages/security/home_security.html", {
        "request": request,
        "user": member,
        "theme": current_theme,
        "vapid_public_key": os.getenv("VAPID_PUBLIC_KEY")
    })

# --- API: BUSCAR VECINOS (Para validar foto) ---
@router.post("/centinela/search")
async def search_neighbors(
    query: str = Form(...), 
    db: Session = Depends(get_db),
    member: Member = Depends(get_current_member) # Seguridad extra
):
    # Buscar por Nombre o por Unidad (Dpto)
    # Solo buscamos miembros de la misma organización
    results = db.query(Member).filter(
        Member.organization_id == member.organization_id,
        or_(
            Member.name.ilike(f"%{query}%"),
            Member.unit_info.ilike(f"%{query}%")
        )
    ).all()

    if not results:
        return "<div class='text-slate-500 p-2'>No se encontraron coincidencias.</div>"

    # Retornamos HTML parcial (HTMX)
    html_content = ""
    for res in results:
        # Usamos un avatar generado con las iniciales si no hay foto real aún
        avatar = f"https://ui-avatars.com/api/?name={res.name}&background=random&color=fff"
        html_content += f"""
        <div class="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 mb-2">
            <img src="{avatar}" class="w-12 h-12 rounded-full border-2 border-indigo-500">
            <div>
                <p class="text-white font-bold">{res.name}</p>
                <p class="text-xs text-indigo-300">{res.unit_info} - {res.position or 'Residente'}</p>
            </div>
            <button class="ml-auto bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-500"
                    onclick="registrarResidente('{res.id}', '{res.name}')">
                Marcar Ingreso
            </button>
        </div>
        """
    return HTMLResponse(content=html_content)

# --- API: REGISTRAR ACCESO (Visita/Delivery) ---
@router.post("/centinela/search")
async def search_neighbors(
    query: str = Form(...), 
    db: Session = Depends(get_db),
    member: Member = Depends(get_current_member)
):
    results = db.query(Member).filter(
        Member.organization_id == member.organization_id,
        or_(
            Member.name.ilike(f"%{query}%"),
            Member.unit_info.ilike(f"%{query}%")
        )
    ).all()

    if not results:
        return HTMLResponse("<div class='text-slate-500 p-2 text-sm italic'>No se encontraron coincidencias.</div>")

    html_content = ""
    for res in results:
        # Generamos un avatar con sus iniciales (Servicio gratuito UI Avatars)
        avatar = f"https://ui-avatars.com/api/?name={res.name}&background=random&color=fff&size=64"
        
        # HTML DE LA TARJETA
        html_content += f"""
        <div class="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700 mb-2 hover:bg-slate-700 transition-colors">
            <!-- FOTO / AVATAR -->
            <img src="{avatar}" class="w-10 h-10 rounded-full border border-indigo-500 shadow-sm">
            
            <div class="flex-1 min-w-0">
                <p class="text-white font-bold text-sm truncate">{res.name}</p>
                <p class="text-xs text-indigo-300 truncate">{res.unit_info} • {res.position or 'Residente'}</p>
            </div>
            
            <!-- BOTÓN DE REGISTRO DIRECTO (Sin formularios extra) -->
            <button class="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded shadow-lg"
                    onclick="registrarResidente('{res.id}', '{res.name}')">
                MARCAR INGRESO
            </button>
        </div>
        """
    return HTMLResponse(content=html_content)