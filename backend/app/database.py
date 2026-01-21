from sqlalchemy import create_engine, Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./expenses.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Financial Data - Using Numeric instead of Float for currency precision
    amount = Column(Numeric(10, 2), nullable=False)
    merchant = Column(String, nullable=False)
    category = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # "Income" or "Expense"
    
    # Payment Details
    bank = Column(String, nullable=True)
    payment_mode = Column(String, nullable=True)
    upi_id = Column(String, unique=True, index=True, nullable=True)  # Prevent duplicates
    
    # Metadata
    raw_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def init_db():
    Base.metadata.create_all(bind=engine)
