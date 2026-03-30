import pickle
import gspread
from google.auth.transport.requests import Request

def get_creds():
    token_path = "/Users/tomcallis/observationpoint/rental-data/token.pickle"
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
client = gspread.authorize(creds)
ss = client.open_by_key("1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw")

ws = ss.worksheet("Annual Summary")
data = ws.get_all_values()

for i, row in enumerate(data):
    if row and row[0] == "2027":
        row_num = i + 1
        ws.update_cell(row_num, 2, "")          # Clear Actual Income
        ws.update_cell(row_num, 3, "$38,790")   # Move to Predicted Income
        print(f"Fixed: 2027 projected income moved to Predicted Income column")
        break
