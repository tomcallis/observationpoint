"""
1. Rebuild Trends tab with Off / Shoulder 1 / Peak / Shoulder 2 / Off columns
2. Add a Rate Model Comparison section to 2027 Recommendations tab
"""

import pickle, time
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import gspread

COMP_SS_ID    = "12dSdy7mwx27F9IZrBd70Ydr1T7L-tm5A51kPnbddPMg"
ANALYSIS_SS_ID = "1tyZVihY3dz5ENk8fxskN8zJBlE1K0mCpyEAnNNeOuZw"
TOKEN_PATH    = "/Users/tomcallis/observationpoint/rental-data/token.pickle"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def hex_rgb(h):
    h = h.lstrip("#")
    return {"red": int(h[0:2],16)/255, "green": int(h[2:4],16)/255, "blue": int(h[4:6],16)/255}


def white_header_row(sid, row_idx):
    return {"repeatCell": {
        "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
        "cell": {"userEnteredFormat": {
            "textFormat": {"bold": True, "foregroundColor": {"red":1,"green":1,"blue":1}},
            "backgroundColor": hex_rgb("4a86e8"),
            "wrapStrategy": "WRAP",
        }},
        "fields": "userEnteredFormat(textFormat,backgroundColor,wrapStrategy)"
    }}


def bold_row(sid, row_idx, font_size=11, bg=None):
    fmt = {"textFormat": {"bold": True, "fontSize": font_size}}
    fields = "userEnteredFormat.textFormat"
    if bg:
        fmt["backgroundColor"] = hex_rgb(bg)
        fields += ",userEnteredFormat.backgroundColor"
    return {"repeatCell": {
        "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
        "cell": {"userEnteredFormat": fmt}, "fields": fields
    }}


def highlight_op_row(sid, row_idx):
    return {"repeatCell": {
        "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
        "cell": {"userEnteredFormat": {
            "backgroundColor": hex_rgb("cfe2f3"),
            "textFormat": {"bold": True}
        }},
        "fields": "userEnteredFormat(backgroundColor,textFormat)"
    }}


def currency_range(sid, r1, r2, c1, c2):
    return {"repeatCell": {
        "range": {"sheetId": sid, "startRowIndex": r1, "endRowIndex": r2,
                  "startColumnIndex": c1, "endColumnIndex": c2},
        "cell": {"userEnteredFormat": {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}}},
        "fields": "userEnteredFormat.numberFormat"
    }}


def autosize(sid, end_col=12):
    return {"autoResizeDimensions": {
        "dimensions": {"sheetId": sid, "dimension": "COLUMNS", "startIndex": 0, "endIndex": end_col}
    }}


def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)

    # -----------------------------------------------------------------------
    # 1. Rebuild Trends tab (Comp Rate Tracker)
    # -----------------------------------------------------------------------
    print("Rebuilding Trends tab...")
    comp_ss = client.open_by_key(COMP_SS_ID)
    ws_trends = comp_ss.worksheet("Trends")
    ws_trends.clear()
    time.sleep(0.5)
    trends_id = ws_trends._properties["sheetId"]

    # New column structure: Off / Shoulder 1 / Peak / Shoulder 2 / Off
    # Dates align with Island Dreaming / proposed OP structure:
    #   Off:        Jan 1 – May 1  |  Sep 5 – Dec 31
    #   Shoulder 1: May 2 – Jun 5
    #   Peak:       Jun 6 – Aug 7
    #   Shoulder 2: Aug 8 – Sep 4

    header_rows = [
        ["Observation Point — Comp Rate Trends"],
        ["Key metrics per property per year. Update once per season after pulling current rates."],
        ["Season boundaries: Off = Jan–May / Sep–Dec  |  Shoulder 1 = May–Jun  |  Peak = Jun–Aug  |  Shoulder 2 = Aug–Sep"],
        [""],
        [
            "Year", "Property", "Water Type", "BR",
            "Off\n(Jan–May,\nSep–Dec)",
            "Shoulder 1\n(May–Jun)",
            "Peak\n(Jun–Aug)",
            "Shoulder 2\n(Aug–Sep)",
            "Notes",
        ],
    ]

    # 2026 data — re-mapped to new 5-bucket structure
    # Off: lowest rate (Jan–May / Sep–Dec)
    # Shoulder 1: May–Jun transition
    # Peak: Jun–Aug peak (using single peak rate, not split July)
    # Shoulder 2: Aug 8–Sep 4
    data_2026 = [
        [2026, "Observation Point",              "Soundfront",       2, "$1,043", "$1,575", "$2,065", "$1,393", "Baseline; 30' dock; sleeps 6. Jul 4 wk = $2,415; Jul = $2,555"],
        [2026, "Tiki Hut (S&S #1076)",           "Soundfront",       2, "$495",   "$1,195", "$2,195", "$1,795", "Brigand's Bay; no dock; sleeps 4. Jul plateau $2,195 thru Aug 8"],
        [2026, "Bay Dream Believer (S&S #1104)",  "Canalfront condo", 2, "$445",   "$995",   "$1,795", "$1,295", "Hatteras Village; sleeps 4"],
        [2026, "Skate Away (Dolphin #111)",       "Soundfront",       3, "$900",   "$1,175", "$1,850", "$1,350", "Frisco; 3BR context comp; sleeps 7"],
        [2026, "Island Dreaming (Dolphin #102)",  "Soundside",        3, "$625",   "$900",   "$1,400", "$950",   "Frisco; 3BR soundside; sleeps 6. Source of 5-bucket model"],
        ["", "", "", "", "", "", "", "", ""],
    ]

    placeholder_2027 = [
        ["— 2027 (update after pulling rates) —", "", "", "", "", "", "", "", ""],
        [2027, "Observation Point",              "Soundfront",       2, "", "", "", "", ""],
        [2027, "Tiki Hut (S&S #1076)",           "Soundfront",       2, "", "", "", "", ""],
        [2027, "Bay Dream Believer (S&S #1104)",  "Canalfront condo", 2, "", "", "", "", ""],
        [2027, "Skate Away (Dolphin #111)",       "Soundfront",       3, "", "", "", "", ""],
        [2027, "Island Dreaming (Dolphin #102)",  "Soundside",        3, "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", ""],
    ]

    instructions = [
        ["How to update this tab:"],
        ["  1. Pull rates for each property using source URLs in the '2026 Rates' tab"],
        ["  2. Enter the representative weekly rate for each season bucket"],
        ["  3. Note holiday premiums or exceptions in the Notes column"],
        ["  4. Copy the 2027 placeholder block for each new year"],
    ]

    all_rows = header_rows + data_2026 + placeholder_2027 + [[""], [""]] + instructions
    ws_trends.update(values=all_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # Format Trends tab
    fmt_requests = [
        bold_row(trends_id, 0, font_size=14),
        white_header_row(trends_id, 4),          # column headers row (index 4)
        highlight_op_row(trends_id, 5),          # 2026 OP row
        highlight_op_row(trends_id, 12),         # 2027 OP row
        currency_range(trends_id, 5, 18, 4, 8), # rate columns
        {"updateSheetProperties": {
            "properties": {"sheetId": trends_id,
                           "gridProperties": {"frozenRowCount": 5, "frozenColumnCount": 2}},
            "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
        }},
        autosize(trends_id, end_col=9),
    ]
    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=COMP_SS_ID, body={"requests": fmt_requests}
    ).execute()
    print("  Trends tab updated.")

    # -----------------------------------------------------------------------
    # 2. Add Rate Model Comparison to 2027 Recommendations tab
    # -----------------------------------------------------------------------
    print("Updating 2027 Recommendations tab...")
    analysis_ss = client.open_by_key(ANALYSIS_SS_ID)
    ws_rec = analysis_ss.worksheet("2027 Recommendations")
    rec_id = ws_rec._properties["sheetId"]

    # Append to existing sheet — find last row
    existing = ws_rec.get_all_values()
    last_row = len(existing) + 2  # leave a blank row gap

    comparison_rows = [
        [""],
        [""],
        ["RATE MODEL COMPARISON — 2027", "", "", "", "", "", "", ""],
        ["Two approaches to season structure for 2027. Either works; trade-off is simplicity vs. revenue capture in July.", "", "", "", "", "", "", ""],
        [""],
        # Model A header
        ["MODEL A — Flat Peak (5 buckets, simple)", "", "", "", "", "", "", ""],
        ["Inspired by Island Dreaming Retreat (Dolphin Realty) season structure.", "", "", "", "", "", "", ""],
        ["Season", "Dates", "Weekly Rate", "Nightly", "Notes", "", "", ""],
        ["Off",        "Jan 1 – May 2",  "$1,095", "$156", "Same rate both Off windows", "", "", ""],
        ["Shoulder 1", "May 3 – Jun 5",  "$1,650", "$236", "Memorial Day falls here → add $500 holiday premium", "", "", ""],
        ["Peak",       "Jun 6 – Aug 7",  "$2,150", "$307", "Single flat rate Jun–Aug. July 4 wk → add $375 premium", "", "", ""],
        ["Shoulder 2", "Aug 8 – Sep 4",  "$1,450", "$207", "", "", "", ""],
        ["Off",        "Sep 5 – Dec 31", "$1,095", "$156", "Labor Day falls here → add $355 premium", "", "", ""],
        [""],
        ["  Holiday premiums on top of base rate:", "", "", "", "", "", "", ""],
        ["  Memorial Day week", "$2,150", "(base = Shoulder 1, no extra needed — already at rate)", "", "", "", "", ""],
        ["  July 4 week",       "$2,525", "(Peak $2,150 + $375 premium)", "", "", "", "", ""],
        ["  Labor Day week",    "$1,450", "(base = Shoulder 2, no extra needed)", "", "", "", "", ""],
        ["  Thanksgiving",      "$1,150", "(base = Off + $55 premium)", "", "", "", "", ""],
        [""],
        ["  Projected revenue (21 paid weeks, typical mix):", "", "", "", "", "", "", ""],
        ["  ~2 Off + 3 Shoulder 1 + 9 Peak + 3 Shoulder 2 + 4 Off/Fall = ~$38,500", "", "", "", "", "", "", ""],
        [""],
        # Model B header
        ["MODEL B — July Premium (current structure, refined)", "", "", "", "", "", "", ""],
        ["Keeps a higher July rate to capture peak demand. More complex but higher upside.", "", "", "", "", "", "", ""],
        ["Season", "Dates", "Weekly Rate", "Nightly", "Notes", "", "", ""],
        ["Off",        "Jan 1 – May 2",  "$1,095", "$156", "", "", "", ""],
        ["Shoulder 1", "May 3 – Jun 5",  "$1,650", "$236", "", "", "", ""],
        ["Peak",       "Jun 6 – Jul 3",  "$2,150", "$307", "June + early Aug at this rate", "", "", ""],
        ["Peak (July)","Jul 4 – Aug 7",  "$2,650", "$379", "July commands ~$500 more than June — supported by booking history", "", "", ""],
        ["Shoulder 2", "Aug 8 – Sep 4",  "$1,450", "$207", "", "", "", ""],
        ["Off",        "Sep 5 – Dec 31", "$1,095", "$156", "", "", "", ""],
        [""],
        ["  Holiday premiums:", "", "", "", "", "", "", ""],
        ["  July 4 week",    "$2,525", "(already within Peak July range — list at top of range)", "", "", "", "", ""],
        ["  Memorial Day",   "$2,150", "(Shoulder 1 rate — no extra needed)", "", "", "", "", ""],
        ["  Labor Day",      "$1,450", "(Shoulder 2 rate — no extra needed)", "", "", "", "", ""],
        ["  Thanksgiving",   "$1,150", "(Off + $55 premium)", "", "", "", "", ""],
        [""],
        ["  Projected revenue (21 paid weeks, typical mix):", "", "", "", "", "", "", ""],
        ["  ~2 Off + 3 Shoulder 1 + 5 Peak + 4 Peak July + 3 Shoulder 2 + 4 Off/Fall = ~$41,500", "", "", "", "", "", "", ""],
        [""],
        # Comparison summary
        ["COMPARISON SUMMARY", "", "", "", "", "", "", ""],
        ["", "Model A (Flat Peak)", "Model B (July Premium)", "Difference", "", "", "", ""],
        ["Season buckets",        "5", "6", "Model A simpler", "", "", "", ""],
        ["Peak rate",             "$2,150", "$2,150 / $2,650", "Model B captures July premium", "", "", "", ""],
        ["Est. revenue (21 wks)", "~$38,500", "~$41,500", "+$3,000 for Model B", "", "", "", ""],
        ["Complexity",            "Low", "Medium", "", "", "", "", ""],
        ["Comp alignment",        "Matches Island Dreaming structure", "Similar to current OP structure", "", "", "", "", ""],
        [""],
        ["Recommendation: Model B if July historically books at full rate (it has — Lucinda King, Dina Shvets, Michele Wooten).", "", "", "", "", "", "", ""],
        ["Model A if you want simplicity and are OK leaving ~$500/July week on the table.", "", "", "", "", "", "", ""],
    ]

    # Write to sheet starting at last_row
    start = f"A{last_row}"
    ws_rec.update(values=comparison_rows, range_name=start, value_input_option="USER_ENTERED")
    time.sleep(1)

    # Format new section
    base = last_row - 1  # 0-indexed
    fmt_requests2 = [
        bold_row(rec_id, base + 2, font_size=13),          # "RATE MODEL COMPARISON"
        bold_row(rec_id, base + 5, font_size=11, bg="e8f0fe"),   # Model A header
        white_header_row(rec_id, base + 7),                # Model A col headers
        bold_row(rec_id, base + 23, font_size=11, bg="e8f0fe"),  # Model B header
        white_header_row(rec_id, base + 25),               # Model B col headers
        bold_row(rec_id, base + 37, font_size=11, bg="fce8b2"),  # Comparison summary
        white_header_row(rec_id, base + 38),               # comparison col headers
        autosize(rec_id, end_col=8),
    ]
    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=ANALYSIS_SS_ID, body={"requests": fmt_requests2}
    ).execute()
    print("  2027 Recommendations updated.")

    print("\nDone!")
    print(f"Comp Tracker: https://docs.google.com/spreadsheets/d/{COMP_SS_ID}/edit")
    print(f"Analysis:     https://docs.google.com/spreadsheets/d/{ANALYSIS_SS_ID}/edit")


if __name__ == "__main__":
    main()
