"""SQLAlchemy models"""

from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    tasks = relationship("Task", back_populates="user")
    usage = relationship("TokenUsage", back_populates="user")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    status = Column(String, default="pending")
    input_data = Column(JSON)
    output_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    user = relationship("User", back_populates="tasks")
    usage = relationship("TokenUsage", back_populates="task")

class TokenUsage(Base):
    __tablename__ = "token_usage"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    task_id = Column(String, ForeignKey("tasks.id"))
    model = Column(String)
    input_tokens = Column(Integer)
    output_tokens = Column(Integer)
    cost = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="usage")
    task = relationship("Task", back_populates="usage")

class CacheEntry(Base):
    __tablename__ = "cache_entries"
    
    id = Column(String, primary_key=True)
    embedding = Column(JSON)  # pgvector field
    response = Column(String)
    created_at = Column(DateTime, server_default=func.now())
