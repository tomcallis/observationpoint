"""
Update Comp Rate Tracker:
- Rename "Weekly Rates by Property" → "2026 Rates"
- Add a Trends tab summarizing key metrics per property per year
"""

import pickle
import time
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import gspread

SS_ID = "12dSdy7mwx27F9IZrBd70Ydr1T7L-tm5A51kPnbddPMg"
TOKEN_PATH = "/Users/tomcallis/observationpoint/rental-data/token.pickle"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def hex_to_rgb(hex_color):
    h = hex_color.lstrip("#")
    return {
        "red": int(h[0:2], 16) / 255,
        "green": int(h[2:4], 16) / 255,
        "blue": int(h[4:6], 16) / 255,
    }


def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)

    ss = client.open_by_key(SS_ID)

    # --- Rename "Weekly Rates by Property" → "2026 Rates" (skip if already done) ---
    try:
        ws_rates = ss.worksheet("Weekly Rates by Property")
        sheet1_id = ws_rates._properties["sheetId"]
        sheets_svc.spreadsheets().batchUpdate(
            spreadsheetId=SS_ID,
            body={"requests": [{
                "updateSheetProperties": {
                    "properties": {"sheetId": sheet1_id, "title": "2026 Rates"},
                    "fields": "title"
                }
            }]}
        ).execute()
        print("Renamed → 2026 Rates")
    except Exception:
        print("Tab already named '2026 Rates' — skipping rename.")
    time.sleep(1)

    # --- Add Trends tab (or clear existing) ---
    try:
        ws_trends = ss.add_worksheet(title="Trends", rows=60, cols=12, index=1)
        print("Created Trends tab.")
    except Exception:
        ws_trends = ss.worksheet("Trends")
        ws_trends.clear()
        print("Cleared existing Trends tab.")
    trends_id = ws_trends._properties["sheetId"]
    time.sleep(1)

    header_rows = [
        ["Observation Point — Comp Rate Trends"],
        ["Key metrics per property per year. Update once per season after pulling current rates."],
        [""],
        [
            "Year", "Property", "Water Type", "BR",
            "Off-Peak Floor\n(Nov–Apr)", "Shoulder\n(Apr–May)", "Mid-Season\n(May, Sep)",
            "Peak\n(Jun, Aug)", "Peak — July",
            "Occupancy\n(est. %)", "Notes"
        ],
    ]

    # 2026 data rows — one per property
    data_2026 = [
        [2026, "Observation Point",     "Soundfront",       2, 1095, 1095, 1685, 2200, 2725, "",  "Baseline; 30' dock; sleeps 6"],
        [2026, "Tiki Hut (S&S #1076)", "Soundfront",       2,  495,  595, 1095, 1995, 2195, "",  "Brigand's Bay; no dock; sleeps 4"],
        [2026, "Bay Dream Believer (S&S #1104)", "Canalfront condo", 2, 445, 445, 995, 1795, 1795, "", "Hatteras Village; sleeps 4"],
        [2026, "Skate Away (Dolphin #111)", "Soundfront",   3,  900,  900, 1175, 1850, 1850, "",  "Frisco; 3BR context comp; sleeps 7"],
        [2026, "Island Dreaming (Dolphin #102)", "Soundside", 3, 625, 625, 900, 1400, 1400, "",  "Frisco; 3BR soundside; sleeps 6"],
        ["", "", "", "", "", "", "", "", "", "", ""],
    ]

    # Placeholder rows for 2027 (user fills in)
    placeholder_2027 = [
        ["— 2027 (update after pulling rates) —", "", "", "", "", "", "", "", "", "", ""],
        [2027, "Observation Point",     "Soundfront",       2, "", "", "", "", "", "", ""],
        [2027, "Tiki Hut (S&S #1076)", "Soundfront",       2, "", "", "", "", "", "", ""],
        [2027, "Bay Dream Believer (S&S #1104)", "Canalfront condo", 2, "", "", "", "", "", "", ""],
        [2027, "Skate Away (Dolphin #111)", "Soundfront",   3, "", "", "", "", "", "", ""],
        [2027, "Island Dreaming (Dolphin #102)", "Soundside", 3, "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", ""],
    ]

    instructions = [
        ["How to update this tab:"],
        ["  1. Pull rates for each property using source URLs in the year tab (e.g. '2026 Rates')"],
        ["  2. Fill in the key seasonal rate for each column (use the off-peak minimum, peak maximum)"],
        ["  3. Add a new block of rows for the new year — copy the placeholder above"],
        ["  4. Add any new comp properties as new rows within that year's block"],
        ["  5. Note any major changes in the Notes column (e.g. 'raised peak +$200', 'new mgmt company')"],
    ]

    all_rows = header_rows + data_2026 + placeholder_2027 + [[""]] + instructions
    ws_trends.update(values=all_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(2)

    # --- Format Trends tab ---
    requests = [
        # Title
        {
            "repeatCell": {
                "range": {"sheetId": trends_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 14}}},
                "fields": "userEnteredFormat.textFormat"
            }
        },
        # Column headers (row 4)
        {
            "repeatCell": {
                "range": {"sheetId": trends_id, "startRowIndex": 3, "endRowIndex": 4},
                "cell": {"userEnteredFormat": {
                    "textFormat": {"bold": True, "foregroundColor": {"red": 1, "green": 1, "blue": 1}},
                    "backgroundColor": hex_to_rgb("4a86e8"),
                    "wrapStrategy": "WRAP",
                }},
                "fields": "userEnteredFormat(textFormat,backgroundColor,wrapStrategy)"
            }
        },
        # Highlight OP rows (rows 5 and 12 — 2026 and 2027 OP)
        {
            "repeatCell": {
                "range": {"sheetId": trends_id, "startRowIndex": 4, "endRowIndex": 5},
                "cell": {"userEnteredFormat": {
                    "backgroundColor": hex_to_rgb("cfe2f3"),
                    "textFormat": {"bold": True}
                }},
                "fields": "userEnteredFormat(backgroundColor,textFormat)"
            }
        },
        {
            "repeatCell": {
                "range": {"sheetId": trends_id, "startRowIndex": 12, "endRowIndex": 13},
                "cell": {"userEnteredFormat": {
                    "backgroundColor": hex_to_rgb("cfe2f3"),
                    "textFormat": {"bold": True}
                }},
                "fields": "userEnteredFormat(backgroundColor,textFormat)"
            }
        },
        # Currency format on rate columns (E–I = cols 4–8)
        {
            "repeatCell": {
                "range": {"sheetId": trends_id, "startRowIndex": 4, "endRowIndex": 20, "startColumnIndex": 4, "endColumnIndex": 9},
                "cell": {"userEnteredFormat": {
                    "numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}
                }},
                "fields": "userEnteredFormat.numberFormat"
            }
        },
        # Freeze header rows
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": trends_id,
                    "gridProperties": {"frozenRowCount": 4, "frozenColumnCount": 2}
                },
                "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
            }
        },
        # Auto-resize
        {
            "autoResizeDimensions": {
                "dimensions": {"sheetId": trends_id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 11}
            }
        },
        # Move Trends tab to position 0 (first tab)
        {
            "updateSheetProperties": {
                "properties": {"sheetId": trends_id, "index": 0},
                "fields": "index"
            }
        },
    ]

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=SS_ID,
        body={"requests": requests}
    ).execute()
    print("Trends tab created and formatted.")

    print(f"\nDone! https://docs.google.com/spreadsheets/d/{SS_ID}/edit")


if __name__ == "__main__":
    main()
