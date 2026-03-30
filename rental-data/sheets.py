import os
import pickle
import gspread
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def get_client():
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "token.pickle")
    secret_path = os.path.join(os.path.dirname(__file__), "client_secret.json")

    if os.path.exists(token_path):
        with open(token_path, "rb") as f:
            creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(secret_path, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_path, "wb") as f:
            pickle.dump(creds, f)

    return gspread.authorize(creds)


if __name__ == "__main__":
    client = get_client()
    print("Connected! Enter a Google Sheet name to open:")
    name = input("> ").strip()
    sheet = client.open(name).sheet1
    records = sheet.get_all_records()
    if records:
        for row in records:
            print(row)
    else:
        print("Sheet is empty or has no header row.")
