from fastapi import APIRouter, Request, Depends, Cookie, HTTPException, status
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Member, Bulletin, Organization
from jose import jwt, JWTError
from app.config import SECRET_KEY # Asegúrate que esto exista en config.py
from app.utils.security import ALGORITHM

import os

router = APIRouter(tags=["dashboard"])
templates = Jinja2Templates(directory="app/templates")

# Dependencia para proteger rutas
def get_current_member(access_token: str = Cookie(None), db: Session = Depends(get_db)):
    exception_redirect = HTTPException(
        status_code=status.HTTP_302_FOUND,
        headers={"Location": "/"}, # Si falla, mandar al login
    )
    
    if not access_token:
        raise exception_redirect
    
    try:
        # El token viene como "Bearer eyJhbG..."
        scheme, token = access_token.split()
        if scheme.lower() != 'bearer':
            raise exception_redirect
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        member_id = payload.get("sub")
        if member_id is None:
             raise exception_redirect
    except (JWTError, ValueError):
         raise exception_redirect
         
    member = db.query(Member).filter(Member.id == member_id).first()
    if member is None:
        raise exception_redirect
        
    return member

@router.get("/dashboard")
async def dashboard_home(request: Request, member: Member = Depends(get_current_member), db: Session = Depends(get_db)):
    current_theme = getattr(request.state, "theme", None)

    # BUSCAR ÚLTIMO BOLETÍN ACTIVO (Menos de 24h o no expirado)
    latest_bulletin = db.query(Bulletin).order_by(Bulletin.created_at.desc()).first()

    # BUSCAR OTRAS MEMBRESÍAS DEL MISMO USUARIO
    my_profiles = db.query(Member).join(Organization).filter(
        Member.user_id == member.user_id,
        Member.is_active == True
    ).all()
    
    return templates.TemplateResponse("pages/dashboard.html", {
        "request": request,
        "user": member,
        "profiles": my_profiles,
        "deuda": "S/ 150.00",
        "vencimiento": "15 Ene 2024",
        "theme": current_theme,
        # AGREGAMOS ESTO:
        "vapid_public_key": os.getenv("VAPID_PUBLIC_KEY"),
        "latest_bulletin": latest_bulletin 
    })