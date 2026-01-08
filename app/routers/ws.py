# app/routers/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.utils.ws_manager import manager
# from app.routers.dashboard import get_current_member # (Opcional: Para validar quién es)

router = APIRouter(tags=["websockets"])

@router.websocket("/ws/alerta")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # --- LÓGICA DE PÁNICO ---
            if data.get("type") == "PANIC_BUTTON":
                # Extraemos datos que vienen del cliente
                usuario = data.get("user", "Desconocido")
                ubicacion = data.get("location", "Sin GPS")
                coords = data.get("coords", None) # {lat: -12..., lon: -77...}
                
                # Reenviamos a TODOS con los datos enriquecidos
                await manager.broadcast({
                    "type": "ALERTA_CRITICA",
                    "user": usuario,
                    "msg": f"¡ALERTA ACTIVADA! Ubicación: {ubicacion}",
                    "coords": coords # Para mostrar mapa en el futuro
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)