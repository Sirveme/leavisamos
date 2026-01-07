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
    # 1. Buscar usuario en BD
    member = db.query(Member).filter(Member.public_id == dni).first()
    
    # 2. Verificar usuario y contraseña
    if not member or not verify_password(code, member.access_code):
        # Si falla, devolvemos HTML de error (HTMX lo inyectará en el div)
        return JSONResponse(
            status_code=200, # Respondemos 200 para que HTMX procese el HTML
            content="""
            <div class="p-4 mb-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg animate-pulse fade-me-in">
                <span class="font-medium">Error:</span> Datos incorrectos.
            </div>
            """,
            media_type="text/html"
        )
    
    # 3. SI ES CORRECTO: Crear Token
    access_token = create_access_token(data={"sub": str(member.id), "name": member.name})
    
    # 4. Crear la respuesta explícita (JSONResponse es seguro)
    # El contenido no importa mucho porque haremos redirect, pero debe ser válido.
    response = JSONResponse(content={"message": "Login exitoso"})
    
    # 5. Guardar Token en Cookie
    response.set_cookie(
        key="access_token", 
        value=f"Bearer {access_token}", 
        httponly=True,
        max_age=2592000, # 30 días
        samesite="lax",
        secure=False # Cambiar a True cuando subas a Railway (HTTPS)
    )
    
    # 6. Redirección HTMX
    # Esta cabecera obliga al navegador a cambiar de URL
    response.headers["HX-Redirect"] = "/dashboard"
    
    return response