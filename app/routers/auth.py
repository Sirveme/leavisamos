from fastapi import APIRouter, Form, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Member, Organization
from app.utils.security import verify_password, create_access_token
from app.routers.dashboard import get_current_member # Para validar quién pide el cambio

router = APIRouter(prefix="/auth", tags=["auth"])

# --- LOGIN (Versión Nueva: User -> Member) ---
@router.post("/login")
async def login(dni: str = Form(...), code: str = Form(...), db: Session = Depends(get_db)):
    # 1. Buscar en tabla USERS
    user = db.query(User).filter(User.public_id == dni).first()
    
    if not user or not verify_password(code, user.access_code):
        return JSONResponse(status_code=200, content="""<div class="p-4 mb-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg">Error: Credenciales incorrectas</div>""")
    
    # 2. Buscar Membresías
    memberships = db.query(Member).filter(Member.user_id == user.id, Member.is_active == True).all()

    if not memberships:
        return JSONResponse(status_code=200, content="""<div class="p-4 text-sm text-yellow-400">Usuario sin perfiles activos.</div>""")

    # 3. Por defecto, loguear en la primera (o la última usada si tuviéramos ese dato)
    active_member = memberships[0]

    return create_session_response(user, active_member)

# --- CAMBIAR DE PERFIL (Switch) ---
@router.get("/switch/{target_member_id}")
async def switch_profile(
    target_member_id: int, 
    current_member: Member = Depends(get_current_member),
    db: Session = Depends(get_db)
):
    # 1. Validar seguridad: ¿El usuario dueño del token actual es dueño del target?
    # Buscamos la membresía destino y verificamos que el user_id sea el mismo
    target_membership = db.query(Member).filter(
        Member.id == target_member_id,
        Member.user_id == current_member.user_id, # <--- CANDADO DE SEGURIDAD
        Member.is_active == True
    ).first()
    
    if not target_membership:
        raise HTTPException(status_code=403, detail="No tienes acceso a este perfil")
    
    # 2. Generar nuevo token y redirigir
    return create_session_response(target_membership.user, target_membership)

# --- HELPER PARA CREAR COOKIE Y REDIRIGIR ---
def create_session_response(user, member):
    access_token = create_access_token(data={
        "sub": str(member.id), # El ID de la membresía es la identidad de la sesión
        "user_id": str(user.id),
        "name": user.name,
        "role": member.role,
        "org_name": member.organization.name # Para mostrar en UI
    })
    
    # Decidir destino
    target_url = "/dashboard"
    if member.role == "admin": target_url = "/admin"
    elif member.role in ["staff", "security"]: target_url = "/centinela"
    
    response = JSONResponse(content={"message": "Ok"}) if "login" in str(member) else RedirectResponse(url=target_url, status_code=303)
    
    # Si es login (JSONResponse), usamos header HTMX. Si es Switch (Redirect), es nativo.
    if isinstance(response, JSONResponse):
        response.headers["HX-Redirect"] = target_url

    
    # Redirección Estándar (No HTMX)
    response = RedirectResponse(url=target_url, status_code=303)

    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=2592000,
        samesite="lax",
        secure=True # Cambiar a False si pruebas en localhost sin HTTPS
    )
    return response