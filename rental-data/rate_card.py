import pickle, time
import gspread
from googleapiclient.discovery import build
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
sheets_svc = build("sheets", "v4", credentials=creds)
SSID = "1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw"

# Create or clear the tab
try:
    ws = ss.worksheet("2027 Rate Card")
    ws.clear()
except:
    ws = ss.add_worksheet("2027 Rate Card", rows=60, cols=10)

time.sleep(1)

rows = [
    ["OBSERVATION POINT — 2027 RATE CARD", "", "", "", ""],
    [""],
    ["Season", "Months", "Weekly Rate", "Nightly Rate", "Notes"],
    ["Off-Peak",   "Jan · Feb · Nov · Dec",  "$1,095", "$156",  "Low season; 3-night minimum recommended"],
    ["Shoulder",   "Mar · Apr · Oct",          "$1,095", "$156",  "Spring shoulder; flexible stay lengths"],
    ["Mid-Season", "May · September",           "$1,685", "$241",  "Strong demand; 7-night preferred"],
    ["Peak",       "June · August",             "$2,200", "$314",  "High season; 7-night minimum"],
    ["Peak",       "July",                      "$2,725", "$389",  "Peak of peak; book early"],
    [""],
    ["HOLIDAY PREMIUMS", "", "", "", ""],
    ["Holiday",         "Date",           "Weekly Rate", "Nightly Rate", "vs. Standard Rate"],
    ["Easter",          "Apr 4, 2027",    "$1,200", "$171",  "+10% over Shoulder"],
    ["Memorial Day",    "May 31, 2027",   "$2,300", "$329",  "+37% over Mid-Season"],
    ["Independence Day","Jul 4, 2027",    "$2,850", "$407",  "+5% over July Peak"],
    ["Labor Day",       "Sep 6, 2027",    "$1,575", "$225",  "+7% over Mid-Season (holiday bump)"],
    ["Thanksgiving",    "Nov 25, 2027",   "$1,200", "$171",  "+10% over Off-Peak"],
    ["Christmas/NYE",   "Dec 25–Jan 1",   "$1,300", "$186",  "+19% over Off-Peak"],
    [""],
    ["INCOME PROJECTION", "", "", "", ""],
    ["Assumption",          "Value", "", "", ""],
    ["Rentable weeks",       "47",   "", "", ""],
    ["Family/Comp weeks",    "8",    "", "", ""],
    ["Projected occupancy",  "45%",  "", "", ""],
    ["Projected booked weeks","21",  "", "", ""],
    ["Projected 2027 income","$38,790", "", "", ""],
    ["2025 actual income",   "$24,497", "", "", ""],
    ["2024 actual income",   "$31,552", "", "", ""],
    ["vs. 2025",             "+$14,293", "", "", ""],
    ["vs. 2024",             "+$7,238",  "", "", ""],
]

ws.update(values=rows, range_name="A1")
time.sleep(1)

# --- Formatting ---
def hex_to_rgb(h):
    h = h.lstrip("#")
    return {"red": int(h[0:2],16)/255, "green": int(h[2:4],16)/255, "blue": int(h[4:6],16)/255}

sid = ws._properties["sheetId"]

def cell_range(r1, c1, r2, c2):
    return {"sheetId": sid, "startRowIndex": r1, "endRowIndex": r2,
            "startColumnIndex": c1, "endColumnIndex": c2}

def bg(r1, c1, r2, c2, color):
    return {"repeatCell": {"range": cell_range(r1,c1,r2,c2),
        "cell": {"userEnteredFormat": {"backgroundColor": hex_to_rgb(color)}},
        "fields": "userEnteredFormat.backgroundColor"}}

def bold(r1, c1, r2, c2):
    return {"repeatCell": {"range": cell_range(r1,c1,r2,c2),
        "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
        "fields": "userEnteredFormat.textFormat.bold"}}

def font_size(r1, c1, r2, c2, size):
    return {"repeatCell": {"range": cell_range(r1,c1,r2,c2),
        "cell": {"userEnteredFormat": {"textFormat": {"fontSize": size}}},
        "fields": "userEnteredFormat.textFormat.fontSize"}}

def align(r1, c1, r2, c2, h="LEFT"):
    return {"repeatCell": {"range": cell_range(r1,c1,r2,c2),
        "cell": {"userEnteredFormat": {"horizontalAlignment": h}},
        "fields": "userEnteredFormat.horizontalAlignment"}}

def col_width(col_idx, width_px):
    return {"updateDimensionProperties": {
        "range": {"sheetId": sid, "dimension": "COLUMNS",
                  "startIndex": col_idx, "endIndex": col_idx+1},
        "properties": {"pixelSize": width_px},
        "fields": "pixelSize"}}

def merge(r1, c1, r2, c2):
    return {"mergeCells": {"range": cell_range(r1,c1,r2,c2), "mergeType": "MERGE_ALL"}}

requests = [
    # Title
    merge(0,0,1,5),
    bg(0,0,1,5, "1a3a5c"),
    {"repeatCell": {"range": cell_range(0,0,1,5),
        "cell": {"userEnteredFormat": {
            "backgroundColor": hex_to_rgb("1a3a5c"),
            "textFormat": {"bold": True, "fontSize": 16, "foregroundColor": hex_to_rgb("FFFFFF")},
            "horizontalAlignment": "CENTER"}},
        "fields": "userEnteredFormat"}},

    # Section header: Season Rates
    merge(2,0,3,5),
    bg(2,0,3,5, "2e6da4"),
    {"repeatCell": {"range": cell_range(2,0,3,5),
        "cell": {"userEnteredFormat": {
            "backgroundColor": hex_to_rgb("2e6da4"),
            "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": hex_to_rgb("FFFFFF")},
            "horizontalAlignment": "LEFT"}},
        "fields": "userEnteredFormat"}},

    # Season data rows alternating
    bg(3,0,4,5, "d6e4f7"),   # Off-Peak
    bg(4,0,5,5, "eef4fc"),   # Shoulder
    bg(5,0,6,5, "d6e4f7"),   # Mid-Season
    bg(6,0,7,5, "f7c6c6"),   # Peak Jun/Aug
    bg(7,0,8,5, "f0a0a0"),   # Peak Jul (deeper red/orange)

    # Section header: Holiday Premiums
    merge(9,0,10,5),
    bg(9,0,10,5, "2e6da4"),
    {"repeatCell": {"range": cell_range(9,0,10,5),
        "cell": {"userEnteredFormat": {
            "backgroundColor": hex_to_rgb("2e6da4"),
            "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": hex_to_rgb("FFFFFF")},
            "horizontalAlignment": "LEFT"}},
        "fields": "userEnteredFormat"}},

    # Holiday column headers
    bg(10,0,11,5, "dce8f5"),
    bold(10,0,11,5),

    # Holiday rows alternating
    bg(11,0,12,5, "fff8e7"),
    bg(12,0,13,5, "fff0c8"),
    bg(13,0,14,5, "fff0c8"),
    bg(14,0,15,5, "fff8e7"),
    bg(15,0,16,5, "fff0c8"),
    bg(16,0,17,5, "fff8e7"),

    # Section header: Income Projection
    merge(18,0,19,5),
    bg(18,0,19,5, "2e6da4"),
    {"repeatCell": {"range": cell_range(18,0,19,5),
        "cell": {"userEnteredFormat": {
            "backgroundColor": hex_to_rgb("2e6da4"),
            "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": hex_to_rgb("FFFFFF")},
            "horizontalAlignment": "LEFT"}},
        "fields": "userEnteredFormat"}},

    # Projection rows
    bg(19,0,20,5, "eef4fc"),
    bg(20,0,21,5, "d6e4f7"),
    bg(21,0,22,5, "eef4fc"),
    bg(22,0,23,5, "d6e4f7"),
    bg(23,0,24,5, "eef4fc"),
    bg(24,0,25,5, "d6f7d6"),  # projected income — green
    bg(25,0,26,5, "f0f0f0"),
    bg(26,0,27,5, "f0f0f0"),
    bg(27,0,28,5, "d6f7d6"),  # vs 2025 — green
    bg(28,0,29,5, "d6f7d6"),  # vs 2024 — green

    # Bold season/holiday header rows
    bold(3,0,8,5),
    bold(11,0,17,5),
    bold(19,0,29,2),

    # Column widths
    col_width(0, 180),  # Season/Holiday
    col_width(1, 210),  # Months/Date
    col_width(2, 130),  # Weekly
    col_width(3, 130),  # Nightly
    col_width(4, 280),  # Notes

    # Freeze row 1 (title)
    {"updateSheetProperties": {
        "properties": {"sheetId": sid, "gridProperties": {"frozenRowCount": 1}},
        "fields": "gridProperties.frozenRowCount"}},

    # Center rate columns
    align(2,2,29,4, "CENTER"),
]

sheets_svc.spreadsheets().batchUpdate(
    spreadsheetId=SSID,
    body={"requests": requests}
).execute()

print("2027 Rate Card created.")
print(f"https://docs.google.com/spreadsheets/d/{SSID}/edit")
