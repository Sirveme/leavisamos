from fastapi import APIRouter, Request, Depends, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Member, AccessLog
from app.routers.dashboard import get_current_member
from itertools import groupby
import os


router = APIRouter(tags=["security"])
templates = Jinja2Templates(directory="app/templates")

# 1. VISTA PRINCIPAL
@router.get("/centinela")
async def centinela_home(request: Request, member: Member = Depends(get_current_member)):
    if member.role not in ["staff", "admin", "security"]:
         return templates.TemplateResponse("pages/errors/403.html", {"request": request})

    current_theme = getattr(request.state, "theme", None)

    return templates.TemplateResponse("pages/security/home_security.html", {
        "request": request,
        "user": member,
        "theme": current_theme,
        "vapid_public_key": os.getenv("VAPID_PUBLIC_KEY")
    })

# 2. BUSCADOR (Devuelve HTML con fotos)
@router.post("/centinela/search")
async def search_neighbors(
    query: str = Form(...), 
    db: Session = Depends(get_db),
    member: Member = Depends(get_current_member)
):
    # 1. Buscar coincidencias
    results = db.query(Member).filter(
        Member.organization_id == member.organization_id,
        or_(
            Member.name.ilike(f"%{query}%"),
            Member.unit_info.ilike(f"%{query}%")
        )
    ).order_by(Member.unit_info).all() # Importante ordenar para agrupar

    if not results:
        return HTMLResponse("<div class='text-slate-500 p-4 text-center italic'>No se encontraron coincidencias.</div>")

    # 2. Agrupar por Unidad (Dpto 501, Dpto 502...)
    html_content = ""
    
    # groupby requiere que los datos estén ordenados por la clave de agrupación
    for unit, members_iter in groupby(results, key=lambda x: x.unit_info):
        members = list(members_iter)
        
        # Inicio del Bloque de Unidad
        html_content += f"""
        <div class="mb-6 bg-slate-800/50 rounded-xl border border-slate-700 p-4 fade-me-in">
            <!-- Cabecera de Unidad -->
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-indigo-400 font-bold text-lg border-l-4 border-indigo-500 pl-3">{unit}</h3>
                <span class="text-xs text-slate-500">{len(members)} Residentes</span>
            </div>

            <!-- Carrusel Horizontal de Personas -->
            <div class="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-slate-600">
        """
        
        # Tarjetas de Personas
        for res in members:
            avatar = f"https://ui-avatars.com/api/?name={res.name}&background=random&color=fff&size=128"
            
            # Nota: El onclick llama a toggleSelection (JS)
            html_content += f"""
            <div id="card-{res.id}" 
                 class="member-card cursor-pointer min-w-[140px] w-[140px] bg-slate-900 rounded-lg border border-slate-600 p-3 flex flex-col items-center text-center transition-all hover:border-indigo-400 relative group"
                 onclick="toggleSelection('{res.id}', '{res.name}', '{unit}')">
                
                <!-- Checkbox Visual (Oculto por defecto, aparece al seleccionar) -->
                <div id="check-{res.id}" class="hidden absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10">
                    <i class="ph ph-check text-xs font-bold"></i>
                </div>

                <img src="{avatar}" class="w-16 h-16 rounded-full mb-2 border-2 border-slate-700 group-hover:border-indigo-500 transition-colors object-cover">
                
                <p class="text-slate-200 font-bold text-sm leading-tight line-clamp-2">{res.name}</p>
                <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">{res.position or 'Residente'}</p>
            </div>
            """
        
        html_content += """
            </div>
        </div>
        """

    # Botón Flotante de Confirmación (Se mostrará vía JS cuando haya seleccionados)
    html_content += """
    <div id="action-bar" class="hidden sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4 mt-4 flex justify-between items-center animate-slide-up">
        <span class="text-slate-300 text-sm"><strong id="count-selected" class="text-white">0</strong> seleccionados</span>
        <button onclick="registrarSeleccionados()" 
                class="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-900/20 transition-transform active:scale-95 flex items-center gap-2">
            <i class="ph ph-sign-in text-xl"></i> REGISTRAR INGRESO
        </button>
    </div>
    """

    return HTMLResponse(content=html_content)

# 3. REGISTRAR LOG (Este era el 404)
@router.post("/centinela/log")
async def log_access(
    tipo: str = Form(...),      # RESIDENTE, DELIVERY, VISITA
    detalle: str = Form(...),   # Nombre
    unidad: str = Form(None),   # Opcional si es residente
    member_id: int = Form(None),# Opcional (ID del residente)
    db: Session = Depends(get_db),
    guardia: Member = Depends(get_current_member)
):
    target_unit = unidad
    
    # Si viene ID de miembro, buscamos su unidad real
    if member_id:
        residente = db.query(Member).filter(Member.id == member_id).first()
        if residente:
            target_unit = residente.unit_info
    
    # Guardar en BD
    new_log = AccessLog(
        organization_id=guardia.organization_id,
        member_id=member_id, 
        target_unit=target_unit or "Portería",
        direction="IN",
        method="MANUAL_GUARDIA",
        visitor_name=f"[{tipo}] {detalle}"
    )
    db.add(new_log)
    db.commit()

    # Devolver el HTML del Log para la lista de la izquierda
    time_str = new_log.created_at.strftime("%H:%M") if new_log.created_at else "Ahora"
    
    return HTMLResponse(content=f"""
    <div class="bg-green-900/20 border-l-4 border-green-500 p-2 text-green-300 mb-2 fade-me-in text-[10px]">
        <span class="text-slate-500">[{time_str}]</span> 
        <strong>{tipo}:</strong> {detalle} <span class="text-slate-400">({target_unit})</span>
    </div>
    """)