# app/routers/api.py
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Device, Member
from app.routers.dashboard import get_current_member # Para saber quién es

router = APIRouter(prefix="/api", tags=["api"])

@router.post("/push/subscribe")
async def subscribe_push(
    subscription: dict = Body(...),
    member: Member = Depends(get_current_member),
    db: Session = Depends(get_db)
):
    # subscription llega con: { endpoint: "...", keys: { p256dh: "...", auth: "..." } }
    
    # 1. Verificar si este dispositivo ya existe para este usuario
    endpoint = subscription.get("endpoint")
    device = db.query(Device).filter(Device.push_endpoint == endpoint).first()
    
    if not device:
        # 2. Si no existe, lo creamos
        keys = subscription.get("keys", {})
        new_device = Device(
            member_id=member.id,
            push_endpoint=endpoint,
            push_p256dh=keys.get("p256dh"),
            push_auth=keys.get("auth"),
            user_agent="Browser" # Podrías capturar el User-Agent real del request
        )
        db.add(new_device)
        db.commit()
        return {"status": "success", "msg": "Dispositivo registrado para alertas"}
    
    return {"status": "exists", "msg": "Dispositivo ya estaba registrado"}