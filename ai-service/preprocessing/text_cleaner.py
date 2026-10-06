import re

def clean_text(text: str) -> str:
    """
    Clean and normalize raw incident description text for NLP modeling.
    """
    if not isinstance(text, str):
        return ""
    
    # Lowercase
    text = text.lower()
    
    # Replace URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    
    # Replace email addresses
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' ', text)
    
    # Replace phone numbers
    text = re.sub(r'\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b', ' ', text)
    
    # Remove special characters keeping alphanumerics and basic punctuation
    text = re.sub(r'[^a-zA-Z0-9\s.,!?]', ' ', text)
    
    # Normalize multiple whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
