import os
import pickle
import gspread
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

def get_creds():
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "token.pickle")
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
service = build("drive", "v3", credentials=creds)

results = service.files().list(
    q="name = 'Observation Point' and mimeType = 'application/vnd.google-apps.folder'",
    fields="files(id, name, webViewLink)"
).execute()

files = results.get("files", [])
if files:
    for f in files:
        print(f"Found: {f['name']} | ID: {f['id']} | Link: {f['webViewLink']}")
else:
    print("No folder named 'Observation Point' found.")
