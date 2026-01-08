import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.ws_manager import manager
from app.models import Device
from pywebpush import webpush, WebPushException

router = APIRouter(tags=["websockets"])

# --- FUNCIÓN DE ENVÍO PUSH ---
def trigger_push_notifications(db: Session, title: str, body: str):
    """
    Busca todos los dispositivos activos y les envía la alerta Push.
    """
    devices = db.query(Device).filter(Device.is_active == True).all()
    
    # Leer credenciales del .env / Railway Variables
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    email = os.getenv("VAPID_CLAIMS_EMAIL")

    if not private_key:
        print("❌ Error Crítico: No hay VAPID_PRIVATE_KEY configurada.")
        return

    print(f"🚀 Iniciando envío Push a {len(devices)} dispositivos...")

    for dev in devices:
        try:
            webpush(
                subscription_info={
                    "endpoint": dev.push_endpoint,
                    "keys": {
                        "p256dh": dev.push_p256dh,
                        "auth": dev.push_auth
                    }
                },
                data=json.dumps({
                    "title": title, 
                    "body": body,
                    "icon": "/static/images/icon-192.png", # Asegúrate de tener este ícono
                    "url": "/dashboard"
                }),
                vapid_private_key=private_key,
                vapid_claims={"sub": email}
            )
        except WebPushException as ex:
            print(f"⚠️ Error Push con dispositivo {dev.id}: {ex}")
            # Si Google dice "410 Gone", significa que el usuario borró la app o revocó permiso
            if ex.response and ex.response.status_code == 410:
                print(f"🗑️ Desactivando dispositivo {dev.id} por inactivo.")
                dev.is_active = False
                db.commit()
        except Exception as e:
            print(f"❌ Error genérico Push: {e}")

# --- WEBSOCKET ENDPOINT ---
@router.websocket("/ws/alerta")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: Session = Depends(get_db) # Inyectamos BD
):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # CASO 1: ALERTA DE PÁNICO
            if data.get("type") == "PANIC_BUTTON":
                usuario = data.get("user", "Vecino")
                ubicacion = data.get("location", "")
                
                # A. Notificar a los que tienen la App ABIERTA (Pantalla Roja)
                await manager.broadcast({
                    "type": "ALERTA_CRITICA",
                    "user": usuario,
                    "msg": "¡ALERTA DE SEGURIDAD!",
                    "coords": data.get("coords")
                })

                # B. Notificar a los que tienen la App CERRADA (Push Notification)
                # Ejecutamos esto en el mismo hilo (simple) o background task (ideal para escalar)
                try:
                    trigger_push_notifications(
                        db,
                        title="🚨 ALERTA VECINAL 🚨",
                        body=f"{usuario} ha activado el botón de pánico. {ubicacion}"
                    )
                except Exception as e:
                    print(f"Error al disparar trigger: {e}")

            # CASO 2: ACTUALIZACIÓN GPS
            elif data.get("type") == "GPS_UPDATE":
                await manager.broadcast({
                    "type": "GPS_UPDATE",
                    "coords": data.get("coords")
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)