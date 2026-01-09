from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Member
from app.utils.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(
    dni: str = Form(...), 
    code: str = Form(...), 
    db: Session = Depends(get_db)
):
    # 1. Buscar usuario
    member = db.query(Member).filter(Member.public_id == dni).first()
    
    # 2. Verificar
    if not member or not verify_password(code, member.access_code):
        return JSONResponse(
            status_code=200,
            content="""<div class="p-4 mb-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg animate-pulse">Error: Credenciales incorrectas</div>""",
            media_type="text/html"
        )
    
    # 3. Token
    access_token = create_access_token(data={"sub": str(member.id), "name": member.name})
    
    # 4. DECIDIR DESTINO SEGÚN ROL (La Bifurcación)
    target_url = "/dashboard" # Por defecto (Vecino)
    
    if member.role == "admin":
        target_url = "/admin"
    elif member.role in ["staff", "security"]:
        target_url = "/centinela"
    
    # 5. Respuesta
    response = JSONResponse(content={"message": "Login OK"})
    
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=2592000,
        samesite="lax",
        secure=True # True para Producción
    )
    
    # Redirección dinámica
    response.headers["HX-Redirect"] = target_url
    
    return response