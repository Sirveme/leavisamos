from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from app.models import Member, MemberRole # Asegúrate de importar el Enum
from app.routers.dashboard import get_current_member # Reusamos la seguridad

router = APIRouter(tags=["admin"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/admin")
async def admin_home(request: Request, member: Member = Depends(get_current_member)):
    # Protección: Solo Admins
    if member.role != "admin":
        return templates.TemplateResponse("pages/errors/403.html", {"request": request}) # Luego creamos esta página
    
    # Recuperar tema
    current_theme = getattr(request.state, "theme", None)

    return templates.TemplateResponse("pages/admin/home_admin.html", {
        "request": request,
        "user": member,
        "theme": current_theme,
        "stats": { # Datos Dummy por ahora
            "morosidad": "15%",
            "ingresos": "S/ 12,400",
            "tickets_abiertos": 3
        }
    })