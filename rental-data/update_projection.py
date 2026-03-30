import pickle, time
import gspread
from google.auth.transport.requests import Request
from datetime import date, timedelta

def get_creds():
    token_path = "/Users/tomcallis/sheets-project/token.pickle"
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
client = gspread.authorize(creds)
ss = client.open_by_key("1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw")

# Actual holiday dates in 2027
HOLIDAYS_2027 = [
    (date(2027, 1, 18),  "MLK Day"),
    (date(2027, 2, 15),  "Presidents' Day"),
    (date(2027, 4, 4),   "Easter"),          # Apr 4, 2027
    (date(2027, 5, 31),  "Memorial Day"),
    (date(2027, 7, 4),   "Independence Day"),
    (date(2027, 9, 6),   "Labor Day"),
    (date(2027, 11, 25), "Thanksgiving"),
    (date(2027, 12, 25), "Christmas"),
    (date(2028, 1, 1),   "New Year's Day"),
]

HOLIDAY_RATES = {
    "Memorial Day":       (2300, 329),
    "Independence Day":   (2850, 407),
    "Labor Day":          (1575, 225),
    "Thanksgiving":       (1200, 171),
    "Christmas":          (1300, 186),
    "New Year's Day":     (1300, 186),
    "Easter":             (1200, 171),
    "MLK Day":            (1095, 156),
    "Presidents' Day":    (1095, 156),
}

SEASON_RATES = {
    "Off-Peak":   (1095, 156),
    "Shoulder":   (1095, 156),
    "Mid-Season": (1685, 241),
    "Peak-Early": (2200, 314),   # June, August
    "Peak-High":  (2725, 389),   # July
}

def get_season(month):
    if month in (1, 2, 11, 12): return "Off-Peak"
    if month in (3, 4, 10):     return "Shoulder"
    if month in (5, 9):         return "Mid-Season"
    if month == 7:              return "Peak-High"
    return "Peak-Early"          # June, August

def get_2026_rate(season, holiday):
    h_map = {"Memorial Day": 2065, "Independence Day": 2555, "Labor Day": 1393,
             "Thanksgiving": 1043, "Christmas": 1043, "New Year's Day": 1043,
             "Easter": 1043, "MLK Day": 1043, "Presidents' Day": 1043}
    if holiday in h_map:
        return h_map[holiday]
    base = {"Off-Peak": 1043, "Shoulder": 1043, "Mid-Season": 1575,
            "Peak-Early": 2065, "Peak-High": 2555}
    return base.get(season, 1043)

def sat_of_week(d):
    """Return the Saturday that starts the week containing date d (Sat-Fri schedule)."""
    days_since_sat = (d.weekday() + 2) % 7  # Monday=0; Saturday=5 → offset 0
    return d - timedelta(days=days_since_sat)

# Build holiday-week lookup: saturday_date -> holiday_name
holiday_week = {}
for hdate, hname in HOLIDAYS_2027:
    sat = sat_of_week(hdate)
    # Don't overwrite a higher-priority holiday
    if sat not in holiday_week or hname in ("Independence Day", "Memorial Day", "Labor Day"):
        holiday_week[sat] = hname

# Family/comp weeks — 8 total (mirroring 2025/2026 pattern)
# Spring break + summer family weeks + fall
family_pattern_offsets = [15, 24, 25, 30, 31, 32, 41, 42]  # week indices from start

# Build all weeks (same structure as source spreadsheet)
start = date(2026, 12, 26)
all_weeks = []
d = start
while d < date(2028, 1, 10):
    all_weeks.append(d)
    d += timedelta(7)

# Mark family/comp by index
family_sats = {all_weeks[i] for i in family_pattern_offsets if i < len(all_weeks)}

# Which non-family, non-holiday weeks are "booked" at 45% occupancy
# 47 rentable weeks → 21 booked (holiday weeks always count as booked)
# Count holidays that aren't family weeks
holiday_booked = [sat for sat in holiday_week if sat not in family_sats and sat in all_weeks]
print(f"Holiday weeks (auto-booked): {len(holiday_booked)}")

# Remaining booked weeks needed from non-holiday rentable weeks
need_more = 21 - len(holiday_booked)

# Assign additional booked weeks by season priority (peak first, matching 2025 pattern)
# Exclude family and holiday weeks
non_holiday_rentable = [sat for sat in all_weeks
                        if sat not in family_sats and sat not in holiday_week
                        and date(2027, 1, 1) <= sat <= date(2027, 12, 31)]

# Sort by season priority, then date
def season_priority(sat):
    s = get_season(sat.month)
    return {"Peak-High": 0, "Peak-Early": 1, "Mid-Season": 2, "Shoulder": 3, "Off-Peak": 4}[s]

non_holiday_sorted = sorted(non_holiday_rentable, key=lambda s: (season_priority(s), s))
extra_booked = set(non_holiday_sorted[:need_more])

# Build final rows
rows_data = []
for sat in all_weeks:
    fri = sat + timedelta(6)
    holiday = holiday_week.get(sat, "")
    season  = get_season(sat.month)
    r2026   = get_2026_rate(season, holiday)

    if sat in family_sats:
        w, n   = SEASON_RATES[season]
        status = "Family/Comp"
        income = 0
        note   = "Hold for Callis family"
    elif holiday:
        w, n   = HOLIDAY_RATES.get(holiday, SEASON_RATES[season])
        status = "Booked"
        income = w
        note   = f"Holiday — {holiday}"
    elif sat in extra_booked:
        w, n   = SEASON_RATES[season]
        status = "Booked"
        income = w
        note   = "Projected booked (45% occ.)"
    else:
        w, n   = SEASON_RATES[season]
        status = "Not Booked"
        income = 0
        note   = ""

    rows_data.append([
        sat.strftime("%-m/%-d/%Y"),
        fri.strftime("%-m/%-d/%Y"),
        holiday, season,
        f"${r2026:,}", f"${w:,}", f"${n}",
        status,
        f"${income:,}",
        note
    ])

# Stats
rentable_wks  = [r for r in rows_data if r[7] != "Family/Comp"]
family_ct     = sum(1 for r in rows_data if r[7] == "Family/Comp")
booked_ct     = sum(1 for r in rentable_wks if r[7] == "Booked")
total_income  = sum(int(r[8].replace("$","").replace(",","")) for r in rows_data)
occupancy_pct = booked_ct / len(rentable_wks) * 100

print(f"\nTotal weeks        : {len(rows_data)}")
print(f"Rentable weeks     : {len(rentable_wks)}")
print(f"Family/Comp weeks  : {family_ct}")
print(f"Booked weeks       : {booked_ct}")
print(f"Occupancy          : {occupancy_pct:.1f}%")
print(f"Projected 2027 income: ${total_income:,}")

# Write sheet
ws = ss.worksheet("2027 Projection")
ws.clear()
time.sleep(1)

header = ["Week Start (Sat)", "Week End (Fri)", "Holiday", "Season",
          "2026 Rate", "2027 Rate", "2027 Nightly", "Status", "Projected Income", "Notes"]

output = [header] + rows_data + [
    [],
    ["SUMMARY"],
    ["Rentable weeks",        len(rentable_wks)],
    ["Family/Comp weeks",     family_ct],
    ["Booked weeks",          booked_ct],
    ["Not booked weeks",      len(rentable_wks) - booked_ct],
    ["Occupancy",             f"{occupancy_pct:.1f}%"],
    ["PROJECTED 2027 INCOME", f"${total_income:,}", "", "", "", "", "", "", "", "← 45% occupancy"],
    ["2025 Actual",           "$24,497"],
    ["2024 Actual",           "$31,552"],
    ["vs 2025 Actual",        f"${total_income - 24497:+,}"],
    ["vs 2024 Actual",        f"${total_income - 31552:+,}"],
]

ws.update(values=output, range_name="A1")

# Update Annual Summary
summary_ws = ss.worksheet("Annual Summary")
data = summary_ws.get_all_values()
for i, row in enumerate(data):
    if row and row[0] == "2027":
        summary_ws.update_cell(i+1, 2, f"${total_income:,}")
        summary_ws.update_cell(i+1, 10, f"45% occupancy ({booked_ct} of {len(rentable_wks)} rentable weeks)")
        break

print(f"\nSpreadsheet: https://docs.google.com/spreadsheets/d/1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw/edit")
