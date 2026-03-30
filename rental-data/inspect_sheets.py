import os
import pickle
import gspread
from google.auth.transport.requests import Request

def get_creds():
    token_path = os.path.join(os.path.dirname(__file__), "token.pickle")
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
client = gspread.authorize(creds)

# Check both spreadsheets for annual totals
sheets_to_check = {
    "Rates": "1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY",
    "Rental": "1PoP04esh7yKdgCDo-XiAqLBDcUWFvBOyT9zivOtZPIk"
}

for name, key in sheets_to_check.items():
    ss = client.open_by_key(key)
    print(f"\n{'='*60}")
    print(f"SPREADSHEET: {name}")
    print(f"{'='*60}")
    for ws in ss.worksheets():
        data = ws.get_all_values()
        if not any(any(c for c in row) for row in data):
            continue
        print(f"\n--- {ws.title} ---")
        print(f"  Header: {data[0] if data else 'empty'}")
        # Print last 3 non-empty rows (likely totals)
        non_empty = [r for r in data if any(c for c in r)]
        for row in non_empty[-3:]:
            print(f"  Last rows: {row}")
