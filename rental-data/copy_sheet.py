import os
import pickle
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

def get_creds():
    token_path = os.path.join(os.path.dirname(__file__), "token.pickle")
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
service = build("drive", "v3", credentials=creds)

FILE_ID = "1PoP04esh7yKdgCDo-XiAqLBDcUWFvBOyT9zivOtZPIk"

copy = service.files().copy(
    fileId=FILE_ID,
    body={"name": "Copy of Observation Point Rental"}
).execute()

print(f"Copy created: {copy['name']}")
print(f"ID: {copy['id']}")
print(f"Link: https://docs.google.com/spreadsheets/d/{copy['id']}")
