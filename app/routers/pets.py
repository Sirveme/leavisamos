from fastapi import APIRouter, Request, Depends, Form, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Member, Pet
from app.routers.dashboard import get_current_member
from app.routers.ws import manager # Para avisar si se pierde

router = APIRouter(tags=["pets"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/pets")
async def pets_home(request: Request, member: Member = Depends(get_current_member), db: Session = Depends(get_db)):
    # Ver mascotas de MI organización (Vecinos)
    pets = db.query(Pet).filter(Pet.organization_id == member.organization_id).all()
    current_theme = getattr(request.state, "theme", None)
    
    return templates.TemplateResponse("pages/pets/home_pets.html", {
        "request": request,
        "user": member,
        "pets": pets,
        "theme": current_theme
    })

@router.post("/pets/register")
async def register_pet(
    request: Request, # Necesario para el template response
    name: str = Form(...),
    species: str = Form(...),
    notes: str = Form(None), # Puede ser opcional
    db: Session = Depends(get_db),
    member: Member = Depends(get_current_member)
):
    # Generar avatar temporal
    # (En el futuro aquí procesaremos UploadFile para guardar en disco/S3)
    temp_photo = f"https://loremflickr.com/320/240/{species}"
    
    new_pet = Pet(
        organization_id=member.organization_id,
        owner_id=member.id,
        name=name,
        species=species,
        breed="Mestizo", # Valor por defecto por ahora
        notes=notes,
        # Guardamos la foto como una LISTA dentro del JSON
        photos=[temp_photo], 
        is_lost=False
    )
    db.add(new_pet)
    db.commit()
    
    # Retornar la tarjeta HTML
    return templates.TemplateResponse("components/pet_card.html", {
        "pet": new_pet, 
        "request": request
    })

@router.post("/pets/{pet_id}/lost")
async def report_lost_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(Pet).filter(Pet.id == pet_id).first()
    pet.is_lost = not pet.is_lost # Toggle estado
    db.commit()
    
    if pet.is_lost:
        # ALERTA DE VOZ A TODOS
        await manager.broadcast({
            "type": "PRE_ARRIVAL", # Usamos amarillo (Advertencia)
            "user": "ALERTA VECINAL",
            "msg": f"Se perdió {pet.name}. Revisen la sección Mascotas."
        })
        
    return "OK" # HTMX manejará el cambio de estado visual