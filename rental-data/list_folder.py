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

FOLDER_ID = "0B05aPI_UDvlmfmFUYnpGWTBJYnRNSVFkUjJCa1ctSjhaUXY0V21nQkVLbkV2Z2xmdUthN3M"

results = service.files().list(
    q=f"'{FOLDER_ID}' in parents",
    fields="files(id, name, mimeType, modifiedTime)",
    orderBy="name"
).execute()

files = results.get("files", [])
if files:
    for f in files:
        kind = "Folder" if f["mimeType"] == "application/vnd.google-apps.folder" else f["mimeType"].split(".")[-1]
        print(f"[{kind}] {f['name']} (modified: {f['modifiedTime'][:10]})")
else:
    print("Folder is empty.")
