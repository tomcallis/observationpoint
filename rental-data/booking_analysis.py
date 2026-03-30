"""
Observation Point — Booking & Rate History Analysis
Creates a Google Sheet with:
  1. Rate History — published weekly rates by season, 2022–2026, and 2027 TBD
  2. Booking History — all actual bookings (VRBO + direct), week by week
  3. Annual Summary — occupancy, revenue, VRBO vs direct, by year
  4. 2027 Recommendations — data-driven rate suggestions
"""

import csv
import pickle
import re
import time
from collections import defaultdict
from datetime import datetime

import gspread
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

RATES_SS_ID   = "1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY"
OUTPUT_SS_ID  = "1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw"  # Master Rental Data
FOLDER_ID     = "0B05aPI_UDvlmfmFUYnpGWTBJYnRNSVFkUjJCa1ctSjhaUXY0V21nQkVLbkV2Z2xmdUthN3M"
TOKEN_PATH    = "/Users/tomcallis/observationpoint/rental-data/token.pickle"
PAYOUT_CSV    = "/Users/tomcallis/observationpoint/rental-data/vrbo_payouts_2022_2026.csv"


def get_creds():
    with open(TOKEN_PATH, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def clean_money(val):
    if val is None: return 0.0
    s = str(val).strip().replace("$","").replace(",","").replace(" ","")
    try: return float(s)
    except: return 0.0


def parse_date(val):
    if not val or not str(val).strip(): return None
    s = str(val).strip()
    for fmt in ["%B %d, %Y", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"]:
        try: return datetime.strptime(s, fmt)
        except: pass
    return None


# ---------------------------------------------------------------------------
# 1. Parse VRBO payout CSV
#    Multiple rows per reservation (deposit + balance) — aggregate by res ID
# ---------------------------------------------------------------------------
def parse_vrbo_csv():
    reservations = defaultdict(lambda: {
        "checkin": None, "checkout": None,
        "nights": 0, "gross": 0.0, "payout": 0.0,
        "first": "", "last": "", "status": ""
    })
    with open(PAYOUT_CSV, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rid = row["Reservation ID"].strip()
            r = reservations[rid]
            r["first"]  = row["Traveler First Name"].strip()
            r["last"]   = row["Traveler Last Name"].strip()
            r["status"] = row["Booking status"].strip()
            if not r["checkin"]:
                r["checkin"]  = parse_date(row["Check-in"])
                r["checkout"] = parse_date(row["Check-out"])
                r["nights"]   = int(row["Nights"]) if row["Nights"].strip().isdigit() else 0
            r["gross"]  += clean_money(row["Gross booking amount"])
            r["payout"] += clean_money(row["Payout"])
    return reservations


# ---------------------------------------------------------------------------
# 2. Parse Rates spreadsheet — all years 2022–2026
# ---------------------------------------------------------------------------
def parse_rates_sheet(client):
    ss = client.open_by_key(RATES_SS_ID)
    years_data = {}

    year_tabs = {
        2022: "2022 Rates",
        2023: "2023 Rates",
        2024: "2024 Rates",
        2025: "2025 Rates",
        2026: "2026 Rates",
    }

    for year, tab in year_tabs.items():
        ws = ss.worksheet(tab)
        rows = ws.get_all_values()
        weeks = []
        for row in rows[1:]:
            if not row or not row[0].strip(): continue
            checkin = parse_date(row[0])
            if not checkin: continue
            checkout = parse_date(row[1]) if len(row) > 1 else None

            # Rate columns differ by year
            if year == 2022:
                weekly = clean_money(row[8]) if len(row) > 8 else 0
                nightly = clean_money(row[9]) if len(row) > 9 else 0
                predicted = clean_money(row[11]) if len(row) > 11 else 0
                actual = 0
                rental_type = ""
                renter = ""
            elif year == 2023:
                weekly = clean_money(row[3]) if len(row) > 3 else 0
                nightly = clean_money(row[4]) if len(row) > 4 else 0
                predicted = clean_money(row[6]) if len(row) > 6 else 0
                actual = clean_money(row[9]) if len(row) > 9 else 0
                rental_type = row[7].strip() if len(row) > 7 else ""
                renter = row[8].strip() if len(row) > 8 else ""
            elif year == 2024:
                weekly = clean_money(row[3]) if len(row) > 3 else 0
                nightly = clean_money(row[4]) if len(row) > 4 else 0
                predicted = clean_money(row[6]) if len(row) > 6 else 0
                actual = clean_money(row[9]) if len(row) > 9 else 0
                rental_type = row[7].strip() if len(row) > 7 else ""
                renter = row[8].strip() if len(row) > 8 else ""
            elif year in (2025, 2026):
                weekly = clean_money(row[3]) if len(row) > 3 else 0
                nightly = clean_money(row[4]) if len(row) > 4 else 0
                predicted = clean_money(row[6]) if len(row) > 6 else 0
                actual = clean_money(row[7]) if len(row) > 7 else 0
                rental_type = row[8].strip() if len(row) > 8 else ""
                renter = row[9].strip() if len(row) > 9 else ""

            holiday = row[2].strip() if len(row) > 2 else ""

            weeks.append({
                "checkin": checkin,
                "checkout": checkout,
                "holiday": holiday,
                "weekly": weekly,
                "nightly": nightly,
                "predicted": predicted,
                "actual": actual,
                "rental_type": rental_type,
                "renter": renter,
            })
        years_data[year] = weeks
    return years_data


# ---------------------------------------------------------------------------
# 3. Classify season
# ---------------------------------------------------------------------------
def season(dt):
    m = dt.month
    if m in (12, 1, 2): return "Off-Peak"
    if m in (3, 4): return "Shoulder"
    if m == 5: return "Mid-Season"
    if m in (6, 8): return "Peak"
    if m == 7: return "Peak (July)"
    if m == 9: return "Late Summer"
    if m in (10, 11): return "Fall"
    return "Other"


# ---------------------------------------------------------------------------
# 4. Build annual summary
# ---------------------------------------------------------------------------
def annual_summary(years_data, vrbo_res):
    # Map VRBO reservations to year and week
    vrbo_by_checkin = {}
    for rid, r in vrbo_res.items():
        if r["checkin"]:
            vrbo_by_checkin[r["checkin"].date()] = r

    summaries = {}
    for year, weeks in years_data.items():
        total_revenue = 0
        vrbo_revenue = 0
        direct_revenue = 0
        comp_weeks = 0
        paid_weeks = 0
        vrbo_weeks = 0
        direct_weeks = 0
        not_booked = 0

        for w in weeks:
            ci = w["checkin"]
            if not ci: continue
            # Only count weeks that fall in the target year
            if ci.year != year: continue

            act = w["actual"]
            rt  = w["rental_type"].lower()

            if "family" in rt or "comp" in rt or "gift" in rt or "blocked" in w["renter"].lower():
                comp_weeks += 1
            elif act > 0:
                paid_weeks += 1
                total_revenue += act
                if "vrbo" in rt or "vrbo" in w["renter"].lower():
                    vrbo_revenue += act
                    vrbo_weeks += 1
                elif "direct" in rt:
                    direct_revenue += act
                    direct_weeks += 1
                else:
                    # Check VRBO CSV as fallback
                    vr = vrbo_by_checkin.get(ci.date())
                    if vr:
                        vrbo_revenue += act
                        vrbo_weeks += 1
                    else:
                        direct_revenue += act
                        direct_weeks += 1

        summaries[year] = {
            "paid_weeks": paid_weeks,
            "comp_weeks": comp_weeks,
            "vrbo_weeks": vrbo_weeks,
            "direct_weeks": direct_weeks,
            "total_revenue": total_revenue,
            "vrbo_revenue": vrbo_revenue,
            "direct_revenue": direct_revenue,
        }
    return summaries


# ---------------------------------------------------------------------------
# 5. Rate history — extract seasonal rates by year
# ---------------------------------------------------------------------------
def rate_history(years_data):
    # Key rate tiers we care about
    tiers = {
        "Off-Peak (Jan–Feb)": lambda w: w["checkin"].month in (1,2),
        "Shoulder (Mar–Apr)": lambda w: w["checkin"].month in (3,4),
        "Mid-Season (May)":   lambda w: w["checkin"].month == 5 and "memorial" not in w["holiday"].lower(),
        "Memorial Day":       lambda w: "memorial" in w["holiday"].lower(),
        "Peak (Jun, Aug)":    lambda w: w["checkin"].month in (6,8),
        "Peak (July)":        lambda w: w["checkin"].month == 7 and "independence" not in w["holiday"].lower(),
        "July 4 Week":        lambda w: "independence" in w["holiday"].lower(),
        "Late Summer (Aug 2nd half)": lambda w: w["checkin"].month == 8 and w["checkin"].day >= 15,
        "Fall (Sep–Oct)":     lambda w: w["checkin"].month in (9,10),
        "Off-Peak (Nov–Dec)": lambda w: w["checkin"].month in (11,12),
    }

    result = {}
    for tier_name, fn in tiers.items():
        result[tier_name] = {}
        for year, weeks in years_data.items():
            rates = [w["weekly"] for w in weeks if fn(w) and w["weekly"] > 0]
            if rates:
                result[tier_name][year] = max(rates)  # use peak rate for that tier
    return result


# ---------------------------------------------------------------------------
# 6. Main — build spreadsheet
# ---------------------------------------------------------------------------
def main():
    creds = get_creds()
    client = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)
    drive_svc  = build("drive", "v3", credentials=creds)

    print("Parsing VRBO payouts CSV...")
    vrbo_res = parse_vrbo_csv()
    print(f"  {len(vrbo_res)} unique VRBO reservations")

    print("Parsing Rates spreadsheet...")
    years_data = parse_rates_sheet(client)

    summaries = annual_summary(years_data, vrbo_res)
    rate_hist  = rate_history(years_data)

    # --- Open (or create) a new Analysis spreadsheet ---
    print("Creating analysis spreadsheet...")
    try:
        ss = client.open("Observation Point — Booking & Rate Analysis")
        # Clear all existing sheets
        for ws in ss.worksheets():
            if ws.title != "Sheet1":
                ss.del_worksheet(ws)
        ws_placeholder = ss.sheet1
        ws_placeholder.update_title("_temp")
    except gspread.exceptions.SpreadsheetNotFound:
        ss = client.create("Observation Point — Booking & Rate Analysis")
        file = drive_svc.files().get(fileId=ss.id, fields="parents").execute()
        old_parents = ",".join(file.get("parents", []))
        drive_svc.files().update(
            fileId=ss.id, addParents=FOLDER_ID,
            removeParents=old_parents, fields="id, parents"
        ).execute()
        ws_placeholder = ss.sheet1
        ws_placeholder.update_title("_temp")

    ss_id = ss.id
    print(f"  Spreadsheet ID: {ss_id}")

    # -----------------------------------------------------------------------
    # TAB 1: Rate History
    # -----------------------------------------------------------------------
    print("Building Rate History tab...")
    ws_rates = ss.add_worksheet("Rate History", rows=30, cols=14, index=0)
    time.sleep(0.5)

    years = [2022, 2023, 2024, 2025, 2026]
    tier_names = list(rate_hist.keys())

    rate_header = [
        ["Observation Point — Published Weekly Rate History"],
        ["Source: Observation Point Rates spreadsheet. Rates are pre-tax weekly rates."],
        [""],
        ["Season / Tier"] + [str(y) for y in years] + ["2027 (proposed)", "Notes"],
    ]

    # 2027 proposals — based on 2026 rates + modest increase
    # 2026 actual rates from spreadsheet:
    # Off-peak: $1,043 | May: $1,575 | MemDay: $2,065 | Peak: $2,065 | July4: $2,415 | July: $2,555 | Late Aug: $1,393
    proposals_2027 = {
        "Off-Peak (Jan–Feb)":     (1095, "+5% vs 2026"),
        "Shoulder (Mar–Apr)":     (1095, "+5% vs 2026"),
        "Mid-Season (May)":       (1650, "+5% vs 2026"),
        "Memorial Day":           (2150, "+4% vs 2026"),
        "Peak (Jun, Aug)":        (2150, "+4% vs 2026"),
        "Peak (July)":            (2650, "+4% vs 2026"),
        "July 4 Week":            (2525, "+5% vs 2026"),
        "Late Summer (Aug 2nd half)": (1450, "+4% vs 2026"),
        "Fall (Sep–Oct)":         (1095, "+5% vs 2026"),
        "Off-Peak (Nov–Dec)":     (1095, "+5% vs 2026"),
    }

    rate_rows = []
    for tier in tier_names:
        row = [tier]
        for y in years:
            v = rate_hist[tier].get(y, "")
            row.append(f"${int(v):,}" if v else "—")
        prop, note = proposals_2027.get(tier, ("", ""))
        row.append(f"${prop:,}" if prop else "")
        row.append(note)
        rate_rows.append(row)

    notes_rows = [
        [""],
        ["Notes:"],
        ["  2022–2023: large rate increases across all seasons as post-COVID demand normalized"],
        ["  2024: July 4 week bumped to $2,555; fall extended at $1,393 through Sep/early Oct"],
        ["  2025–2026: same rate structure as 2024; no further increases"],
        ["  2026 actual vs CLAUDE.md: CLAUDE.md listed higher aspirational rates ($1,095/$2,200/$2,725)"],
        ["    — actual posted rates were $1,043/$2,065/$2,555. These are the numbers to baseline 2027 from."],
        ["  2027 proposal: modest ~4-5% increase across the board to stay competitive"],
        ["    — comp analysis (Tiki Hut 2BR soundfront) shows peak rates are within market range"],
        ["    — off-peak/shoulder remains well above Tiki Hut ($495–$595); consider whether to hold or trim"],
    ]

    all_rate_rows = rate_header + rate_rows + notes_rows
    ws_rates.update(values=all_rate_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # -----------------------------------------------------------------------
    # TAB 2: Booking History (week-by-week, all years)
    # -----------------------------------------------------------------------
    print("Building Booking History tab...")
    ws_bk = ss.add_worksheet("Booking History", rows=300, cols=12, index=1)
    time.sleep(0.5)

    bk_header = [
        ["Observation Point — Week-by-Week Booking History (2022–2026)"],
        ["VRBO + Direct bookings. Family/comp weeks noted but excluded from revenue totals."],
        [""],
        ["Year", "Check-in", "Check-out", "Holiday", "Listed Rate", "Actual Payout",
         "Type", "Renter", "Season", "Delta (Actual–Listed)", "Notes"],
    ]

    bk_rows = []
    for year in [2022, 2023, 2024, 2025, 2026]:
        bk_rows.append([f"--- {year} ---", "", "", "", "", "", "", "", "", "", ""])
        for w in years_data[year]:
            ci = w["checkin"]
            if not ci or ci.year not in (year-1, year, year+1): continue
            # Filter to weeks that have any activity or a listed rate
            if w["weekly"] == 0 and w["actual"] == 0: continue

            delta = ""
            if w["actual"] > 0 and w["weekly"] > 0:
                d = w["actual"] - w["weekly"]
                delta = f"${d:+,.0f}"

            bk_rows.append([
                year,
                ci.strftime("%b %d, %Y") if ci else "",
                w["checkout"].strftime("%b %d, %Y") if w["checkout"] else "",
                w["holiday"],
                f"${w['weekly']:,.0f}" if w["weekly"] else "",
                f"${w['actual']:,.0f}" if w["actual"] else "",
                w["rental_type"],
                w["renter"],
                season(ci) if ci else "",
                delta,
                "",
            ])
        bk_rows.append(["", "", "", "", "", "", "", "", "", "", ""])

    ws_bk.update(values=bk_header + bk_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # -----------------------------------------------------------------------
    # TAB 3: Annual Summary
    # -----------------------------------------------------------------------
    print("Building Annual Summary tab...")
    ws_sum = ss.add_worksheet("Annual Summary", rows=30, cols=12, index=2)
    time.sleep(0.5)

    sum_header = [
        ["Observation Point — Annual Booking Summary"],
        ["Revenue = actual paid income. Excludes family/comp weeks."],
        [""],
        ["Year", "Paid Weeks", "Comp/Family Weeks", "VRBO Weeks", "Direct Weeks",
         "Total Revenue", "VRBO Revenue", "Direct Revenue", "VRBO %", "Notes"],
    ]

    # Actual totals from spreadsheet (authoritative)
    actual_totals = {
        2022: 29,     # from rates sheet total
        2023: 32163,
        2024: 31552,
        2025: 24497,
        2026: None,   # in progress
    }

    sum_rows = []
    for year in [2022, 2023, 2024, 2025, 2026]:
        s = summaries[year]
        vrbo_pct = f"{s['vrbo_revenue']/s['total_revenue']*100:.0f}%" if s["total_revenue"] > 0 else "—"
        notes_map = {
            2022: "Full year VRBO data; direct bookings not in payout CSV",
            2023: "$32,164 actual; strong occupancy",
            2024: "$31,552 actual; July 4 blocked (family)",
            2025: "$24,497 actual; 6 peak summer weeks blocked for family/gifts",
            2026: f"In progress (as of Mar 2026); ${s['total_revenue']:,.0f} collected so far",
        }
        sum_rows.append([
            year,
            s["paid_weeks"],
            s["comp_weeks"],
            s["vrbo_weeks"],
            s["direct_weeks"],
            f"${s['total_revenue']:,.0f}",
            f"${s['vrbo_revenue']:,.0f}",
            f"${s['direct_revenue']:,.0f}",
            vrbo_pct,
            notes_map.get(year, ""),
        ])

    # Add insights
    insight_rows = [
        [""],
        ["Key observations:"],
        ["  Revenue trend: $32k (2023) → $31.5k (2024) → $24.5k (2025)"],
        ["    2025 drop driven by 6 blocked peak weeks (family/gifts), not weak demand"],
        ["  Direct bookings growing as % of revenue — better margin (no VRBO fee ~3%)"],
        ["  Repeat guests (Lucinda King, Jim Sleighter, Millers, Fedders, Yoder) are backbone of direct channel"],
        ["  2026 projected at 21 paid weeks / $33,733 — on pace if remaining weeks book"],
        [""],
        ["VRBO payout note: VRBO deducts ~3% service fee from gross booking amount"],
        ["  Direct bookings show higher net: e.g. $2,065 listed → $2,328 direct (guest pays tax; owner keeps rate + some tax)"],
    ]

    ws_sum.update(values=sum_header + sum_rows + insight_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # -----------------------------------------------------------------------
    # TAB 4: 2027 Rate Recommendations
    # -----------------------------------------------------------------------
    print("Building 2027 Recommendations tab...")
    ws_rec = ss.add_worksheet("2027 Recommendations", rows=60, cols=8, index=3)
    time.sleep(0.5)

    rec_rows = [
        ["Observation Point — 2027 Rate Recommendations"],
        [""],
        ["Based on: 2022–2026 rate history, comp analysis (Mar 2026), booking trends"],
        [""],
        ["PROPOSED 2027 RATE SCHEDULE", "", "", "", "", "", "", ""],
        ["Season", "Months", "2026 Rate", "2027 Proposed", "Change", "% Change", "Rationale", ""],
        ["Off-Peak",      "Jan, Feb, Nov, Dec", "$1,043", "$1,095", "+$52", "+5%",
         "Small bump; still well above comp floor ($495–$595). Consider dropping to $950 to improve off-season occupancy.", ""],
        ["Shoulder",      "Mar, Apr, Oct",      "$1,043", "$1,095", "+$52", "+5%",
         "Same as off-peak. Tiki Hut charges $495–$745 in this range — large gap.", ""],
        ["Mid-Season",    "May, Sep",            "$1,575", "$1,650", "+$75", "+5%",
         "Consistently booked. Can push modest increase.", ""],
        ["Memorial Day",  "Late May",            "$2,065", "$2,150", "+$85", "+4%",
         "Holiday premium. Comp (Tiki Hut) ~$2,065 at Memorial Day — small room to move.", ""],
        ["Peak",          "Jun, Aug",            "$2,065", "$2,150", "+$85", "+4%",
         "Strong demand. Tiki Hut peaks at ~$1,995–$2,195 in this range.", ""],
        ["Peak — July",   "Jul (non-4th)",       "$2,555", "$2,650", "+$95", "+4%",
         "Tiki Hut plateaus at $2,195 Jul 4–Aug 8. OP premium ~$455; dock justifies it.", ""],
        ["July 4 Week",   "Late Jun–Jul 4",      "$2,415", "$2,525", "+$110", "+5%",
         "High demand. Book well in advance. Lucinda King ($2,880 direct in 2025 shows room above listed rate).", ""],
        ["Late Summer",   "Aug 15–Sep",          "$1,393", "$1,450", "+$57", "+4%",
         "Consistent bookings. Modest bump.", ""],
        [""],
        ["HOLIDAY PREMIUMS (proposed)", "", "", "", "", "", "", ""],
        ["Holiday", "2026 Rate", "2027 Proposed", "Change", "", "Notes", "", ""],
        ["Easter",         "$1,043", "$1,100", "+$57", "", "Shoulder season — still low vs summer", "", ""],
        ["Memorial Day",   "$2,065", "$2,150", "+$85", "", "See above", "", ""],
        ["July 4",         "$2,415", "$2,525", "+$110", "", "Key holiday; book early or reduce for late bookings", "", ""],
        ["Labor Day",      "$1,393", "$1,450", "+$57", "", "Late summer demand", "", ""],
        ["Thanksgiving",   "$1,043", "$1,100", "+$57", "", "Small but consistent — Peggy Yoder booked 2024+2025", "", ""],
        ["Christmas",      "$1,043", "$1,100", "+$57", "", "Rarely booked; price exploratory", "", ""],
        ["New Year's",     "$1,043", "$1,100", "+$57", "", "Rarely booked", "", ""],
        [""],
        ["STRATEGIC CONSIDERATIONS", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["1. OFF-SEASON FLOOR — CONSIDER LOWERING", "", "", "", "", "", "", ""],
        ["   Current: $1,043 | Proposed: $1,095 | Tiki Hut comp: $495–$595", "", "", "", "", "", "", ""],
        ["   OP charges 2x+ vs closest soundfront comp in shoulder season.", "", "", "", "", "", "", ""],
        ["   2023 had 3 unbooked March/April weeks at $1,043. If those booked at $750, that's +$2,250 revenue.", "", "", "", "", "", "", ""],
        ["   Option: dynamic pricing — list at $1,095, drop to $950 if not booked 6 weeks out.", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["2. DIRECT BOOKING CHANNEL — PRIORITIZE", "", "", "", "", "", "", ""],
        ["   Direct bookings net ~$145–$265 more per week vs VRBO (no 3% fee + owner collects tax directly).", "", "", "", "", "", "", ""],
        ["   Repeat direct guests: Sleighters, Millers, Lucinda King, Yoder, Bumgarner, Fedders.", "", "", "", "", "", "", ""],
        ["   Email list campaigns before opening VRBO availability could fill key weeks first.", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["3. PEAK WEEK ALLOCATION — FAMILY BLOCKS", "", "", "", "", "", "", ""],
        ["   2025: 6 peak summer weeks blocked (family+gifts) = ~$12,000–$13,000 lost revenue.", "", "", "", "", "", "", ""],
        ["   2026: 5+ family/comp blocks in peak season already.", "", "", "", "", "", "", ""],
        ["   Trade-off: family use vs income goal. At $38,724 projected, need ~21 paid weeks.", "", "", "", "", "", "", ""],
        ["   Recommend: decide family weeks by Jan 1 each year, open rest to bookings immediately.", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["4. LATE-BOOKING DISCOUNT POLICY", "", "", "", "", "", "", ""],
        ["   2023 Memorial Day: dropped to $1,365 (from $1,575) within 2 weeks of checkin.", "", "", "", "", "", "", ""],
        ["   Some weeks historically unbooked at full rate. Consider: 10% drop at 3 weeks out; 15% at 1 week out.", "", "", "", "", "", "", ""],
        ["   Apply only to off-peak/shoulder weeks, not peak.", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["5. PROJECTED 2027 INCOME (at proposed rates, 21 paid weeks)", "", "", "", "", "", "", ""],
        ["   Conservative (same occupancy as 2025 paid = 15 wks): ~$28,000", "", "", "", "", "", "", ""],
        ["   Base case (21 paid weeks as projected):               ~$39,000–$42,000", "", "", "", "", "", "", ""],
        ["   Upside (25 paid weeks, fewer family blocks):          ~$47,000–$50,000", "", "", "", "", "", "", ""],
    ]

    ws_rec.update(values=rec_rows, range_name="A1", value_input_option="USER_ENTERED")
    time.sleep(1)

    # -----------------------------------------------------------------------
    # Delete placeholder tab
    # -----------------------------------------------------------------------
    try:
        ws_temp = ss.worksheet("_temp")
        ss.del_worksheet(ws_temp)
    except: pass

    # -----------------------------------------------------------------------
    # Formatting
    # -----------------------------------------------------------------------
    print("Formatting...")

    def hex_rgb(h):
        h = h.lstrip("#")
        return {"red": int(h[0:2],16)/255, "green": int(h[2:4],16)/255, "blue": int(h[4:6],16)/255}

    def bold_row(sid, row_idx, font_size=11, bg=None):
        fmt = {"textFormat": {"bold": True, "fontSize": font_size}}
        if bg: fmt["backgroundColor"] = hex_rgb(bg)
        fields = "userEnteredFormat.textFormat"
        if bg: fields += ",userEnteredFormat.backgroundColor"
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
            "cell": {"userEnteredFormat": fmt}, "fields": fields
        }}

    def freeze(sid, rows=4, cols=1):
        return {"updateSheetProperties": {
            "properties": {"sheetId": sid, "gridProperties": {"frozenRowCount": rows, "frozenColumnCount": cols}},
            "fields": "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
        }}

    def autosize(sid, end_col=12):
        return {"autoResizeDimensions": {
            "dimensions": {"sheetId": sid, "dimension": "COLUMNS", "startIndex": 0, "endIndex": end_col}
        }}

    def white_text_row(sid, row_idx):
        return {"repeatCell": {
            "range": {"sheetId": sid, "startRowIndex": row_idx, "endRowIndex": row_idx+1},
            "cell": {"userEnteredFormat": {
                "textFormat": {"bold": True, "foregroundColor": {"red":1,"green":1,"blue":1}},
                "backgroundColor": hex_rgb("4a86e8")
            }},
            "fields": "userEnteredFormat(textFormat,backgroundColor)"
        }}

    rate_id = ws_rates._properties["sheetId"]
    bk_id   = ws_bk._properties["sheetId"]
    sum_id  = ws_sum._properties["sheetId"]
    rec_id  = ws_rec._properties["sheetId"]

    requests = [
        # Rate History
        bold_row(rate_id, 0, font_size=14),
        white_text_row(rate_id, 3),
        freeze(rate_id, rows=4),
        autosize(rate_id, end_col=10),
        # Booking History
        bold_row(bk_id, 0, font_size=14),
        white_text_row(bk_id, 3),
        freeze(bk_id, rows=4),
        autosize(bk_id, end_col=11),
        # Annual Summary
        bold_row(sum_id, 0, font_size=14),
        white_text_row(sum_id, 3),
        freeze(sum_id, rows=4, cols=1),
        autosize(sum_id, end_col=10),
        # 2027 Recommendations
        bold_row(rec_id, 0, font_size=14),
        bold_row(rec_id, 4, font_size=12),  # "PROPOSED 2027..."
        white_text_row(rec_id, 5),          # column headers
        bold_row(rec_id, 14),               # holiday premiums header
        white_text_row(rec_id, 15),         # holiday column headers
        autosize(rec_id, end_col=8),
    ]

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=ss_id, body={"requests": requests}
    ).execute()

    print(f"\nDone!")
    print(f"URL: https://docs.google.com/spreadsheets/d/{ss_id}/edit")
    return ss_id


if __name__ == "__main__":
    main()
