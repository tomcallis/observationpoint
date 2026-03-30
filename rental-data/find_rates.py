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

results = service.files().list(
    q="name contains 'Observation Point Rates' and mimeType = 'application/vnd.google-apps.spreadsheet'",
    fields="files(id, name, modifiedTime)"
).execute()

files = results.get("files", [])
if files:
    for f in files:
        print(f"Found: {f['name']} | ID: {f['id']} | Modified: {f['modifiedTime'][:10]}")
else:
    print("No spreadsheet found matching 'Observation Point Rates'.")
