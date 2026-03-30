import pickle
import os
import time
import gspread
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dateutil import parser as dateparser
from datetime import datetime, timedelta


def get_creds():
    token_path = "/Users/tomcallis/sheets-project/token.pickle"
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


def parse_currency(val):
    if val is None or str(val).strip() == '':
        return 0.0
    s = str(val).strip().replace('$', '').replace(',', '').replace(' ', '')
    try:
        return float(s)
    except:
        return 0.0


def parse_date(val):
    if val is None or str(val).strip() == '':
        return None
    s = str(val).strip()
    for fmt in ['%m/%d/%Y', '%m/%d/%y', '%Y-%m-%d']:
        try:
            return datetime.strptime(s, fmt)
        except:
            pass
    try:
        return dateparser.parse(s)
    except:
        return None


def get_season(month):
    if month in [1, 2, 11, 12]:
        return 'Off-Peak'
    elif month in [3, 4, 10]:
        return 'Shoulder'
    elif month in [5, 9]:
        return 'Mid-Season'
    elif month in [6, 7, 8]:
        return 'Peak'
    return 'Unknown'


def determine_booking_status(actual_income, pred_weeks, rental_type, renter_name):
    rt = str(rental_type).strip() if rental_type else ''
    rn = str(renter_name).strip() if renter_name else ''

    family_comp = (
        rt == 'Family or Comp'
        or 'BLOCKED for Callis' in rn
        or 'HOLD FOR CALLIS' in rn
        or 'Callis family' in rn
    )

    booked = (
        actual_income > 0
        or (
            str(pred_weeks).strip() == '1'
            and rt not in ['Family or Comp', '']
            and 'BLOCKED' not in rn.upper()
            and 'HOLD' not in rn.upper()
            and 'not booked' not in rn.lower()
        )
    )

    if rt and 'VRBO' in rt.upper():
        channel = 'VRBO'
    elif rt and 'DIRECT' in rt.upper():
        channel = 'Direct'
    elif family_comp:
        channel = 'Family/Comp'
    else:
        channel = 'Unknown'

    return booked, family_comp, channel


def parse_2026(ws_data):
    rows = []
    for row in ws_data:
        if len(row) < 6:
            continue
        sat_val = row[0] if len(row) > 0 else ''
        if str(sat_val).strip() == '':
            continue
        # Skip totals row: col 5 == '21'
        pred_weeks_val = row[5] if len(row) > 5 else ''
        if str(pred_weeks_val).strip() == '21' and str(sat_val).strip() == '':
            continue
        sat_date = parse_date(sat_val)
        if sat_date is None:
            continue
        fri_val = row[1] if len(row) > 1 else ''
        holiday = row[2] if len(row) > 2 else ''
        weekly_rate = parse_currency(row[3] if len(row) > 3 else 0)
        nightly_rate = parse_currency(row[4] if len(row) > 4 else 0)
        pred_weeks = str(pred_weeks_val).strip()
        pred_income = parse_currency(row[6] if len(row) > 6 else 0)
        actual_income = parse_currency(row[7] if len(row) > 7 else 0)
        rental_type = row[8] if len(row) > 8 else ''
        renter_name = row[9] if len(row) > 9 else ''
        fri_date = parse_date(fri_val)
        season = get_season(sat_date.month)
        booked, family_comp, channel = determine_booking_status(actual_income, pred_weeks, rental_type, renter_name)
        rows.append({
            'year': 2026, 'sat': sat_date, 'fri': fri_date,
            'holiday': holiday, 'season': season,
            'weekly_rate': weekly_rate, 'nightly_rate': nightly_rate,
            'pred_weeks': pred_weeks, 'pred_income': pred_income,
            'actual_income': actual_income, 'rental_type': rental_type,
            'renter_name': renter_name, 'booked': booked,
            'family_comp': family_comp, 'channel': channel
        })
    return rows


def parse_2025(ws_data):
    rows = []
    for row in ws_data:
        if len(row) < 6:
            continue
        sat_val = row[0] if len(row) > 0 else ''
        if str(sat_val).strip() == '':
            continue
        pred_weeks_val = row[5] if len(row) > 5 else ''
        if str(pred_weeks_val).strip() == '24':
            continue
        sat_date = parse_date(sat_val)
        if sat_date is None:
            continue
        fri_val = row[1] if len(row) > 1 else ''
        holiday = row[2] if len(row) > 2 else ''
        weekly_rate = parse_currency(row[3] if len(row) > 3 else 0)
        nightly_rate = parse_currency(row[4] if len(row) > 4 else 0)
        pred_weeks = str(pred_weeks_val).strip()
        pred_income = parse_currency(row[6] if len(row) > 6 else 0)
        actual_income = parse_currency(row[7] if len(row) > 7 else 0)
        rental_type = row[8] if len(row) > 8 else ''
        renter_name = row[10] if len(row) > 10 else ''
        fri_date = parse_date(fri_val)
        season = get_season(sat_date.month)
        booked, family_comp, channel = determine_booking_status(actual_income, pred_weeks, rental_type, renter_name)
        rows.append({
            'year': 2025, 'sat': sat_date, 'fri': fri_date,
            'holiday': holiday, 'season': season,
            'weekly_rate': weekly_rate, 'nightly_rate': nightly_rate,
            'pred_weeks': pred_weeks, 'pred_income': pred_income,
            'actual_income': actual_income, 'rental_type': rental_type,
            'renter_name': renter_name, 'booked': booked,
            'family_comp': family_comp, 'channel': channel
        })
    return rows


def parse_2024(ws_data):
    rows = []
    for row in ws_data:
        if len(row) < 6:
            continue
        sat_val = row[0] if len(row) > 0 else ''
        if str(sat_val).strip() == '':
            continue
        pred_weeks_val = row[5] if len(row) > 5 else ''
        if str(pred_weeks_val).strip() == '23':
            continue
        sat_date = parse_date(sat_val)
        if sat_date is None:
            continue
        fri_val = row[1] if len(row) > 1 else ''
        holiday = row[2] if len(row) > 2 else ''
        weekly_rate = parse_currency(row[3] if len(row) > 3 else 0)
        nightly_rate = parse_currency(row[4] if len(row) > 4 else 0)
        pred_weeks = str(pred_weeks_val).strip()
        pred_income = parse_currency(row[6] if len(row) > 6 else 0)
        rental_type = row[7] if len(row) > 7 else ''
        renter_name = row[8] if len(row) > 8 else ''
        actual_income = parse_currency(row[9] if len(row) > 9 else 0)
        fri_date = parse_date(fri_val)
        season = get_season(sat_date.month)
        booked, family_comp, channel = determine_booking_status(actual_income, pred_weeks, rental_type, renter_name)
        rows.append({
            'year': 2024, 'sat': sat_date, 'fri': fri_date,
            'holiday': holiday, 'season': season,
            'weekly_rate': weekly_rate, 'nightly_rate': nightly_rate,
            'pred_weeks': pred_weeks, 'pred_income': pred_income,
            'actual_income': actual_income, 'rental_type': rental_type,
            'renter_name': renter_name, 'booked': booked,
            'family_comp': family_comp, 'channel': channel
        })
    return rows


def parse_2023(ws_data):
    rows = []
    skip_col8 = ['Revenue', 'Estimated break-even number', 'Revenue - Break-even']
    for row in ws_data:
        if len(row) < 6:
            continue
        sat_val = row[0] if len(row) > 0 else ''
        if str(sat_val).strip() == '':
            continue
        col8_val = row[8] if len(row) > 8 else ''
        if str(col8_val).strip() in skip_col8:
            continue
        sat_date = parse_date(sat_val)
        if sat_date is None:
            continue
        fri_val = row[1] if len(row) > 1 else ''
        holiday = row[2] if len(row) > 2 else ''
        weekly_rate = parse_currency(row[3] if len(row) > 3 else 0)
        nightly_rate = parse_currency(row[4] if len(row) > 4 else 0)
        pred_weeks = str(row[5] if len(row) > 5 else '').strip()
        pred_income = parse_currency(row[6] if len(row) > 6 else 0)
        rental_type = row[7] if len(row) > 7 else ''
        rent_status = str(col8_val).strip()
        actual_income = parse_currency(row[9] if len(row) > 9 else 0)
        renter_name = rent_status  # 2023 uses col 8 as booking status/name
        fri_date = parse_date(fri_val)
        season = get_season(sat_date.month)
        booked, family_comp, channel = determine_booking_status(actual_income, pred_weeks, rental_type, renter_name)
        rows.append({
            'year': 2023, 'sat': sat_date, 'fri': fri_date,
            'holiday': holiday, 'season': season,
            'weekly_rate': weekly_rate, 'nightly_rate': nightly_rate,
            'pred_weeks': pred_weeks, 'pred_income': pred_income,
            'actual_income': actual_income, 'rental_type': rental_type,
            'renter_name': renter_name, 'booked': booked,
            'family_comp': family_comp, 'channel': channel
        })
    return rows


def compute_annual_stats(rows_for_year):
    total_actual = sum(r['actual_income'] for r in rows_for_year)
    total_pred = sum(r['pred_income'] for r in rows_for_year)
    booked_weeks = sum(1 for r in rows_for_year if r['booked'] and not r['family_comp'])
    family_weeks = sum(1 for r in rows_for_year if r['family_comp'])
    total_weeks = len(rows_for_year)
    # Occupancy % = booked / (total - family)
    available = total_weeks - family_weeks
    occ_pct = (booked_weeks / available * 100) if available > 0 else 0
    # ADR (Average Daily Rate) for booked weeks with income
    booked_with_income = [r for r in rows_for_year if r['actual_income'] > 0]
    if booked_with_income:
        avg_weekly = sum(r['actual_income'] for r in booked_with_income) / len(booked_with_income)
        adr = avg_weekly / 7
    else:
        adr = 0
    vrbo_weeks = sum(1 for r in rows_for_year if r['channel'] == 'VRBO' and r['booked'])
    direct_weeks = sum(1 for r in rows_for_year if r['channel'] == 'Direct' and r['booked'])
    total_booked = booked_weeks
    vrbo_pct = (vrbo_weeks / total_booked * 100) if total_booked > 0 else 0
    direct_pct = (direct_weeks / total_booked * 100) if total_booked > 0 else 0
    return {
        'actual': total_actual,
        'predicted': total_pred,
        'occ_pct': occ_pct,
        'booked_weeks': booked_weeks,
        'family_weeks': family_weeks,
        'adr': adr,
        'vrbo_pct': vrbo_pct,
        'direct_pct': direct_pct,
    }


def build_2027_projection(rows_2026):
    # Rate increases by season
    rate_increases = {
        'Peak': 1.08,
        'Mid-Season': 1.07,
        'Shoulder': 1.05,
        'Off-Peak': 1.05,
    }
    # Occupancy assumptions based on 2025
    occupancy_by_season = {
        'Off-Peak': 0.05,
        'Shoulder': 0.25,
        'Mid-Season': 0.75,
        'Peak': 0.65,
    }
    family_comp_weeks_target = 8

    proj_rows = []
    family_assigned = 0

    for r in rows_2026:
        if r['sat'] is None:
            continue
        # Shift +52 weeks (364 days)
        new_sat = r['sat'] + timedelta(weeks=52)
        new_fri = r['fri'] + timedelta(weeks=52) if r['fri'] else None
        season = r['season']
        multiplier = rate_increases.get(season, 1.05)
        rate_2027 = round(r['weekly_rate'] * multiplier)
        occ = occupancy_by_season.get(season, 0.5)
        # Decide if predicted booked
        import random
        predicted = occ >= 0.5  # deterministic: predict booked if occ >= 50%
        # Actually use threshold-based approach for variety
        # Use a consistent seed approach based on week number
        week_num = new_sat.isocalendar()[1]
        # Deterministic: booked if (week_num % 100) / 100 < occ
        predicted_booked = (week_num % 100) / 100 < occ

        # Family/comp slots
        is_family = False
        if family_assigned < family_comp_weeks_target and season in ['Off-Peak', 'Shoulder']:
            is_family = True
            family_assigned += 1
            predicted_booked = False

        notes = ''
        if is_family:
            notes = 'Family/Comp'

        proj_rows.append({
            'sat': new_sat,
            'fri': new_fri,
            'holiday': r['holiday'],
            'season': season,
            'rate_2026': r['weekly_rate'],
            'rate_2027': rate_2027,
            'predicted_booked': predicted_booked,
            'is_family': is_family,
            'notes': notes,
        })

    # Calculate total projected income
    total_proj = sum(r['rate_2027'] for r in proj_rows if r['predicted_booked'] and not r['is_family'])
    return proj_rows, total_proj


def main():
    print("Authenticating...")
    creds = get_creds()
    gc = gspread.authorize(creds)
    sheets_svc = build("sheets", "v4", credentials=creds)
    drive_svc = build("drive", "v3", credentials=creds)

    # ── Step 1: Read source data ──────────────────────────────────────────────
    SOURCE_ID = "1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY"
    print("Opening source spreadsheet...")
    src = gc.open_by_key(SOURCE_ID)

    print("Reading 2026 Rates...")
    ws_2026 = src.worksheet("2026 Rates")
    data_2026 = ws_2026.get_all_values()
    rows_2026 = parse_2026(data_2026[1:])  # skip header
    print(f"  Parsed {len(rows_2026)} rows from 2026 Rates")

    print("Reading 2025 Rates...")
    ws_2025 = src.worksheet("2025 Rates")
    data_2025 = ws_2025.get_all_values()
    rows_2025 = parse_2025(data_2025[1:])
    print(f"  Parsed {len(rows_2025)} rows from 2025 Rates")

    print("Reading 2024 Rates...")
    ws_2024 = src.worksheet("2024 Rates")
    data_2024 = ws_2024.get_all_values()
    rows_2024 = parse_2024(data_2024[1:])
    print(f"  Parsed {len(rows_2024)} rows from 2024 Rates")

    print("Reading 2023 Rates...")
    ws_2023 = src.worksheet("2023 Rates")
    data_2023 = ws_2023.get_all_values()
    rows_2023 = parse_2023(data_2023[1:])
    print(f"  Parsed {len(rows_2023)} rows from 2023 Rates")

    all_weekly = rows_2023 + rows_2024 + rows_2025 + rows_2026
    all_weekly.sort(key=lambda r: r['sat'])

    # ── Step 2: Hardcoded annual income ───────────────────────────────────────
    annual_income = {
        2015: {"actual": 4873, "predicted": None, "notes": "First partial season (Jul-Dec only)"},
        2016: {"actual": 28661, "predicted": None, "notes": "Net cash flow incl. mortgage principal"},
        2017: {"actual": 24305, "predicted": None, "notes": "Total cash flow in"},
        2018: {"actual": 18583, "predicted": None, "notes": "VRBO taxable income; direct may be higher"},
        2019: {"actual": 15630, "predicted": None, "notes": "VRBO reported; down ~$6k vs 2018"},
        2020: {"actual": 21865, "predicted": None, "notes": "VRBO $16,834 + Direct $5,031"},
        2021: {"actual": 32502, "predicted": None, "notes": "VRBO $25,012 + Direct $7,490"},
        2022: {"actual": None, "predicted": 42609, "notes": "Actual not recorded in spreadsheet"},
        2023: {"actual": 32164, "predicted": 49882, "notes": "From rates sheet revenue total"},
        2024: {"actual": 31552, "predicted": 40110, "notes": "From rates sheet actual payout"},
        2025: {"actual": 24497, "predicted": 38724, "notes": "From rates sheet; includes partial unbooked weeks"},
        2026: {"actual": 11418, "predicted": 33733, "notes": "Partial year as of March 2026"},
    }

    # Compute stats from parsed data
    stats_by_year = {}
    for yr, rows in [(2023, rows_2023), (2024, rows_2024), (2025, rows_2025), (2026, rows_2026)]:
        stats_by_year[yr] = compute_annual_stats(rows)

    # ── Step 3: Build 2027 projections ────────────────────────────────────────
    print("Building 2027 projections...")
    proj_rows, proj_total = build_2027_projection(rows_2026)
    print(f"  2027 projected income: ${proj_total:,.0f}")
    proj_booked = sum(1 for r in proj_rows if r['predicted_booked'] and not r['is_family'])
    proj_family = sum(1 for r in proj_rows if r['is_family'])

    # ── Step 4: Create new Google Sheet ──────────────────────────────────────
    print("Creating new Google Sheet...")
    new_ss = gc.create("Observation Point — Master Rental Data")
    ss_id = new_ss.id
    print(f"  Created spreadsheet: {ss_id}")

    # Add all worksheets first
    ws_annual = new_ss.add_worksheet(title="Annual Summary", rows=50, cols=15)
    ws_weekly = new_ss.add_worksheet(title="Weekly Bookings", rows=300, cols=15)
    ws_rates = new_ss.add_worksheet(title="Rate History", rows=15, cols=15)
    ws_proj = new_ss.add_worksheet(title="2027 Projection", rows=80, cols=10)

    # Delete default Sheet1
    try:
        default_sheet = new_ss.worksheet("Sheet1")
        new_ss.del_worksheet(default_sheet)
    except:
        pass

    time.sleep(1)

    # ── Tab 1: Annual Summary ─────────────────────────────────────────────────
    print("Populating Annual Summary tab...")
    annual_header = [
        "Year", "Actual Income", "Predicted Income", "Occupancy %",
        "Booked Weeks", "Family/Comp Wks", "ADR", "VRBO %", "Direct %", "Notes"
    ]
    annual_data = [annual_header]

    for year in range(2015, 2028):
        if year == 2027:
            # Projection row
            available_weeks = len(proj_rows) - proj_family
            occ_pct = (proj_booked / available_weeks * 100) if available_weeks > 0 else 0
            booked_with_income_proj = [r for r in proj_rows if r['predicted_booked'] and not r['is_family']]
            adr_proj = (proj_total / (len(booked_with_income_proj) * 7)) if booked_with_income_proj else 0
            row = [
                2027,
                '',  # actual (projection, no actual)
                proj_total,
                round(occ_pct, 1),
                proj_booked,
                proj_family,
                round(adr_proj, 0),
                '',  # vrbo pct
                '',  # direct pct
                'Projection based on 2026 rates +5-8%'
            ]
        elif year in stats_by_year:
            s = stats_by_year[year]
            ai = annual_income.get(year, {})
            row = [
                year,
                ai.get('actual', s['actual']) or s['actual'],
                ai.get('predicted', s['predicted']) or s['predicted'],
                round(s['occ_pct'], 1),
                s['booked_weeks'],
                s['family_weeks'],
                round(s['adr'], 0),
                round(s['vrbo_pct'], 1),
                round(s['direct_pct'], 1),
                ai.get('notes', '')
            ]
        else:
            ai = annual_income.get(year, {})
            row = [
                year,
                ai.get('actual', ''),
                ai.get('predicted', ''),
                '',  # occ
                '',  # booked weeks
                '',  # family weeks
                '',  # adr
                '',  # vrbo pct
                '',  # direct pct
                ai.get('notes', '')
            ]
        annual_data.append(row)

    ws_annual.update('A1', annual_data)
    time.sleep(1)

    # ── Tab 2: Weekly Bookings ────────────────────────────────────────────────
    print("Populating Weekly Bookings tab...")
    weekly_header = [
        "Year", "Week Start (Sat)", "Week End (Fri)", "Holiday", "Season",
        "Weekly Rate", "Nightly Rate", "Predicted", "Actual Income",
        "Channel", "Renter Name", "Notes"
    ]
    weekly_data = [weekly_header]
    for r in all_weekly:
        sat_str = r['sat'].strftime('%m/%d/%Y') if r['sat'] else ''
        fri_str = r['fri'].strftime('%m/%d/%Y') if r['fri'] else ''
        predicted_str = 'Yes' if r['booked'] else 'No'
        weekly_data.append([
            r['year'],
            sat_str,
            fri_str,
            str(r['holiday']),
            r['season'],
            r['weekly_rate'],
            r['nightly_rate'],
            predicted_str,
            r['actual_income'],
            r['channel'],
            str(r['renter_name']),
            ''
        ])
    ws_weekly.update('A1', weekly_data)
    time.sleep(1)

    # ── Tab 3: Rate History ───────────────────────────────────────────────────
    print("Populating Rate History tab...")
    rate_header = [
        "Season", "2017", "2018", "2019", "2020", "2021", "2022",
        "2023", "2024", "2025", "2026", "2027 (proj)"
    ]
    # Format: [label, weekly/nightly, values by year]
    rate_history = {
        "Off-Peak": {
            "weekly":  [600, 625, 750, 750, 850, 903, 903, 1043, 1043, 1043, 1095],
            "nightly": [86,  89,  107, 107, 121, 129, 129, 149,  149,  149,  157],
        },
        "Shoulder": {
            "weekly":  [700, 700, 750, 750, 850, 903, 1043, 1043, 1043, 1043, 1095],
            "nightly": [100, 100, 107, 107, 121, 129, 149,  149,  149,  149,  157],
        },
        "Mid-Season": {
            "weekly":  [850, 850, 900, 900, 1043, 1043, 1393, 1575, 1575, 1575, 1685],
            "nightly": [121, 121, 129, 129, 149,  149,  199,  225,  225,  225,  241],
        },
        "Peak": {
            "weekly":  [850, 850, 900, 900, 1043, 1043, 2065, 2555, 2555, 2555, 2759],
            "nightly": [121, 121, 129, 129, 149,  149,  295,  365,  365,  365,  394],
        },
    }
    rate_data = [rate_header]
    for season in ["Off-Peak", "Shoulder", "Mid-Season", "Peak"]:
        w = rate_history[season]["weekly"]
        n = rate_history[season]["nightly"]
        rate_data.append([f"{season} Weekly"] + [f"${v:,}" for v in w])
        rate_data.append([f"{season} Nightly"] + [f"${v:,}" for v in n])

    ws_rates.update('A1', rate_data)
    time.sleep(1)

    # ── Tab 4: 2027 Projection ────────────────────────────────────────────────
    print("Populating 2027 Projection tab...")
    proj_header = [
        "Week Start", "Week End", "Holiday", "Season",
        "2026 Rate", "2027 Rate", "Predicted Booked", "Notes"
    ]
    proj_data = [proj_header]
    for r in proj_rows:
        sat_str = r['sat'].strftime('%m/%d/%Y') if r['sat'] else ''
        fri_str = r['fri'].strftime('%m/%d/%Y') if r['fri'] else ''
        predicted_str = 'Yes' if r['predicted_booked'] else 'No'
        if r['is_family']:
            predicted_str = 'Family/Comp'
        proj_data.append([
            sat_str,
            fri_str,
            str(r['holiday']),
            r['season'],
            r['rate_2026'],
            r['rate_2027'],
            predicted_str,
            r['notes'],
        ])

    # Summary rows
    proj_data.append([''])
    proj_data.append(['SUMMARY', '', '', '', '', '', '', ''])
    proj_data.append(['Total projected booked weeks', proj_booked])
    proj_data.append(['Total family/comp weeks', proj_family])
    proj_data.append(['Total projected income', proj_total])

    # vs comparisons
    pred_2026 = annual_income[2026]['predicted']
    actual_2025 = annual_income[2025]['actual']
    if pred_2026:
        vs_2026 = proj_total - pred_2026
        proj_data.append([f'vs 2026 predicted (${pred_2026:,})', f'${vs_2026:+,.0f}'])
    if actual_2025:
        vs_2025 = proj_total - actual_2025
        proj_data.append([f'vs 2025 actual (${actual_2025:,})', f'${vs_2025:+,.0f}'])

    ws_proj.update('A1', proj_data)
    time.sleep(1)

    # ── Formatting via Sheets API ─────────────────────────────────────────────
    print("Applying formatting...")

    def sheet_id_for(ws):
        return ws._properties['sheetId']

    # Helper: bold + freeze header
    def header_format_request(ws, ncols):
        sid = sheet_id_for(ws)
        return [
            # Bold header row
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sid,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": ncols
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "textFormat": {"bold": True},
                            "backgroundColor": {"red": 0.9, "green": 0.9, "blue": 0.9}
                        }
                    },
                    "fields": "userEnteredFormat(textFormat,backgroundColor)"
                }
            },
            # Freeze row 1
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": sid,
                        "gridProperties": {"frozenRowCount": 1}
                    },
                    "fields": "gridProperties.frozenRowCount"
                }
            }
        ]

    all_requests = []

    # Headers for all tabs
    all_requests += header_format_request(ws_annual, 10)
    all_requests += header_format_request(ws_weekly, 12)
    all_requests += header_format_request(ws_rates, 12)
    all_requests += header_format_request(ws_proj, 8)

    # Highlight 2027 row in Annual Summary (row index 13 = year 2027, 0-indexed row 13)
    # 2015 is row 1 (index 1), so 2027 is row 13 (index 13)
    annual_2027_row_index = 2027 - 2015 + 1  # = 13
    all_requests.append({
        "repeatCell": {
            "range": {
                "sheetId": sheet_id_for(ws_annual),
                "startRowIndex": annual_2027_row_index,
                "endRowIndex": annual_2027_row_index + 1,
                "startColumnIndex": 0,
                "endColumnIndex": 10
            },
            "cell": {
                "userEnteredFormat": {
                    "backgroundColor": {"red": 0.678, "green": 0.847, "blue": 0.902}  # light blue
                }
            },
            "fields": "userEnteredFormat.backgroundColor"
        }
    })

    # Highlight peak and holiday rows in 2027 Projection
    # Peak = light orange; Holiday = light yellow
    for i, r in enumerate(proj_rows):
        row_idx = i + 1  # +1 for header
        if r['holiday'] and str(r['holiday']).strip():
            color = {"red": 1.0, "green": 0.973, "blue": 0.663}  # light yellow
        elif r['season'] == 'Peak':
            color = {"red": 1.0, "green": 0.878, "blue": 0.706}  # light orange
        else:
            continue
        all_requests.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id_for(ws_proj),
                    "startRowIndex": row_idx,
                    "endRowIndex": row_idx + 1,
                    "startColumnIndex": 0,
                    "endColumnIndex": 8
                },
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": color
                    }
                },
                "fields": "userEnteredFormat.backgroundColor"
            }
        })

    # Column widths for Annual Summary
    annual_col_widths = [60, 120, 120, 100, 100, 120, 80, 80, 80, 250]
    for i, w in enumerate(annual_col_widths):
        all_requests.append({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id_for(ws_annual),
                    "dimension": "COLUMNS",
                    "startIndex": i,
                    "endIndex": i + 1
                },
                "properties": {"pixelSize": w},
                "fields": "pixelSize"
            }
        })

    # Column widths for Weekly Bookings
    weekly_col_widths = [50, 110, 110, 120, 100, 100, 100, 80, 110, 100, 180, 120]
    for i, w in enumerate(weekly_col_widths):
        all_requests.append({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id_for(ws_weekly),
                    "dimension": "COLUMNS",
                    "startIndex": i,
                    "endIndex": i + 1
                },
                "properties": {"pixelSize": w},
                "fields": "pixelSize"
            }
        })

    # Apply all formatting in one batch
    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=ss_id,
        body={"requests": all_requests}
    ).execute()
    time.sleep(1)

    # Currency formatting for Annual Summary cols B, C, G (indices 1,2,6)
    currency_requests = []
    currency_format = {
        "numberFormat": {
            "type": "CURRENCY",
            "pattern": "$#,##0"
        }
    }
    for col_idx in [1, 2, 6]:
        currency_requests.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id_for(ws_annual),
                    "startRowIndex": 1,
                    "endRowIndex": 14,
                    "startColumnIndex": col_idx,
                    "endColumnIndex": col_idx + 1
                },
                "cell": {"userEnteredFormat": currency_format},
                "fields": "userEnteredFormat.numberFormat"
            }
        })

    # Currency formatting for Weekly Bookings cols F, G, I (indices 5,6,8)
    for col_idx in [5, 6, 8]:
        currency_requests.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id_for(ws_weekly),
                    "startRowIndex": 1,
                    "endRowIndex": len(weekly_data),
                    "startColumnIndex": col_idx,
                    "endColumnIndex": col_idx + 1
                },
                "cell": {"userEnteredFormat": currency_format},
                "fields": "userEnteredFormat.numberFormat"
            }
        })

    # Currency formatting for 2027 Projection cols E, F (indices 4,5)
    for col_idx in [4, 5]:
        currency_requests.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id_for(ws_proj),
                    "startRowIndex": 1,
                    "endRowIndex": len(proj_rows) + 1,
                    "startColumnIndex": col_idx,
                    "endColumnIndex": col_idx + 1
                },
                "cell": {"userEnteredFormat": currency_format},
                "fields": "userEnteredFormat.numberFormat"
            }
        })

    sheets_svc.spreadsheets().batchUpdate(
        spreadsheetId=ss_id,
        body={"requests": currency_requests}
    ).execute()
    time.sleep(1)

    url = f"https://docs.google.com/spreadsheets/d/{ss_id}/edit"
    print(f"\nDone! New spreadsheet URL:\n{url}")
    return url


if __name__ == "__main__":
    main()
