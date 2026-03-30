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

sheet = client.open_by_key("1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY")

print(f"Spreadsheet: {sheet.title}")
print(f"Sheets: {[ws.title for ws in sheet.worksheets()]}\n")

for ws in sheet.worksheets():
    data = ws.get_all_values()
    if not any(any(cell for cell in row) for row in data):
        continue
    print(f"--- Sheet: {ws.title} ({len(data)} rows) ---")
    for i, row in enumerate(data):
        print(f"  Row {i+1}: {row}")
    print()
