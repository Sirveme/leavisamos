from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# 1. El Cliente (Condominio, Colegio, Club)
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True) # Para URLs: saas.com/condominio-sol
    type = Column(String) # 'condominio', 'colegio', 'club'
    
    # Configuración visual personalizada
    theme_color = Column(String, default="#3b82f6") 
    logo_url = Column(String)

# 2. El Usuario Final (Vecino, Colegiado, Socio)
class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    # Identidad "Sin Email"
    public_id = Column(String, index=True) # DNI o N° Socio
    access_code = Column(String) # El código que viene en la factura (Hash en prod)
    
    name = Column(String)
    unit_info = Column(String) # "Dpto 302" o "Matrícula 555"
    
    # Datos de contacto (Opcionales, recolectados después)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    devices = relationship("Device", back_populates="member")
    organization = relationship("Organization")

# 3. Dispositivos (Para Push Notifications & Seguridad)
class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    
    user_agent = Column(String)
    
    # Esto es CRÍTICO para Web Push API
    push_endpoint = Column(Text) 
    push_p256dh = Column(String)
    push_auth = Column(String)
    
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    member = relationship("Member", back_populates="devices")

# 4. Notificaciones (Historial)
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    
    title = Column(String)
    body = Column(Text)
    status = Column(String) # 'queued', 'sent', 'read'
    created_at = Column(DateTime(timezone=True), server_default=func.now())