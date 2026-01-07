# app/routers/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.utils.ws_manager import manager
# from app.routers.dashboard import get_current_member # (Opcional: Para validar quién es)

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/alerta")
async def websocket_endpoint(websocket: WebSocket):
    # 1. Aceptar la conexión (El vecino abrió la app)
    await manager.connect(websocket)
    
    try:
        while True:
            # 2. Esperar mensajes del cliente
            data = await websocket.receive_json()
            
            # 3. Si llega una alerta, REENVIARLA A TODOS
            if data.get("type") == "PANIC_BUTTON":
                # Aquí podrías guardar el evento en BD: "Juan activó pánico"
                
                await manager.broadcast({
                    "type": "ALERTA_CRITICA",
                    "user": "Vecino (Demo)", # Luego pondremos el nombre real
                    "msg": "¡ALERTA DE SEGURIDAD ACTIVADA!"
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)