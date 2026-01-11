# app/routers/api.py
from fastapi import APIRouter, Depends, Body, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Device, Member, AccessLog, MemberRole, PanicLog
from app.routers.dashboard import get_current_member
from openai import OpenAI
from datetime import datetime, timedelta, timezone
import os
import json

from sqlalchemy import func

from app.routers.ws import manager # Para avisar al websocket

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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
        "user_id": member.id,  # <--- AGREGAR ESTO
        "msg": f"📍 {member.name} ha marcado su ingreso.",
        "unit": member.unit_info,
        "method": "WiFi/App" # Para saber cómo confirmó
    })
    
    return {"status": "ok", "msg": "Ingreso registrado correctamente"}


#================================================================
# CEREBRO IA: PROCESAR COMANDO DE VOZ
# LA CENTRAL NEURAL (Integración OpenAI) 🧠✨
#================================================================
@router.post("/brain/process-command")
async def process_voice_command(payload: dict = Body(...)):
    # payload = { "text": "Avisa corte de luz mañana a las 5", "role": "admin" }
    command_text = payload.get("text")
    user_role = payload.get("role")
    
    print(f"🧠 Cerebro procesando: {command_text}")

    # Prompt del Sistema (Instrucciones)
    system_prompt = """
    Eres el asistente IA de un condominio. Tu trabajo es interpretar comandos de voz y devolver una acción JSON estructurada.
    
    ACCIONES DISPONIBLES:
    1. Si es Admin y quiere comunicar algo:
       Return: {"action": "fill_bulletin", "title": "...", "content": "...", "priority": "info/warning/alert"}
    
    2. Si es Vecino/Guardia y reporta una llegada o visita:
       Return: {"action": "log_access", "type": "visita", "name": "..."}
       
    3. Si es Vecino y pregunta deuda:
       Return: {"action": "check_debt"}
       
    Responde SOLO el JSON.
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini", # O gpt-3.5-turbo
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Rol: {user_role}. Comando: {command_text}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        response_json = json.loads(completion.choices[0].message.content)
        return {"status": "ok", "data": response_json}
        
    except Exception as e:
        print(f"Error OpenAI: {e}")
        return {"status": "error", "msg": "Cerebro desconectado temporalmente"}
    

#================================================================
#Endpoint: RESUMEN DE SEGURIDAD (Briefing IA)
# La Central Neural (Integración OpenAI) 🧠✨
#================================================================
@router.get("/brain/briefing")
async def get_security_briefing(
    db: Session = Depends(get_db), 
    member: Member = Depends(get_current_member)
):
    # 1. Obtener eventos recientes (últimas 12h) usando la forma moderna
    since = datetime.now(timezone.utc) - timedelta(hours=12)
    
    panics = db.query(PanicLog).filter(
        PanicLog.organization_id == member.organization_id,
        PanicLog.created_at >= since
    ).all()
    
    access = db.query(AccessLog).filter(
        AccessLog.organization_id == member.organization_id,
        AccessLog.created_at >= since,
        AccessLog.method.in_(["MANUAL", "MANUAL_GUARDIA", "APP_CHECKIN"])
    ).order_by(AccessLog.created_at.desc()).limit(10).all()

    # 2. Si no hay nada, responder rápido
    if not panics and not access:
        return {"status": "ok", "text": "Sin novedades en el turno. Todo tranquilo."}

    # 3. Preparar datos para GPT
    data_text = f"ALERTAS ROJAS: {len(panics)}. "
    if panics:
        data_text += "Última alerta de pánico hace poco. "
        
    data_text += f"INGRESOS RECIENTES ({len(access)}): "
    for a in access:
        # Convertir a hora local simple para el texto (aprox)
        # Nota: En producción, idealmente se ajusta al timezone de la org
        hora = a.created_at.strftime("%H:%M")
        data_text += f"- {a.visitor_name} a las {hora}. "

    # 4. Consultar a OpenAI
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un jefe de seguridad. Resume estos eventos en 2 frases cortas y formales para ser leídas por radio al guardia."},
                {"role": "user", "content": data_text}
            ],
            max_tokens=100
        )
        summary = completion.choices[0].message.content
        return {"status": "ok", "text": summary}
        
    except Exception as e:
        print(f"Error IA: {e}")
        return {"status": "ok", "text": f"Resumen manual: {len(panics)} alertas y {len(access)} ingresos recientes."}