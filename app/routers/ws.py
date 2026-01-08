import json
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.ws_manager import manager
from app.models import Device
from pywebpush import webpush, WebPushException # Importante

router = APIRouter(tags=["websockets"])

# Función auxiliar para enviar Push
def trigger_push_notifications(db: Session, title: str, body: str):
    devices = db.query(Device).filter(Device.is_active == True).all()
    
    # Credenciales VAPID desde variables
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    email = os.getenv("VAPID_CLAIMS_EMAIL")

    if not private_key: 
        print("❌ Error: Faltan llaves VAPID")
        return

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
                data=json.dumps({"title": title, "body": body, "type": "PANIC"}),
                vapid_private_key=private_key,
                vapid_claims={"sub": email}
            )
        except WebPushException as ex:
            print(f"Error enviando push a {dev.id}: {ex}")
            # Si el endpoint ya no existe (410), podríamos desactivar el dispositivo
            # if ex.response.status_code == 410: dev.is_active = False

@router.websocket("/ws/alerta")
async def websocket_endpoint(
    websocket: WebSocket, 
    db: Session = Depends(get_db) # Inyectamos BD para buscar dispositivos
):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # --- CASO 1: PÁNICO ---
            if data.get("type") == "PANIC_BUTTON":
                usuario = data.get("user", "Vecino")
                
                # A. Websocket (Rápido, pantalla roja)
                await manager.broadcast({
                    "type": "ALERTA_CRITICA",
                    "user": usuario,
                    "msg": "¡ALERTA DE SEGURIDAD!",
                    "coords": data.get("coords")
                })

                # B. PUSH NOTIFICATION (Para despertar celulares bloqueados)
                # Esto es lo que faltaba para que suene en background
                try:
                    trigger_push_notifications(
                        db, 
                        title="🚨 ALERTA VECINAL 🚨", 
                        body=f"{usuario} ha activado el botón de pánico."
                    )
                except Exception as e:
                    print(f"Error general en push: {e}")

            # --- CASO 2: ACTUALIZACIÓN GPS ---
            elif data.get("type") == "GPS_UPDATE":
                # Solo reenviamos coordenadas para actualizar mapas si tuviéramos
                await manager.broadcast({
                    "type": "GPS_UPDATE",
                    "coords": data.get("coords")
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)