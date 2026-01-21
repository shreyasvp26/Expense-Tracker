import re
from datetime import datetime


class SMSEngine:
    def __init__(self):
        # --- Gatekeeper Keywords ---
        self.KEYWORDS = {
            'ACTIONS': r'(debited|credited|paid|spent|received|sent|transfer|withdrawn|txn|transaction|UPI/DR|UPI/CR|DR|CR)',
            'CURRENCY': r'(Rs\.?|INR|INR\.)'
        }

        # --- Regex Patterns ---
        self.patterns = {
            'amount': re.compile(r'(?:Rs\.?|INR)\.?\s*([\d,]+(?:\.\d{1,2})?)', re.IGNORECASE),
            'ref_no': re.compile(r'(?:Ref\s?No|Txn\s?ID|Reference|Ref|UPI)\s?[:\-]?\s?([a-zA-Z0-9]+)', re.IGNORECASE),
            'date': re.compile(r'(\d{1,2}[-/\.](?:\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/\.]\d{2,4}|\d{4}-\d{2}-\d{2})', re.IGNORECASE),

            'cc_merchant': re.compile(r'(?:at|to)\s+([a-zA-Z0-9\s\&\.\@\/\-\(\)]+?)\s+(?:on|via|ref|UPI|\.|$)', re.IGNORECASE),
            'sent_to': re.compile(r'Sent\s+(?:Rs\.?|INR)\.?\s*[\d,]+\s+to\s+([a-zA-Z0-9\s\&\.\@\/\-\(\)]+)', re.IGNORECASE),
            'credit_by': re.compile(r'(?:by|from)\s+([a-zA-Z0-9\s\&\.\@\/\-\(\)]+)', re.IGNORECASE),
            'merchant_strict': re.compile(r'(?:to|at)\s+([a-zA-Z0-9\s\&\.\@\/\-\(\)]+)', re.IGNORECASE),
            'payer_strict': re.compile(r'(?:from|by)\s+([a-zA-Z0-9\s\&\.\@\/\-\(\)]+)', re.IGNORECASE),
            'upi_structure': re.compile(r'UPI/(?:DR|CR)/(\d+)/([a-zA-Z0-9\s\.\&\*\/\-\(\)]+)', re.IGNORECASE),
            'vpa_id': re.compile(r'([a-zA-Z0-9\.\-_]+@[a-zA-Z]+)')
        }

        self.noise_pattern = re.compile(
            r'(Not you\?.*|SMS BLOCK.*|Call 1800.*|Dial 1930.*|Balance enquiry.*)',
            re.IGNORECASE
        )

    def _clean_body(self, body: str) -> str:
        return self.noise_pattern.sub('', body).strip()

    def _detect_bank(self, sender: str, body: str) -> str:
        sender = sender.upper()
        if 'HDFCBK' in sender: return 'HDFC Bank'
        if 'SBI' in sender or 'SBIN' in sender: return 'SBI'
        if 'ICICI' in sender: return 'ICICI Bank'
        if 'AXIS' in sender: return 'Axis Bank'
        if 'KOTAK' in sender: return 'Kotak Bank'
        if 'PAYTM' in sender: return 'Paytm Bank'
        return "Unknown Bank"

    def _clean_recipient(self, name: str) -> str:
        if not name:
            return "Unknown"
        if '@' in name:
            name = name.split('@')[0]
        return name.strip()

    def parse_message(self, body: str, sender: str, timestamp):
        clean_body = self._clean_body(body)

        # --- Gatekeeper ---
        if not (
            re.search(self.KEYWORDS['ACTIONS'], clean_body, re.IGNORECASE)
            and re.search(self.KEYWORDS['CURRENCY'], clean_body, re.IGNORECASE)
        ):
            return None

        # --- Transaction Type ---
        txn_type = "Expense"
        if re.search(r'(credited|received|UPI/CR|\bCR\b)', clean_body, re.IGNORECASE):
            txn_type = "Income"

        # --- Amount ---
        amount_match = self.patterns['amount'].search(clean_body)
        amount = float(amount_match.group(1).replace(',', '')) if amount_match else 0.0

        # --- Reference / UPI ---
        ref_match = self.patterns['ref_no'].search(clean_body)
        upi_id = ref_match.group(1) if ref_match else None

        # --- Merchant Extraction ---
        merchant = "Unknown"

        if self.patterns['sent_to'].search(clean_body):
            merchant = self.patterns['sent_to'].search(clean_body).group(1)
        elif self.patterns['cc_merchant'].search(clean_body):
            merchant = self.patterns['cc_merchant'].search(clean_body).group(1)
        elif self.patterns['merchant_strict'].search(clean_body):
            merchant = self.patterns['merchant_strict'].search(clean_body).group(1)
        elif self.patterns['payer_strict'].search(clean_body):
            merchant = self.patterns['payer_strict'].search(clean_body).group(1)

        if merchant == "Unknown":
            vpa = self.patterns['vpa_id'].search(clean_body)
            if vpa:
                merchant = vpa.group(1)

        merchant = self._clean_recipient(merchant)

        # --- Date ---
        date_str = None
        date_match = self.patterns['date'].search(clean_body)
        if date_match:
            # Try multiple date formats
            date_formats = [
                '%d-%m-%Y', '%d/%m/%Y', '%d.%m.%Y',  # DD-MM-YYYY variants
                '%Y-%m-%d',  # ISO format
                '%d-%b-%Y', '%d-%B-%Y',  # DD-MMM-YYYY, DD-Month-YYYY
                '%d %b %Y', '%d %B %Y'   # DD MMM YYYY, DD Month YYYY
            ]
            
            for fmt in date_formats:
                try:
                    date_str = datetime.strptime(date_match.group(1), fmt).strftime('%Y-%m-%d')
                    break  # Stop on first successful parse
                except:
                    continue

        bank = self._detect_bank(sender, body)

        return {
            "date": date_str,
            "transaction_type": txn_type,
            "amount": amount,
            "merchant": merchant,
            "upi_id": upi_id,
            "bank": bank,
            "raw_message": body,
            "is_valid": amount > 0,
            "is_guess": merchant == "Unknown"
        }
