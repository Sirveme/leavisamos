from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Text, JSON, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

# --- ENUMS (Para restringir valores y evitar errores) ---
class MemberRole(str, enum.Enum):
    ADMIN = "admin"
    SECURITY = "security"
    USER = "user"

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class AccessType(str, enum.Enum):
    IN = "in"
    OUT = "out"

# --- CORE ---
class Organization(Base):
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True)
    type = Column(String) # condominio, colegio, club, municipio
    
    # CONFIGURACIÓN DEL PLAN (Ventas)
    # Ej: { "plan": "pro", "modules": {"panic": true, "access": true, "voting": false} }
    config = Column(JSON, default={}) 
    
    theme_color = Column(String, default="#6366f1")
    logo_url = Column(String)
    timezone = Column(String, default="America/Lima") # Para reportes
    
    members = relationship("Member", back_populates="organization")
    resources = relationship("Resource", back_populates="organization")

class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    public_id = Column(String, index=True) # DNI, CIP, Suministro
    access_code = Column(String) # Hash de contraseña
    
    name = Column(String)
    unit_info = Column(String) # Dpto 301, Sede Norte, etc.
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Jerarquía
    role = Column(String, default="user", index=True) # admin, staff, user, external
    position = Column(String) # "Decano", "Portero", "Padre de Familia"

    # Permisos Granulares (JSON)
    # Ej: { "can_view_finance": true, "can_edit_tickets": false }
    permissions = Column(JSON, default={})
    
    is_active = Column(Boolean, default=True) # Para bloquear morosos si se desea
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Vital para estadísticas: "Nuevos socios por mes"

    organization = relationship("Organization", back_populates="members")
    devices = relationship("Device", back_populates="member")
    bookings = relationship("Booking", back_populates="member")
    tickets = relationship("Ticket", back_populates="member")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    
    push_endpoint = Column(Text, unique=True)
    push_p256dh = Column(String)
    push_auth = Column(String)
    
    # Huella Digital
    user_agent = Column(String)
    platform = Column(String)
    browser = Column(String)
    is_pwa = Column(Boolean, default=False)
    timezone = Column(String)
    
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True), server_default=func.now())
    
    member = relationship("Member", back_populates="devices")

# --- MÓDULO SEGURIDAD (Pánico & Accesos) ---
class PanicLog(Base):
    __tablename__ = "panic_logs"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)
    address_ref = Column(String, nullable=True) # "Cerca a portería"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AccessLog(Base):
    __tablename__ = "access_logs"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    member_id = Column(Integer, ForeignKey("members.id"), nullable=True) # Si es vecino
    
    visitor_name = Column(String, nullable=True) # Si es visita externa
    visitor_dni = Column(String, nullable=True)
    target_unit = Column(String) # "Va al 501"
    
    direction = Column(String) # IN / OUT
    method = Column(String) # QR, MANUAL, VEHICULAR
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VisitorPass(Base): # Invitaciones QR
    __tablename__ = "visitor_passes"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    
    guest_name = Column(String)
    qr_token = Column(String, unique=True)
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    is_used = Column(Boolean, default=False)

# --- MÓDULO LOGÍSTICA (Paquetería) ---
class Parcel(Base):
    __tablename__ = "parcels"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    target_unit = Column(String) # Dpto 301
    
    courier = Column(String) # Amazon, Rappi
    photo_url = Column(String, nullable=True)
    
    status = Column(String, default="received") # received, delivered
    received_at = Column(DateTime(timezone=True), server_default=func.now())
    picked_up_at = Column(DateTime(timezone=True), nullable=True)

# --- MÓDULO HELPDESK (Tickets/Incidencias) ---
class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    title = Column(String)
    description = Column(Text)
    category = Column(String) # Mantenimiento, Seguridad, Limpieza
    status = Column(String, default="open") # open, in_progress, resolved
    priority = Column(String, default="medium")
    
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    member = relationship("Member", back_populates="tickets")

# --- MÓDULO RESERVAS (Clubes/Condominios) ---
class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    name = Column(String) # Zona Parrilla 1, Cancha Tenis
    rules = Column(JSON) # { "max_hours": 2, "cost": 20.00 }
    is_active = Column(Boolean, default=True)
    
    organization = relationship("Organization", back_populates="resources")
    bookings = relationship("Booking", back_populates="resource")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True)
    resource_id = Column(Integer, ForeignKey("resources.id"))
    member_id = Column(Integer, ForeignKey("members.id"))
    
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    status = Column(String, default="confirmed") # confirmed, cancelled
    
    member = relationship("Member", back_populates="bookings")
    resource = relationship("Resource", back_populates="bookings")

# --- MÓDULO PROFESIONAL (Bolsa de Trabajo) ---
class JobPost(Base):
    __tablename__ = "job_posts"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    title = Column(String)
    company = Column(String)
    description = Column(Text)
    contact_email = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))


# FINANZAS
class FinancialSummary(Base):
    __tablename__ = "financial_summaries"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    period = Column(String)
    total_income = Column(Float)
    total_expenses = Column(Float)
    current_balance = Column(Float)
    pdf_url = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# CHAT
class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    type = Column(String) # SUPPORT, SECURITY
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    messages = relationship("Message", back_populates="conversation")
    # participants = relationship... (Complejo, lo manejaremos por query)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("members.id"))
    content = Column(Text)
    message_type = Column(String) # text, image, audio
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")