"""
Authentication module for API key verification
"""
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Security scheme
security = HTTPBearer()

# Get API key from environment
API_KEY = os.getenv("API_KEY", "dev-api-key-change-in-production")

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)) -> str:
    """
    Verify API key from Authorization header
    
    Args:
        credentials: HTTPBearer credentials from request header
        
    Returns:
        str: The verified API key
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    if credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials
