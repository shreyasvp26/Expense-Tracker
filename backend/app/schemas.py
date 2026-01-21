from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RawMessage(BaseModel):
    raw_text: str
    timestamp: datetime
    source: str
    sender: Optional[str] = "UNKNOWN"


class TransactionResponse(BaseModel):
    id: Optional[int]
    date: Optional[str]
    amount: float
    merchant: str
    category: Optional[str]
    bank: Optional[str]
    transaction_type: str
