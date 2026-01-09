from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from app.models import Member
from app.routers.dashboard import get_current_member
import os

router = APIRouter(tags=["security"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/centinela")
async def centinela_home(request: Request, member: Member = Depends(get_current_member)):
    # Protección: Solo Staff o Admin
    if member.role not in ["staff", "admin", "security"]:
         # Redirigir a dashboard normal si no es seguridad
         return templates.TemplateResponse("pages/errors/403.html", {"request": request})

    current_theme = getattr(request.state, "theme", None)

    return templates.TemplateResponse("pages/security/home_security.html", {
        "request": request,
        "user": member,
        "theme": current_theme,
        "vapid_public_key": os.getenv("VAPID_PUBLIC_KEY")
    })