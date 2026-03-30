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

for tab in ["Rate History", "2027 Projection", "Annual Summary"]:
    ws = ss.worksheet(tab)
    data = ws.get_all_values()
    print(f"\n=== {tab} ===")
    for row in data[:20]:
        if any(row):
            print(row)
