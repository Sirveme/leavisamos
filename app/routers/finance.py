from fastapi import APIRouter, Request, Depends, Form, UploadFile, File
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Member, Debt, Organization
from app.routers.dashboard import get_current_member
from datetime import datetime

router = APIRouter(tags=["finance"])
templates = Jinja2Templates(directory="app/templates")

# --- ADMIN: GENERAR CUOTAS MASIVAS ---
@router.post("/finance/generate-fees")
async def generate_fees(
    amount: float = Form(...),
    concept: str = Form(...), # Ej: "Mantenimiento Enero"
    due_date: str = Form(...), # YYYY-MM-DD
    db: Session = Depends(get_db),
    admin: Member = Depends(get_current_member)
):
    if admin.role != "admin": return "Acceso denegado"

    # 1. Buscar todos los vecinos activos
    vecinos = db.query(Member).filter(
        Member.organization_id == admin.organization_id,
        Member.role == "user", # Solo a usuarios, no staff
        Member.is_active == True
    ).all()

    # 2. Crear deudas
    count = 0
    
    # Convertir string fecha a objeto fecha (para guardar correctamente)
    try:
        due_date_obj = datetime.strptime(due_date, '%Y-%m-%d')
    except:
        due_date_obj = None

    for v in vecinos:
        # Evitar duplicados
        existing = db.query(Debt).filter(
            Debt.member_id == v.id, # <--- CORREGIDO (Antes membership_id)
            Debt.concept == concept
        ).first()
        
        if not existing:
            deuda = Debt(
                member_id=v.id, # <--- CORREGIDO
                organization_id=admin.organization_id,
                concept=concept,
                amount=amount,
                balance=amount, # Al inicio debe todo
                status="pending",
                due_date=due_date_obj
            )
            db.add(deuda)
            count += 1
    
    db.commit()
    
    return HTMLResponse(f"""
    <div class="bg-green-900/30 border-l-4 border-green-500 p-4 rounded mb-4 fade-me-in">
        <h3 class="font-bold text-green-400">✅ Proceso Terminado</h3>
        <p class="text-sm text-slate-300">Se generaron {count} cuotas de S/ {amount} para '{concept}'.</p>
    </div>
    """)

# --- VECINO: VER MI DEUDA (Componente) ---
@router.get("/finance/my-summary")
async def get_my_summary(
    request: Request, 
    db: Session = Depends(get_db), 
    member: Member = Depends(get_current_member)
):
    # Sumar deuda pendiente
    total_debt = db.query(func.sum(Debt.balance)).filter(
        Debt.member_id == member.id, # <--- CORREGIDO AQUÍ TAMBIÉN
        Debt.status == "pending"
    ).scalar() or 0.0

    # Determinar estado visual
    status_color = "blue"
    if total_debt > 0: status_color = "red"
    
    return templates.TemplateResponse("components/finance_card.html", {
        "request": request,
        "total_debt": total_debt,
        "status_color": status_color,
        "currency": "S/"
    })