import os
import pickle
import json
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

# Open the original spreadsheet
sheet = client.open_by_key("1PoP04esh7yKdgCDo-XiAqLBDcUWFvBOyT9zivOtZPIk")

print(f"Spreadsheet: {sheet.title}")
print(f"Sheets: {[ws.title for ws in sheet.worksheets()]}\n")

for ws in sheet.worksheets():
    print(f"--- Sheet: {ws.title} ---")
    data = ws.get_all_values()
    for i, row in enumerate(data[:5]):
        print(f"  Row {i+1}: {row}")
    print(f"  Total rows: {len(data)}\n")
