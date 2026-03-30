"""
Populate Trends sheet with OP historical rates for 2022–2025.
Extracts seasonal rates from the Rates spreadsheet and inserts rows
before the existing 2026 data.
"""

import pickle, time
from datetime import datetime
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import gspread

RATES_SS_ID = "1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY"
COMP_SS_ID  = "12dSdy7mwx27F9IZrBd70Ydr1T7L-tm5A51kPnbddPMg"
TOKEN_PATH  = "/Users/tomcallis/observationpoint/rental-data/token.pickle"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def clean_money(val):
    if not val: return 0.0
    s = str(val).strip().replace("$","").replace(",","").replace(" ","")
    try: return float(s)
    except: return 0.0


def parse_date(val):
    if not val or not str(val).strip(): return None
    s = str(val).strip()
    for fmt in ["%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"]:
        try: return datetime.strptime(s, fmt)
        except: pass
    return None


def parse_year_tab(ws, year):
    """Return list of {checkin, holiday, weekly} dicts for a year tab."""
    rows = ws.get_all_values()
    weeks = []
    for row in rows[1:]:
        if not row or not row[0].strip(): continue
        checkin = parse_date(row[0])
        if not checkin: continue

        holiday = row[2].strip().lower() if len(row) > 2 else ""

        if year == 2022:
            weekly = clean_money(row[8]) if len(row) > 8 else 0
        elif year in (2023, 2024, 2025, 2026):
            weekly = clean_money(row[3]) if len(row) > 3 else 0
        else:
            weekly = 0

        if weekly > 0:
            weeks.append({"checkin": checkin, "holiday": holiday, "weekly": weekly})
    return weeks


def extract_seasonal_rates(weeks, year):
    """
    Extract representative rates for each Trends column from weekly data.
    Returns dict keyed by column name.
    """
    def rate_for(fn):
        matches = [w["weekly"] for w in weeks if fn(w)]
        return max(matches) if matches else None

    off_jan_apr = rate_for(lambda w: w["checkin"].year == year and w["checkin"].month in (1,2,3,4))
    shoulder1   = rate_for(lambda w: w["checkin"].year == year and w["checkin"].month == 5
                           and "memorial" not in w["holiday"])
    mem_day     = rate_for(lambda w: "memorial" in w["holiday"])
    # Peak = Jun + Aug (not July)
    peak        = rate_for(lambda w: w["checkin"].year == year and w["checkin"].month in (6,8)
                           and "independence" not in w["holiday"] and "labor" not in w["holiday"])
    jul4        = rate_for(lambda w: "independence" in w["holiday"])
    # Shoulder 2 = Aug 8 onwards (use Aug second half as proxy)
    shoulder2   = rate_for(lambda w: w["checkin"].year == year and w["checkin"].month == 8
                           and w["checkin"].day >= 8)
    labor_day   = rate_for(lambda w: "labor" in w["holiday"])
    off_fall    = rate_for(lambda w: w["checkin"].year == year and w["checkin"].month in (10,11,12))

    # For "Off" column use the lower of Jan-Apr and fall rates (true floor)
    off_candidates = [r for r in [off_jan_apr, off_fall] if r]
    off = min(off_candidates) if off_candidates else None

    return {
        "off":       off,
        "shoulder1": shoulder1,
        "mem_day":   mem_day,
        "peak":      peak,
        "jul4":      jul4,
        "shoulder2": shoulder2,
        "labor_day": labor_day,
    }


def fmt(val):
    if val is None: return ""
    return f"${int(val):,}"


def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)

    # --- Parse each year from Rates spreadsheet ---
    rates_ss = client.open_by_key(RATES_SS_ID)
    year_tabs = {2022: "2022 Rates", 2023: "2023 Rates", 2024: "2024 Rates", 2025: "2025 Rates"}

    print("Extracting rates by year...")
    history = {}
    for year, tab in year_tabs.items():
        ws = rates_ss.worksheet(tab)
        weeks = parse_year_tab(ws, year)
        rates = extract_seasonal_rates(weeks, year)
        history[year] = rates
        print(f"  {year}: Off={fmt(rates['off'])}  Sh1={fmt(rates['shoulder1'])}  "
              f"MemDay={fmt(rates['mem_day'])}  Peak={fmt(rates['peak'])}  "
              f"Jul4={fmt(rates['jul4'])}  Sh2={fmt(rates['shoulder2'])}  "
              f"Labor={fmt(rates['labor_day'])}")

    # Notes per year
    notes = {
        2022: "Rates raised sharply mid-year. Jan-Feb floor $693; fall $903. No July premium.",
        2023: "Memorial Day reduced to $1,365 (late booking). July 4 wk $2,310 (first July premium). Labor Day $2,065.",
        2024: "July 4 jumped to $2,555. Rest of July at $2,065. Memorial Day at shoulder rate ($1,575).",
        2025: "Memorial Day first time at peak rate ($2,065). Full July rate $2,555; Jul 4 wk $2,415.",
    }

    # --- Build new OP rows to insert ---
    new_rows = []
    for year in [2022, 2023, 2024, 2025]:
        r = history[year]
        new_rows.append([
            year,
            "Observation Point",
            "Soundfront",
            2,
            fmt(r["off"]),
            fmt(r["shoulder1"]),
            fmt(r["mem_day"]),
            fmt(r["peak"]),
            fmt(r["jul4"]),
            fmt(r["shoulder2"]),
            fmt(r["labor_day"]),
            notes[year],
        ])

    # --- Insert into Trends sheet before row 6 (0-indexed row 5 = first 2026 data row) ---
    comp_ss = client.open_by_key(COMP_SS_ID)
    ws_trends = comp_ss.worksheet("Trends")
    sid = ws_trends._properties["sheetId"]

    # Insert 4 rows at index 5 (after header rows + column header)
    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=COMP_SS_ID,
        body={"requests": [{"insertDimension": {
            "range": {"sheetId": sid, "dimension": "ROWS", "startIndex": 5, "endIndex": 9},
            "inheritFromBefore": False
        }}]}
    ).execute()
    time.sleep(0.5)

    # Write the 4 new rows starting at row 6 (A6)
    ws_trends.update(values=new_rows, range_name="A6", value_input_option="USER_ENTERED")
    time.sleep(1)

    # --- Format new rows: highlight OP rows, currency, text style ---
    def highlight_op(row_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
            "cell": {"userEnteredFormat": {
                "backgroundColor": {"red": 0.81, "green": 0.89, "blue": 0.95},
                "textFormat": {"bold": True}
            }},
            "fields": "userEnteredFormat(backgroundColor,textFormat)"
        }}

    def currency_row(row_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1,
                      "startColumnIndex": 4, "endColumnIndex": 12},
            "cell": {"userEnteredFormat": {"numberFormat": {"type": "CURRENCY", "pattern": "$#,##0"}}},
            "fields": "userEnteredFormat.numberFormat"
        }}

    fmt_requests = []
    for i, year in enumerate([2022, 2023, 2024, 2025]):
        row_idx = 5 + i  # 0-indexed
        fmt_requests.append(highlight_op(row_idx))
        fmt_requests.append(currency_row(row_idx))

    # Re-apply currency to existing 2026 rows (now shifted down by 4)
    for row_idx in range(9, 20):
        fmt_requests.append(currency_row(row_idx))

    # Add a year-separator blank style between 2025 and 2026 (row index 9 is now 2026 OP)
    fmt_requests.append({"autoResizeDimensions": {
        "dimensions": {"sheetId": sid, "dimension": "COLUMNS", "startIndex": 0, "endIndex": 12}
    }})

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=COMP_SS_ID, body={"requests": fmt_requests}
    ).execute()

    print("\nDone!")
    print(f"https://docs.google.com/spreadsheets/d/{COMP_SS_ID}/edit")


if __name__ == "__main__":
    main()
