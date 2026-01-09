# app/routers/api.py
from fastapi import APIRouter, Depends, Body, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Device, Member, AccessLog, MemberRole
from app.routers.dashboard import get_current_member
from sqlalchemy import func

from app.routers.ws import manager # Para avisar al websocket

router = APIRouter(prefix="/api", tags=["api"])

@router.post("/push/subscribe")
async def subscribe_push(
    request: Request, # <-- Necesario para leer headers
    payload: dict = Body(...), # Recibimos todo el objeto JSON
    member: Member = Depends(get_current_member),
    db: Session = Depends(get_db)
):
    # Estructura recibida: { subscription: {...}, details: {...} }
    sub_data = payload.get("subscription", {})
    details = payload.get("details", {})
    
    endpoint = sub_data.get("endpoint")
    if not endpoint:
        return {"status": "error", "msg": "Endpoint no válido"}

    # Buscar si existe
    device = db.query(Device).filter(Device.push_endpoint == endpoint).first()
    
    # Datos técnicos
    keys = sub_data.get("keys", {})
    user_agent_raw = request.headers.get('user-agent', 'Desconocido')
    
    if not device:
        # CREAR NUEVO
        new_device = Device(
            member_id=member.id,
            push_endpoint=endpoint,
            push_p256dh=keys.get("p256dh"),
            push_auth=keys.get("auth"),
            
            # Huella Digital
            user_agent=user_agent_raw,
            platform=details.get("platform"),
            timezone=details.get("timezone"),
            is_pwa=details.get("is_pwa", False)
        )
        db.add(new_device)
        msg = "Dispositivo registrado con éxito"
    else:
        # ACTUALIZAR EXISTENTE (Importante por si cambió de PWA a Browser o actualizó OS)
        device.push_p256dh = keys.get("p256dh")
        device.push_auth = keys.get("auth")
        device.user_agent = user_agent_raw
        device.is_pwa = details.get("is_pwa", False)
        device.last_seen = func.now() # Actualizamos la última vez visto
        msg = "Datos de dispositivo actualizados"
        
    db.commit()
    return {"status": "success", "msg": msg}


@router.post("/proximity/check-in")
async def check_in_proximity(
    request: Request,
    member: Member = Depends(get_current_member),
    db: Session = Depends(get_db)
):
    # Crear Log de Acceso
    new_log = AccessLog(
        organization_id=member.organization_id,
        member_id=member.id,
        direction="IN",
        method="APP_CHECKIN", # Marcamos que fue voluntario desde la App
        target_unit=member.unit_info,
        visitor_name="Residente (Confirmado)"
    )
    db.add(new_log)
    db.commit()

    # Avisar al Guardia (Monitor Centinela) vía WebSocket
    # Usamos un tipo nuevo "INFO_ACCESS" para que sea verde, no rojo
    await manager.broadcast({
        "type": "INFO_ACCESS", 
        "user": member.name,
        "msg": f"📍 {member.name} ha marcado su ingreso (Check-in).",
        "unit": member.unit_info
    })
    
    return {"status": "ok", "msg": "Ingreso registrado correctamente"}