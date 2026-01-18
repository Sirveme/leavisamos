from fastapi import APIRouter, Form, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Member, Organization
from app.utils.security import verify_password, create_access_token
from app.routers.dashboard import get_current_member

router = APIRouter(prefix="/auth", tags=["auth"])

# --- LOGIN ---
@router.post("/login")
async def login(
    request: Request,
    dni: str = Form(...), 
    code: str = Form(...), 
    db: Session = Depends(get_db)
):
    current_org = request.state.org
    if not current_org:
        return JSONResponse(status_code=400, content="Error: Organización no identificada")

    # 1. Buscar Usuario Global
    user = db.query(User).filter(User.public_id == dni).first()
    
    if not user or not verify_password(code, user.access_code):
        return JSONResponse(
            status_code=200, 
            content="""<div class="p-4 mb-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg">Error: Credenciales incorrectas</div>""", 
            media_type="text/html"
        )
    
    # 2. Buscar Membresía EN ESTA ORGANIZACIÓN
    membership = db.query(Member).filter(
        Member.user_id == user.id,
        Member.organization_id == current_org['id'], # <--- Usar corchetes
        Member.is_active == True
    ).first()

    if not membership:
        return JSONResponse(
            status_code=200, 
            content=f"""<div class="p-4 text-sm text-yellow-400 bg-yellow-900/20 rounded">No está registrado en {current_org['name']}.</div>""", 
            media_type="text/html"
        )

    # 3. Crear Sesión
    return create_session_response(user, membership, is_login_request=True)

# --- CAMBIAR DE PERFIL (Switch) ---
@router.get("/switch/{target_member_id}")
async def switch_profile(
    target_member_id: int, 
    current_member: Member = Depends(get_current_member),
    db: Session = Depends(get_db)
):
    # Validar propiedad
    target_membership = db.query(Member).filter(
        Member.id == target_member_id,
        Member.user_id == current_member.user_id,
        Member.is_active == True
    ).first()
    
    if not target_membership:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return create_session_response(target_membership.user, target_membership, is_login_request=False)

# --- HELPER DE SESIÓN ---
def create_session_response(user, member, is_login_request=False):
    # Crear Token
    access_token = create_access_token(data={
        "sub": str(member.id),
        "user_id": str(user.id),
        "name": user.name,
        "role": member.role
    })
    
    # Decidir destino
    target_url = "/dashboard"
    if member.role == "admin": target_url = "/admin"
    elif member.role in ["staff", "security"]: target_url = "/centinela"
    
    # Crear respuesta
    if is_login_request:
        # Si viene del formulario de login (HTMX), devolvemos JSON con header
        response = JSONResponse(content={"message": "Login OK"})
        response.headers["HX-Redirect"] = target_url
    else:
        # Si es un link normal (Switch), redirigimos nativamente
        response = RedirectResponse(url=target_url, status_code=303)

    # Set Cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=2592000,
        samesite="lax",
        secure=True # True para HTTPS
    )
    return response