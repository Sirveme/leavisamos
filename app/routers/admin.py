import json
import os
from fastapi import APIRouter, Request, Depends, Form, BackgroundTasks
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Member, Bulletin, Device # Importamos modelos nuevos
from app.routers.dashboard import get_current_member
from pywebpush import webpush, WebPushException

router = APIRouter(tags=["admin"])
templates = Jinja2Templates(directory="app/templates")

# --- VISTA PRINCIPAL (Dashboard Admin) ---
# --- VISTA PRINCIPAL ---
@router.get("/admin")
async def admin_home(request: Request, member: Member = Depends(get_current_member), db: Session = Depends(get_db)):
    if member.role != "admin":
        return templates.TemplateResponse("pages/errors/403.html", {"request": request})
    
    current_theme = getattr(request.state, "theme", None)
    
    total_members = db.query(Member).filter(Member.organization_id == member.organization_id).count()
    recent_bulletins = db.query(Bulletin).filter(
        Bulletin.organization_id == member.organization_id
    ).order_by(Bulletin.created_at.desc()).limit(10).all()

    return templates.TemplateResponse("pages/admin/home_admin.html", {
        "request": request,
        "user": member,
        "theme": current_theme,
        "stats": { "vecinos": total_members, "morosidad": "15%", "caja": "S/ 12,400" },
        "bulletins": recent_bulletins
    })

# --- API: CREAR Y ENVIAR BOLETÍN ---
# ... imports ...

@router.post("/admin/bulletin/create")
async def create_bulletin(
    title: str = Form(...),
    content: str = Form(...),
    priority: str = Form(...),
    db: Session = Depends(get_db),
    admin: Member = Depends(get_current_member)
):
    print(f"📝 Nuevo Boletín: {title}")

    # 1. Guardar en Base de Datos (Esto casi nunca falla)
    try:
        new_bulletin = Bulletin(
            organization_id=admin.organization_id,
            author_id=admin.id,
            title=title,
            content=content,
            priority=priority,
            target_criteria={"all": True}
        )
        db.add(new_bulletin)
        db.commit()
        print("✅ Guardado en BD")
    except Exception as e:
        print(f"❌ Error BD: {e}")
        return HTMLResponse(f"<div class='text-red-500'>Error guardando: {e}</div>", status_code=500)

    # 2. ENVIAR PUSH (El sospechoso)
    count_sent = 0
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    email = os.getenv("VAPID_CLAIMS_EMAIL")

    # Obtenemos dispositivos
    devices = db.query(Device).join(Member).filter(
        Member.organization_id == admin.organization_id,
        Device.is_active == True
    ).all()
    
    print(f"📡 Intentando enviar a {len(devices)} dispositivos...")

    if private_key:
        for dev in devices:
            try:
                # OJO: Imprime el endpoint para ver si es válido
                # print(f"Target: {dev.push_endpoint[:30]}...") 
                
                webpush(
                    subscription_info={
                        "endpoint": dev.push_endpoint,
                        "keys": {"p256dh": dev.push_p256dh, "auth": dev.push_auth}
                    },
                    data=json.dumps({
                        "title": f"📢 {title}",
                        "body": content[:100],
                        "url": "/dashboard",
                        "icon": "/static/images/icon-192.png"
                    }),
                    vapid_private_key=private_key,
                    vapid_claims={"sub": email},
                    ttl=60 # Tiempo de vida corto para pruebas
                )
                count_sent += 1
            except WebPushException as ex:
                # IMPORTANTE: Capturamos el error pero NO detenemos el bucle
                print(f"⚠️ Fallo Push Individual: {ex.message}")
                # Si el error es 410 (Gone), desactivamos el dispositivo
                if ex.response and ex.response.status_code == 410:
                    dev.is_active = False
                    db.commit()
            except Exception as e:
                print(f"❌ Error Genérico Push: {e}")

    print(f"🚀 Enviados exitosamente: {count_sent}")

    # 3. Respuesta Visual (HTMX)
    # Devolvemos el HTML de la tarjeta para que se inserte en la lista
    color = "blue"
    if priority == 'alert': color = "red"
    elif priority == 'warning': color = "yellow"

    return HTMLResponse(content=f"""
    <div class="p-4 mb-3 bg-slate-800 rounded-lg border-l-4 border-{color}-500 fade-me-in shadow-md">
        <div class="flex justify-between items-center">
            <h3 class="font-bold text-white">{title}</h3>
            <span class="text-[10px] text-slate-400 bg-black/30 px-2 py-1 rounded">Push: {count_sent}/{len(devices)}</span>
        </div>
        <p class="text-sm text-slate-300 mt-2">{content}</p>
        <div class="mt-2 text-[10px] text-slate-500 text-right">Hace un instante</div>
    </div>
    """)

def getColor(priority):
    if priority == 'alert': return 'red'
    if priority == 'warning': return 'yellow'
    return 'blue'


#==================================================================
# VERSIÓN CON TAREAS EN SEGUNDO PLANO (BackgroundTasks)
#==================================================================

# 1. Extraer la lógica de envío a una función independiente
def send_bulletin_push_background(title: str, body: str, org_id: int):
    # 1. CREAR NUEVA SESIÓN (Vital para background tasks)
    db = SessionLocal() 
    
    try:
        print(f"🔄 Background: Iniciando envío Push...")
        
        # Obtener credenciales
        private_key = os.getenv("VAPID_PRIVATE_KEY")
        email = os.getenv("VAPID_CLAIMS_EMAIL")
        
        if not private_key:
            print("❌ Background Error: Falta VAPID_PRIVATE_KEY")
            return

        # Buscar dispositivos
        devices = db.query(Device).join(Member).filter(
            Member.organization_id == org_id,
            Device.is_active == True
        ).all()
        
        count = 0
        for dev in devices:
            try:
                webpush(
                    subscription_info={
                        "endpoint": dev.push_endpoint,
                        "keys": {"p256dh": dev.push_p256dh, "auth": dev.push_auth}
                    },
                    data=json.dumps({
                        "title": title,
                        "body": body,
                        "url": "/dashboard",
                        "icon": "/static/images/icon-192.png"
                    }),
                    vapid_private_key=private_key,
                    vapid_claims={"sub": email},
                    ttl=60
                )
                count += 1
            except WebPushException as ex:
                if ex.response and ex.response.status_code == 410:
                    dev.is_active = False # Marcar inactivo
                    db.commit() # Guardar cambio de estado
            except Exception:
                pass 
                
        print(f"✅ Background: Push enviado a {count} dispositivos.")
        
    except Exception as e:
        print(f"❌ Background Error General: {e}")
    finally:
        db.close() # CERRAR LA SESIÓN MANUALMENTE

# 2. Modificar el endpoint para usar BackgroundTasks
# --- ENDPOINT CREAR BOLETÍN ---
@router.post("/admin/bulletin/create")
async def create_bulletin(
    background_tasks: BackgroundTasks, # <--- Inyección de tareas
    title: str = Form(...),
    content: str = Form(...),
    priority: str = Form(...),
    db: Session = Depends(get_db), # Sesión del Request (corta vida)
    admin: Member = Depends(get_current_member)
):
    # 1. Guardar en Base de Datos (Usando sesión del request)
    new_bulletin = Bulletin(
        organization_id=admin.organization_id,
        author_id=admin.id,
        title=title,
        content=content,
        priority=priority,
        target_criteria={"all": True}
    )
    db.add(new_bulletin)
    db.commit()
    
    # 2. Calcular destinatarios (Solo para mostrar el número al Admin)
    total_targets = db.query(Device).join(Member).filter(
        Member.organization_id == admin.organization_id,
        Device.is_active == True
    ).count()

    # 3. ENCOLAR LA TAREA 
    # Pasamos datos primitivos (strings/ints), NO pasamos la sesión 'db'
    background_tasks.add_task(
        send_bulletin_push_background, 
        f"📢 {title}", 
        content[:100], 
        admin.organization_id
    )

    # 4. RESPUESTA INMEDIATA
    color = "blue"
    if priority == 'alert': color = "red"
    elif priority == 'warning': color = "yellow"

    # Nota: Usamos "Hace un instante" porque acaba de ocurrir
    return HTMLResponse(content=f"""
    <div class="p-4 mb-3 bg-slate-800 rounded-lg border-l-4 border-{color}-500 fade-me-in shadow-md">
        <div class="flex justify-between items-center">
            <h3 class="font-bold text-white">{title}</h3>
            <span class="text-[10px] text-slate-400 bg-black/30 px-2 py-1 rounded flex items-center gap-1">
                <i class="ph ph-check text-green-500"></i> Enviando a {total_targets}...
            </span>
        </div>
        <p class="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{content}</p>
        <div class="mt-2 text-[10px] text-slate-500 text-right">Hace un instante</div>
    </div>
    """)