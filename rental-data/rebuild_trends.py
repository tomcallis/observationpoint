"""
Rebuild Trends tab with holiday columns added:
Off | Shoulder 1 | Memorial Day | Peak | July 4 | Shoulder 2 | Labor Day | Off | Notes
"""

import pickle, time
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import gspread

COMP_SS_ID = "12dSdy7mwx27F9IZrBd70Ydr1T7L-tm5A51kPnbddPMg"
TOKEN_PATH = "/Users/tomcallis/observationpoint/rental-data/token.pickle"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def hex_rgb(h):
    h = h.lstrip("#")
    return {"red": int(h[0:2],16)/255, "green": int(h[2:4],16)/255, "blue": int(h[4:6],16)/255}


def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)

    ss = client.open_by_key(COMP_SS_ID)
    ws = ss.worksheet("Trends")
    ws.clear()
    time.sleep(0.5)
    sid = ws._properties["sheetId"]

    # Resize to fit more columns
    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=COMP_SS_ID,
        body={"requests": [{"updateSheetProperties": {
            "properties": {"sheetId": sid, "gridProperties": {"rowCount": 60, "columnCount": 14}},
            "fields": "gridProperties.rowCount,gridProperties.columnCount"
        }}]}
    ).execute()
    time.sleep(0.5)

    header_rows = [
        ["Observation Point — Comp Rate Trends"],
        ["Key metrics per property per year. Update once per season after pulling current rates."],
        ["Season boundaries: Winter = Jan–Mar, Nov–Dec  |  Spring = Apr–May  |  Summer = Jun–Aug  |  Fall = Sep–Oct"],
        [""],
        [
            "Year", "Property", "Water Type", "BR",
            "Winter\n(Jan–Mar,\nNov–Dec)",
            "Spring\n(Apr–May)",
            "Memorial\nDay",
            "Summer\n(Jun–Aug)",
            "July 4th\nWeek",
            "Fall\n(Sep–Oct)",
            "Labor\nDay",
            "Notes",
        ],
    ]

    # 2026 data
    # OP: Winter=$1,050 | Spring=$1,575 | MemDay=$2,075 | Summer=$2,550 | Jul4=$2,750 | Fall=$1,400 | Labor=$2,075
    # Tiki Hut: Winter=$495 | Spring=$1,195 | MemDay≈$1,995 | Summer=$2,195 plateau | Jul4=$2,195 | Fall=$1,795 | Labor≈$995
    # Bay Dream: Winter=$445 | Spring=$995 | MemDay≈$1,695 | Summer=$1,795 | Jul4=$1,795 | Fall=$1,295 | Labor≈$695
    # Skate Away: Winter=$900 | Spring=$1,175 | MemDay≈$1,850 | Summer=$1,850 | Jul4=$1,850 | Fall=$1,350 | Labor=$900
    # Island Dreaming: Winter=$625 | Spring=$900 | MemDay≈$1,400 | Summer=$1,400 | Jul4=$1,400 | Fall=$950 | Labor=$950

    data_2026 = [
        [2026, "Observation Point",             "Soundfront",       2, "$1,050", "$1,575", "$2,075", "$2,550", "$2,750", "$1,400", "$2,075", "Baseline; 30' dock; sleeps 6. Proposed 2026 rates."],
        [2026, "Tiki Hut (S&S #1076)",          "Soundfront",       2, "$495",   "$1,195", "$1,995", "$2,195", "$2,195", "$1,795", "$995",   "Brigand's Bay; no dock; sleeps 4. Jul plateau thru Aug 8"],
        [2026, "Bay Dream Believer (S&S #1104)", "Canalfront condo", 2, "$445",   "$995",   "$1,695", "$1,795", "$1,795", "$1,295", "$695",   "Hatteras Village; sleeps 4; est. for holidays"],
        [2026, "Skate Away (Dolphin #111)",      "Soundfront",       3, "$900",   "$1,175", "$1,850", "$1,850", "$1,850", "$1,350", "$900",   "Frisco; 3BR; sleeps 7; no holiday premium listed"],
        [2026, "Island Dreaming (Dolphin #102)", "Soundside",        3, "$625",   "$900",   "$1,400", "$1,400", "$1,400", "$950",   "$950",   "Frisco; 3BR soundside; sleeps 6. Source of 5-bucket model"],
        ["", "", "", "", "", "", "", "", "", "", "", ""],
    ]

    placeholder_2027 = [
        ["— 2027 (update after pulling rates) —", "", "", "", "", "", "", "", "", "", "", ""],
        [2027, "Observation Point",             "Soundfront",       2, "", "", "", "", "", "", "", ""],
        [2027, "Tiki Hut (S&S #1076)",          "Soundfront",       2, "", "", "", "", "", "", "", ""],
        [2027, "Bay Dream Believer (S&S #1104)", "Canalfront condo", 2, "", "", "", "", "", "", "", ""],
        [2027, "Skate Away (Dolphin #111)",      "Soundfront",       3, "", "", "", "", "", "", "", ""],
        [2027, "Island Dreaming (Dolphin #102)", "Soundside",        3, "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", ""],
    ]

    instructions = [
        [""],
        ["How to update this tab:"],
        ["  1. Pull rates for each property using source URLs in the '2026 Rates' tab"],
        ["  2. Enter the base weekly rate for each season bucket"],
        ["  3. Enter the specific holiday week rate in the holiday columns (if a premium is charged)"],
        ["  4. If a comp doesn't charge a holiday premium, repeat the season rate in that column"],
        ["  5. Copy the year placeholder block for each new year"],
    ]

    all_rows = header_rows + data_2026 + placeholder_2027 + instructions
    ws.update(values=all_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # --- Formatting ---
    def white_header(row_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
            "cell": {"userEnteredFormat": {
                "textFormat": {"bold": True, "foregroundColor": {"red":1,"green":1,"blue":1}},
                "backgroundColor": hex_rgb("4a86e8"),
                "wrapStrategy": "WRAP",
            }},
            "fields": "userEnteredFormat(textFormat,backgroundColor,wrapStrategy)"
        }}

    def highlight_op(row_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
            "cell": {"userEnteredFormat": {
                "backgroundColor": hex_rgb("cfe2f3"),
                "textFormat": {"bold": True}
            }},
            "fields": "userEnteredFormat(backgroundColor,textFormat)"
        }}

    def holiday_col_header(row_idx, col_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1,
                      "startColumnIndex": col_idx, "endColumnIndex": col_idx+1},
            "cell": {"userEnteredFormat": {
                "textFormat": {"bold": True, "foregroundColor": {"red":1,"green":1,"blue":1}},
                "backgroundColor": hex_rgb("e06666"),  # red tint for holiday cols
                "wrapStrategy": "WRAP",
            }},
            "fields": "userEnteredFormat(textFormat,backgroundColor,wrapStrategy)"
        }}

    requests = [
        # Title
        {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": 0, "endRowIndex": 1},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True, "fontSize": 14}}},
            "fields": "userEnteredFormat.textFormat"
        }},
        # Column header row (row 4)
        white_header(4),
        # Override holiday columns with red tint (Memorial Day=col6, July4=col8, LaborDay=col10)
        holiday_col_header(4, 6),
        holiday_col_header(4, 8),
        holiday_col_header(4, 10),
        # Highlight OP rows
        highlight_op(5),   # 2026 OP
        highlight_op(12),  # 2027 OP
        # Currency format on rate cols (E–L = indices 4–11)
        {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": 5, "endRowIndex": 20,
                      "startColumnIndex": 4, "endColumnIndex": 12},
            "cell": {"userEnteredFormat": {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}}},
            "fields": "userEnteredFormat.numberFormat"
        }},
        # Freeze top 5 rows + first 2 cols
        {"updateSheetProperties": {
            "properties": {"sheetId": sid,
                           "gridProperties": {"frozenRowCount": 5, "frozenColumnCount": 2}},
            "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
        }},
    ]

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=COMP_SS_ID, body={"requests": requests}
    ).execute()

    print("Done!")
    print(f"https://docs.google.com/spreadsheets/d/{COMP_SS_ID}/edit")


if __name__ == "__main__":
    main()
