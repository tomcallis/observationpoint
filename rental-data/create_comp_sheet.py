"""
Create Observation Point Comp Rate Spreadsheet in Google Drive.
Run once — creates the sheet and populates with initial comp data.
"""

import pickle
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import gspread
import time

FOLDER_ID = "0B05aPI_UDvlmfmFUYnpGWTBJYnRNSVFkUjJCa1ctSjhaUXY0V21nQkVLbkV2Z2xmdUthN3M"
TOKEN_PATH = "/Users/tomcallis/observationpoint/rental-data/token.pickle"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def col(n):
    """Convert 1-based column index to A1 letter."""
    result = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        result = chr(65 + r) + result
    return result


def range_notation(sheet_title, r1, c1, r2, c2):
    return f"'{sheet_title}'!{col(c1)}{r1}:{col(c2)}{r2}"


def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    drive = build("drive", "v3", credentials=creds)
    sheets_svc = build("sheets", "v4", credentials=creds)

    # --- Create the spreadsheet ---
    print("Creating spreadsheet...")
    ss = client.create("Observation Point — Comp Rate Tracker")
    ss_id = ss.id
    print(f"Created: {ss_id}")

    # Move to Observation Point folder
    file = drive.files().get(fileId=ss_id, fields="parents").execute()
    old_parents = ",".join(file.get("parents", []))
    drive.files().update(
        fileId=ss_id,
        addParents=FOLDER_ID,
        removeParents=old_parents,
        fields="id, parents"
    ).execute()
    print("Moved to Observation Point folder.")

    # -----------------------------------------------------------------------
    # TAB 1: Weekly Rates by Property
    # -----------------------------------------------------------------------
    ws1 = ss.sheet1
    ws1.update_title("Weekly Rates by Property")
    time.sleep(1)

    # Header info
    header_rows = [
        ["Observation Point — Competitive Rate Tracker"],
        ["Last updated: March 2026 (comp data from research run 2026-03-29)"],
        [""],
        ["Notes:",
         "Rates are pre-tax weekly rates. OP rates per approved 2026 rate schedule.",
         "", "", "", "", "", "", "", "", "", ""],
        [""],
    ]

    # Column headers
    weeks = [
        "Feb 28–Mar 7",
        "Apr 4–11",
        "May 30–Jun 6",
        "Jun 27–Jul 4",
        "Jul 4–11",
        "Jul 25–Aug 1",
        "Sep 5–12",
    ]

    col_headers = [
        "Property", "Source / Listing ID", "Beds", "Baths", "Sleeps",
        "Water Type", "Location", "Notes",
    ] + weeks + ["Data Source URL"]

    # Data rows
    data_rows = [
        # OP
        [
            "Observation Point", "VRBO #766628", 2, 2, 6,
            "Soundfront", "Frisco – Brigand's Bay", "30' dock; OP baseline",
            1095, 1095, 2200, 2200, 2725, 2725, 1685,
            "https://www.vrbo.com/766628"
        ],
        # Tiki Hut
        [
            "Tiki Hut", "Surf or Sound #1076", 2, 2, 4,
            "Soundfront", "Frisco – Brigand's Bay", "Hot tub; no dock; sleeps 4",
            495, 595, 1195, 1995, 2195, 2195, 995,
            "https://www.surforsound.com/hatteras-vacation-rental/property/1076"
        ],
        # Bay Dream Believer
        [
            "Bay Dream Believer", "Surf or Sound #1104", 2, 2.5, 4,
            "Canalfront (condo)", "Hatteras Village", "Slash Creek Condos; ocean+sound views",
            445, 445, 995, 1795, 1795, 1795, 620,
            "https://www.surforsound.com/hatteras-vacation-rental/property/1104"
        ],
        # Skate Away (3BR context)
        [
            "Skate Away", "Dolphin Realty #111", 3, 3, 7,
            "Soundfront", "Frisco", "3BR context comp; 50088 Utopia Ln",
            900, 900, 1175, 1850, 1850, 1850, 900,
            "https://rentals.dolphinrealtyhatteras.com/index.php?method=unitShow&reservation_unitId=111"
        ],
        # Island Dreaming (3BR context)
        [
            "Island Dreaming Retreat", "Dolphin Realty #102", 3, 2.5, 6,
            "Soundside", "Frisco", "Not true soundfront; 50085 Timber Trail",
            625, 625, 900, 1400, 1400, 1400, 675,
            "https://rentals.dolphinrealtyhatteras.com/index.php?method=unitShow&reservation_unitId=102"
        ],
    ]

    # Write all rows
    all_rows = header_rows + [col_headers] + data_rows
    ws1.update(f"A1", all_rows, value_input_option="USER_ENTERED")
    time.sleep(2)

    # -----------------------------------------------------------------------
    # TAB 2: OP vs Comp Premium
    # -----------------------------------------------------------------------
    ws2 = ss.add_worksheet(title="OP vs Comp Premium", rows=30, cols=20)
    time.sleep(1)

    premium_header = [
        ["OP Premium vs. Tiki Hut (closest 2BR soundfront comp, Brigand's Bay)"],
        [""],
        ["Week", "OP Rate", "Tiki Hut Rate", "$ Premium", "% Premium"],
    ]

    # Row references into sheet 1 — we'll just hardcode the values for simplicity
    premium_data = [
        ["Feb 28–Mar 7",  1095,  495,  600,  "121%"],
        ["Apr 4–11",      1095,  595,  500,   "84%"],
        ["May 30–Jun 6",  2200, 1195, 1005,   "84%"],
        ["Jun 27–Jul 4",  2200, 1995,  205,   "10%"],
        ["Jul 4–11",      2725, 2195,  530,   "24%"],
        ["Jul 25–Aug 1",  2725, 2195,  530,   "24%"],
        ["Sep 5–12",      1685,  995,  690,   "69%"],
    ]

    notes = [
        [""],
        ["Key insight: OP off-peak/shoulder premium vs. Tiki Hut is very large (84–121%)."],
        ["Market floor for 2BR soundfront in Brigand's Bay shoulder appears to be ~$500–$600/week."],
        ["OP differentiators: 30' dock, sleeps 6 (vs. 4), reviews — justify peak premium."],
        ["Consider whether $1,095 floor suppresses off-season occupancy vs. market."],
    ]

    ws2.update("A1", premium_header + premium_data + notes, value_input_option="USER_ENTERED")
    time.sleep(2)

    # -----------------------------------------------------------------------
    # TAB 3: Notes & Sources
    # -----------------------------------------------------------------------
    ws3 = ss.add_worksheet(title="Notes & Sources", rows=40, cols=4)
    time.sleep(1)

    notes_data = [
        ["Research Notes — March 2026"],
        [""],
        ["Research date:", "2026-03-29"],
        ["Researcher:", "TomOS (Claude Code)"],
        [""],
        ["Property profile for comp matching:"],
        ["  Bedrooms:", "2"],
        ["  Bathrooms:", "2"],
        ["  Sleeps:", "6"],
        ["  Water type:", "Soundfront (Pamlico Sound)"],
        ["  Location:", "Brigand's Bay, Frisco NC"],
        ["  Special features:", "30' dock, sunset views"],
        [""],
        ["Sources searched:"],
        ["  VRBO", "vrbo.com"],
        ["  Surf or Sound Realty", "surforsound.com"],
        ["  Dolphin Realty", "dolphinrealtyhatteras.com"],
        ["  Midgett Realty", "midgettrealty.com (rates not published — contact required)"],
        ["  Hatteras Realty", "hatterasrealty.com"],
        [""],
        ["Listings not included (rates unavailable online):"],
        ["  Beach Life at Sea Whisper", "Midgett Realty HA010 — 2BR soundfront, Hatteras Village"],
        ["  Sweetheart Sound", "Midgett Realty BS14R — 3BR soundfront, Frisco"],
        [""],
        ["Update instructions:"],
        ["  1. Visit each source URL in 'Weekly Rates by Property' tab"],
        ["  2. Pull current rates for the week columns"],
        ["  3. Add new properties in empty rows"],
        ["  4. Update 'Last updated' date in row 2"],
        ["  5. Check Midgett and Hatteras Realty for new soundfront 2BR listings"],
    ]

    ws3.update("A1", notes_data, value_input_option="USER_ENTERED")
    time.sleep(2)

    # -----------------------------------------------------------------------
    # Formatting via Sheets API
    # -----------------------------------------------------------------------
    print("Applying formatting...")

    def hex_to_rgb(hex_color):
        h = hex_color.lstrip("#")
        return {
            "red": int(h[0:2], 16) / 255,
            "green": int(h[2:4], 16) / 255,
            "blue": int(h[4:6], 16) / 255,
        }

    sheet1_id = ws1._properties["sheetId"]
    sheet2_id = ws2._properties["sheetId"]

    requests = [
        # Bold title row (row 1) on sheet 1
        {
            "repeatCell": {
                "range": {"sheetId": sheet1_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 14}}},
                "fields": "userEnteredFormat.textFormat"
            }
        },
        # Bold column headers (row 6)
        {
            "repeatCell": {
                "range": {"sheetId": sheet1_id, "startRowIndex": 5, "endRowIndex": 6},
                "cell": {"userEnteredFormat": {
                    "textFormat": {"bold": True},
                    "backgroundColor": hex_to_rgb("4a86e8"),
                }},
                "fields": "userEnteredFormat(textFormat,backgroundColor)"
            }
        },
        # Font color white for header row
        {
            "repeatCell": {
                "range": {"sheetId": sheet1_id, "startRowIndex": 5, "endRowIndex": 6},
                "cell": {"userEnteredFormat": {
                    "textFormat": {"bold": True, "foregroundColor": {"red": 1, "green": 1, "blue": 1}}
                }},
                "fields": "userEnteredFormat.textFormat"
            }
        },
        # Highlight OP row (row 7) in light blue
        {
            "repeatCell": {
                "range": {"sheetId": sheet1_id, "startRowIndex": 6, "endRowIndex": 7},
                "cell": {"userEnteredFormat": {
                    "backgroundColor": hex_to_rgb("cfe2f3"),
                    "textFormat": {"bold": True}
                }},
                "fields": "userEnteredFormat(backgroundColor,textFormat)"
            }
        },
        # Format week rate columns (I–O, cols 9–15) as currency in data rows
        {
            "repeatCell": {
                "range": {"sheetId": sheet1_id, "startRowIndex": 6, "endRowIndex": 12, "startColumnIndex": 8, "endColumnIndex": 15},
                "cell": {"userEnteredFormat": {
                    "numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}
                }},
                "fields": "userEnteredFormat.numberFormat"
            }
        },
        # Freeze header rows (first 6 rows) and first column on sheet 1
        {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": sheet1_id,
                    "gridProperties": {"frozenRowCount": 6, "frozenColumnCount": 1}
                },
                "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
            }
        },
        # Auto-resize all columns on sheet 1
        {
            "autoResizeDimensions": {
                "dimensions": {"sheetId": sheet1_id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 16}
            }
        },
        # Bold title on sheet 2
        {
            "repeatCell": {
                "range": {"sheetId": sheet2_id, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 12}}},
                "fields": "userEnteredFormat.textFormat"
            }
        },
        # Bold headers on sheet 2 (row 3)
        {
            "repeatCell": {
                "range": {"sheetId": sheet2_id, "startRowIndex": 2, "endRowIndex": 3},
                "cell": {"userEnteredFormat": {
                    "textFormat": {"bold": True},
                    "backgroundColor": hex_to_rgb("4a86e8"),
                }},
                "fields": "userEnteredFormat(textFormat,backgroundColor)"
            }
        },
        # Currency format on cols B-D in sheet 2
        {
            "repeatCell": {
                "range": {"sheetId": sheet2_id, "startRowIndex": 3, "endRowIndex": 10, "startColumnIndex": 1, "endColumnIndex": 4},
                "cell": {"userEnteredFormat": {
                    "numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}
                }},
                "fields": "userEnteredFormat.numberFormat"
            }
        },
        # Auto-resize sheet 2
        {
            "autoResizeDimensions": {
                "dimensions": {"sheetId": sheet2_id, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 5}
            }
        },
    ]

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=ss_id,
        body={"requests": requests}
    ).execute()

    print("\nDone!")
    print(f"Spreadsheet URL: https://docs.google.com/spreadsheets/d/{ss_id}/edit")
    return ss_id


if __name__ == "__main__":
    main()
