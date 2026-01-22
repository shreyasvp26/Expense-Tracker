from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.schemas import RawMessage, TransactionResponse
from app.parser import SMSEngine
from app.ml import predict_category
from app.database import init_db, SessionLocal, Transaction
from app.auth import verify_api_key
from datetime import datetime

app = FastAPI()

# ----------------------------
# Initialize resources ONCE
# ----------------------------
init_db()
sms_engine = SMSEngine()

# ----------------------------
# Database Dependency Injection
# ----------------------------
def get_db():
    """Database session dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/ingest-message", response_model=TransactionResponse)
def ingest_message(
    msg: RawMessage, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    # ----------------------------
    # 1️⃣ Input Validation
    # ----------------------------
    # Validate raw_text length (max 1000 characters)
    if len(msg.raw_text) > 1000:
        raise HTTPException(
            status_code=400,
            detail="Message text too long (max 1000 characters)"
        )
    
    # Validate timestamp is not in the future or too far in the past
    try:
        msg_time = datetime.fromisoformat(msg.timestamp.replace('Z', '+00:00'))
        now = datetime.now(msg_time.tzinfo) if msg_time.tzinfo else datetime.now()
        if msg_time > now:
            raise HTTPException(
                status_code=400,
                detail="Timestamp cannot be in the future"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timestamp format: {str(e)}"
        )
    
    # ----------------------------
    # 2️⃣ Parse SMS safely
    # ----------------------------
    try:
        parsed = sms_engine.parse_message(
            body=msg.raw_text,
            sender=msg.sender or "UNKNOWN",
            timestamp=msg.timestamp
        )
    except Exception as e:
        # Parser should NEVER crash the server
        raise HTTPException(
            status_code=400,
            detail=f"Parsing error: {str(e)}"
        )

    # ----------------------------
    # 3️⃣ Ignore non-transaction SMS
    # ----------------------------
    if not parsed or not parsed.get("is_valid"):
        # 204 = No Content (correct REST behavior here)
        # Use Response instead of HTTPException
        return Response(status_code=204)

    # ----------------------------
    # 4️⃣ ML categorization
    # ----------------------------
    try:
        category = predict_category(parsed["merchant"])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML classification error: {str(e)}"
        )

    # ----------------------------
    # 5️⃣ Check for duplicates using upi_id
    # ----------------------------
    upi_id = parsed.get("upi_id")
    if upi_id:
        existing = db.query(Transaction).filter(
            Transaction.upi_id == upi_id
        ).first()
        
        if existing:
            # Return existing transaction instead of creating duplicate
            return {
                "id": existing.id,
                "date": parsed.get("date"),
                "amount": float(existing.amount),
                "merchant": existing.merchant,
                "category": existing.category,
                "bank": existing.bank,
                "transaction_type": existing.transaction_type
            }

    # ----------------------------
    # 6️⃣ Save to database
    # ----------------------------
    try:
        transaction = Transaction(
            amount=parsed["amount"],
            merchant=parsed["merchant"],
            category=category,
            bank=parsed.get("bank"),
            payment_mode="UPI",
            transaction_type=parsed["transaction_type"],
            upi_id=upi_id,
            raw_message=msg.raw_text  # Store original SMS
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    # ----------------------------
    # 7️⃣ Return stored transaction
    # ----------------------------
    return {
        "id": transaction.id,
        "date": parsed.get("date"),
        "amount": float(transaction.amount),
        "merchant": transaction.merchant,
        "category": transaction.category,
        "bank": transaction.bank,
        "transaction_type": transaction.transaction_type
    }


@app.get("/transactions")
def get_transactions(
    limit: int = 100, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get list of transactions for Flutter app
    Returns transactions in descending order (newest first)
    """
    try:
        transactions = db.query(Transaction)\
            .order_by(Transaction.timestamp.desc())\
            .limit(limit)\
            .all()
        
        return {
            "count": len(transactions),
            "transactions": [
                {
                    "Date": t.timestamp.strftime("%Y-%m-%d %H:%M") if t.timestamp else None,
                    "Amount": float(t.amount),
                    "Recipient": t.merchant,
                    "Type": t.transaction_type,
                    "User_Bank": t.bank
                }
                for t in transactions
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching transactions: {str(e)}"
        )
