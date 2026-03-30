import os
import pickle
import re
import datetime
from collections import defaultdict

import gspread
from google.auth.transport.requests import Request

# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

def get_creds():
    token_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "token.pickle")
    with open(token_path, "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def parse_currency(val):
    """Return float from strings like '$1,043', '1,043.00', '' or '0'. Returns None if unparseable."""
    if val is None:
        return None
    s = str(val).strip().replace("$", "").replace(",", "").replace(" ", "")
    if s in ("", "-", "–", "—"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def parse_date(val):
    """Try several date formats. Return datetime.date or None."""
    if not val or not str(val).strip():
        return None
    s = str(val).strip()
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%-m/%-d/%Y", "%-m/%-d/%y",
                "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.datetime.strptime(s, fmt).date()
        except ValueError:
            pass
    return None


def safe_str(val):
    return str(val).strip() if val is not None else ""


def month_to_season(month):
    if month in (1, 2, 11, 12):
        return "Off-Peak"
    elif month in (3, 4, 10):
        return "Shoulder"
    elif month in (5, 9):
        return "Mid-Season"
    elif month in (6, 7, 8):
        return "Peak"
    return "Unknown"


def is_family_comp(rental_type_str, renter_name_str):
    rt = rental_type_str.strip().lower()
    rn = renter_name_str.strip().lower()
    if rt == "family or comp":
        return True
    callis_keywords = ["hold for callis", "blocked for callis", "callis family", "callis hold", "callis block"]
    for kw in callis_keywords:
        if kw in rn:
            return True
    return False


def is_booked_channel(rental_type_str):
    rt = rental_type_str.strip().lower()
    return rt in ("vrbo", "direct booking", "direct", "airbnb")


# ─────────────────────────────────────────────
# COLUMN MAP PER YEAR
# Each entry: (sat_col, fri_col, holiday_col, weekly_rate_col, nightly_rate_col,
#              pred_weeks_col, pred_income_col, actual_income_col,
#              rental_type_col, renter_name_col)
# ─────────────────────────────────────────────

YEAR_COL_MAP = {
    # Default layout assumed for most years unless overridden
    "default": dict(sat=0, fri=1, holiday=2, weekly_rate=3, nightly_rate=4,
                    pred_weeks=5, pred_income=6, actual_income=7,
                    rental_type=8, renter_name=9),
}

# We'll detect column offsets by inspecting the header row at runtime.
HEADER_ALIASES = {
    "saturday":       "sat",
    "friday":         "fri",
    "holiday":        "holiday",
    "notes":          "holiday",
    "holiday/notes":  "holiday",
    "weekly rate":    "weekly_rate",
    "weekly":         "weekly_rate",
    "nightly rate":   "nightly_rate",
    "nightly":        "nightly_rate",
    "predicted weeks":"pred_weeks",
    "predicted":      "pred_weeks",
    "predicted income":"pred_income",
    "actual income":  "actual_income",
    "actual":         "actual_income",
    "rental type":    "rental_type",
    "type":           "rental_type",
    "renter name":    "renter_name",
    "renter":         "renter_name",
    "name":           "renter_name",
}


def detect_columns(header_row):
    """Return a dict mapping field names to column indices from the header row."""
    col_map = {}
    for idx, cell in enumerate(header_row):
        key = safe_str(cell).lower().strip()
        for alias, field in HEADER_ALIASES.items():
            if alias in key and field not in col_map:
                col_map[field] = idx
                break
    return col_map


def get_field(row, col_map, field, default=""):
    idx = col_map.get(field)
    if idx is None or idx >= len(row):
        return default
    return safe_str(row[idx])


# ─────────────────────────────────────────────
# PROCESS ONE YEAR SHEET
# ─────────────────────────────────────────────

def process_sheet(ws_title, data, anomalies):
    year_label = ws_title.strip()
    # Extract numeric year
    year_match = re.search(r"(20\d{2})", year_label)
    year_num = int(year_match.group(1)) if year_match else None

    if not data or len(data) < 2:
        anomalies.append(f"{year_label}: Sheet appears empty or has only one row.")
        return None

    # Detect header row (usually row 0, but sometimes row 1 if there's a title)
    header_row_idx = 0
    for i, row in enumerate(data[:3]):
        joined = " ".join(safe_str(c).lower() for c in row)
        if "saturday" in joined or "weekly rate" in joined or "actual" in joined:
            header_row_idx = i
            break

    header_row = data[header_row_idx]
    col_map = detect_columns(header_row)

    # Fallback defaults if detection fails
    defaults = YEAR_COL_MAP["default"]
    for field, idx in defaults.items():
        if field not in col_map:
            col_map[field] = idx
            anomalies.append(f"{year_label}: Could not detect column '{field}' from header; using default index {idx}.")

    rows = data[header_row_idx + 1:]

    year_data = {
        "year": year_num,
        "label": year_label,
        "weeks": [],
        "anomalies": [],
    }

    for raw_idx, row in enumerate(rows):
        # Pad row to avoid index errors
        while len(row) < max(col_map.values()) + 2:
            row.append("")

        sat_str = get_field(row, col_map, "sat")
        fri_str = get_field(row, col_map, "fri")

        # Skip blank rows
        if not sat_str and not fri_str:
            continue

        sat_date = parse_date(sat_str)
        fri_date = parse_date(fri_str)

        # Detect totals row (usually has "Total" somewhere in first cells or dates fail for both)
        row_label = " ".join(safe_str(c) for c in row[:4]).lower()
        if "total" in row_label and sat_date is None:
            continue

        # Skip if we can't parse Saturday date at all for rows that look like data
        if sat_date is None:
            # Could still be a valid data row (date in different format); flag and skip
            if sat_str and sat_str.lower() not in ("", "saturday", "date"):
                anomalies.append(f"{year_label} row {raw_idx+2}: Could not parse Saturday date '{sat_str}'.")
            continue

        holiday_notes = get_field(row, col_map, "holiday")
        weekly_rate_str = get_field(row, col_map, "weekly_rate")
        nightly_rate_str = get_field(row, col_map, "nightly_rate")
        pred_weeks_str = get_field(row, col_map, "pred_weeks")
        pred_income_str = get_field(row, col_map, "pred_income")
        actual_income_str = get_field(row, col_map, "actual_income")
        rental_type_str = get_field(row, col_map, "rental_type")
        renter_name_str = get_field(row, col_map, "renter_name")

        weekly_rate = parse_currency(weekly_rate_str)
        nightly_rate = parse_currency(nightly_rate_str)
        pred_income = parse_currency(pred_income_str)
        actual_income = parse_currency(actual_income_str)

        try:
            pred_weeks = int(float(pred_weeks_str)) if pred_weeks_str.strip() else 0
        except (ValueError, TypeError):
            pred_weeks = 0

        family_comp = is_family_comp(rental_type_str, renter_name_str)
        booked_channel = is_booked_channel(rental_type_str)

        # Determine status
        if family_comp:
            status = "family_comp"
        elif pred_weeks == 1 and booked_channel:
            status = "booked"
        elif pred_weeks == 1 and rental_type_str.strip() == "" and (actual_income or 0) > 0:
            status = "booked"
        elif pred_weeks == 0 and not family_comp:
            status = "unbooked"
        else:
            status = "unbooked"

        # For future weeks (no actual income yet), trust prediction
        is_future = (year_num and sat_date.year >= datetime.date.today().year and
                     sat_date > datetime.date.today())

        channel = rental_type_str.strip().lower()
        if channel in ("vrbo",):
            channel = "VRBO"
        elif channel in ("direct booking", "direct"):
            channel = "Direct"
        elif channel in ("airbnb",):
            channel = "Airbnb"
        elif family_comp:
            channel = "Family/Comp"
        else:
            channel = "Unbooked"

        week_rec = {
            "sat_date": sat_date,
            "fri_date": fri_date,
            "holiday_notes": holiday_notes,
            "weekly_rate": weekly_rate,
            "nightly_rate": nightly_rate,
            "pred_weeks": pred_weeks,
            "pred_income": pred_income,
            "actual_income": actual_income,
            "rental_type": rental_type_str,
            "renter_name": renter_name_str,
            "status": status,
            "channel": channel,
            "is_future": is_future,
            "season": month_to_season(sat_date.month),
            "has_holiday": bool(holiday_notes and holiday_notes.strip() and
                                holiday_notes.lower() not in ("", "none", "n/a")),
        }
        year_data["weeks"].append(week_rec)

    return year_data


# ─────────────────────────────────────────────
# AGGREGATE YEAR STATS
# ─────────────────────────────────────────────

def aggregate_year(yd):
    weeks = yd["weeks"]
    year = yd["year"]
    today = datetime.date.today()

    total_weeks = len(weeks)
    family_comp_weeks = [w for w in weeks if w["status"] == "family_comp"]
    available_weeks_list = [w for w in weeks if w["status"] != "family_comp"]
    booked_weeks = [w for w in available_weeks_list if w["status"] == "booked"]

    # Actual income: sum where actual_income > 0 (exclude family/comp)
    actual_income_list = [w["actual_income"] for w in booked_weeks if w["actual_income"] and w["actual_income"] > 0]
    total_actual_income = sum(actual_income_list)

    # For future booked weeks use predicted income
    future_predicted = [w["pred_income"] for w in booked_weeks
                        if w["is_future"] and (not w["actual_income"] or w["actual_income"] == 0)
                        and w["pred_income"] and w["pred_income"] > 0]
    total_future_pred = sum(future_predicted)

    # ADR: use actual income / booked weeks that have actual income
    adr_weeks = [w for w in booked_weeks if w["actual_income"] and w["actual_income"] > 0]
    adr = total_actual_income / len(adr_weeks) if adr_weeks else 0

    occupancy = (len(booked_weeks) / len(available_weeks_list) * 100) if available_weeks_list else 0

    # Channel breakdown
    channel_counts = defaultdict(int)
    channel_income = defaultdict(float)
    for w in booked_weeks:
        ch = w["channel"] if w["channel"] not in ("Unbooked", "Family/Comp") else "Other"
        channel_counts[ch] += 1
        if w["actual_income"] and w["actual_income"] > 0:
            channel_income[ch] += w["actual_income"]

    total_booked = len(booked_weeks)
    vrbo_pct = (channel_counts.get("VRBO", 0) / total_booked * 100) if total_booked else 0
    direct_pct = (channel_counts.get("Direct", 0) / total_booked * 100) if total_booked else 0

    # Seasonal breakdown
    seasonal = defaultdict(lambda: {"weeks": 0, "income": 0.0, "booked": 0})
    for w in available_weeks_list:
        s = w["season"]
        seasonal[s]["weeks"] += 1
        if w["status"] == "booked":
            seasonal[s]["booked"] += 1
            if w["actual_income"] and w["actual_income"] > 0:
                seasonal[s]["income"] += w["actual_income"]

    # Rate tiers (weekly rate ranges for booked weeks)
    rates = [w["weekly_rate"] for w in booked_weeks if w["weekly_rate"] and w["weekly_rate"] > 0]
    avg_weekly_rate = sum(rates) / len(rates) if rates else 0

    # Holiday weeks
    holiday_booked = [w for w in booked_weeks if w["has_holiday"]]
    holiday_income = sum(w["actual_income"] for w in holiday_booked
                         if w["actual_income"] and w["actual_income"] > 0)

    return {
        "year": year,
        "label": yd["label"],
        "total_slots": total_weeks,
        "family_comp_weeks": len(family_comp_weeks),
        "available_weeks": len(available_weeks_list),
        "booked_weeks": total_booked,
        "occupancy_pct": occupancy,
        "total_actual_income": total_actual_income,
        "total_future_pred": total_future_pred,
        "combined_income": total_actual_income + total_future_pred,
        "adr": adr,
        "avg_weekly_rate": avg_weekly_rate,
        "vrbo_pct": vrbo_pct,
        "direct_pct": direct_pct,
        "channel_counts": dict(channel_counts),
        "channel_income": dict(channel_income),
        "seasonal": {k: dict(v) for k, v in seasonal.items()},
        "holiday_weeks": len(holiday_booked),
        "holiday_income": holiday_income,
        "raw_weeks": weeks,
    }


# ─────────────────────────────────────────────
# TREND & RECOMMENDATION ANALYSIS
# ─────────────────────────────────────────────

SEASON_ORDER = ["Off-Peak", "Shoulder", "Mid-Season", "Peak"]

# Representative base rates per season for rate progression
SEASON_BASE_RATES = {
    "Off-Peak": 1043,
    "Shoulder": 1218,
    "Mid-Season": 1484,
    "Peak": 2310,
}

# Nightly rate divisor (7 nights)
NIGHTS = 7


def compute_season_adr_by_year(year_stats_list):
    """For each season, collect average actual rates per year."""
    season_adr = defaultdict(dict)  # season -> year -> avg_rate
    for ys in year_stats_list:
        if not ys:
            continue
        for w in ys["raw_weeks"]:
            if w["status"] == "booked" and w["actual_income"] and w["actual_income"] > 0:
                s = w["season"]
                yr = ys["year"]
                season_adr[s].setdefault(yr, []).append(w["actual_income"])
    # Compute averages
    result = {}
    for season, yr_data in season_adr.items():
        result[season] = {yr: sum(vals)/len(vals) for yr, vals in yr_data.items()}
    return result


def project_rate_2027(season_adr_by_year, season):
    """Simple linear growth projection for 2027."""
    yr_data = season_adr_by_year.get(season, {})
    if not yr_data:
        return None, None
    years_sorted = sorted(yr_data.keys())
    if len(years_sorted) < 2:
        rate = yr_data[years_sorted[0]]
        return rate, None  # Can't project
    # Use last 4 years of data for projection (excluding far future partial years)
    complete_years = [y for y in years_sorted if y <= 2025]
    if len(complete_years) < 2:
        complete_years = years_sorted
    recent = complete_years[-min(5, len(complete_years)):]
    rates = [yr_data[y] for y in recent]
    # Linear regression (simple)
    n = len(recent)
    x_mean = sum(recent) / n
    y_mean = sum(rates) / n
    num = sum((recent[i] - x_mean) * (rates[i] - y_mean) for i in range(n))
    den = sum((recent[i] - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0
    intercept = y_mean - slope * x_mean
    proj_2026 = slope * 2026 + intercept
    proj_2027 = slope * 2027 + intercept
    pct_growth = (slope / y_mean * 100) if y_mean else 0
    return proj_2027, pct_growth


MONTH_SEASONS = {
    1: "Off-Peak", 2: "Off-Peak",
    3: "Shoulder", 4: "Shoulder",
    5: "Mid-Season",
    6: "Peak", 7: "Peak", 8: "Peak",
    9: "Mid-Season",
    10: "Shoulder",
    11: "Off-Peak", 12: "Off-Peak",
}

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December"
}


# ─────────────────────────────────────────────
# REPORT GENERATION
# ─────────────────────────────────────────────

def build_report(all_year_stats, anomalies, season_adr_by_year):
    lines = []
    HR = "=" * 80
    hr = "-" * 80

    lines.append(HR)
    lines.append("  OBSERVATION POINT RENTAL ANALYSIS REPORT")
    lines.append(f"  Generated: {datetime.date.today().strftime('%B %d, %Y')}")
    lines.append(HR)
    lines.append("")

    # ── Section 1: Data Cleaning Summary ──────────────────────────────────────
    lines.append("1. DATA CLEANING SUMMARY")
    lines.append(hr)
    if anomalies:
        for a in anomalies:
            lines.append(f"  * {a}")
    else:
        lines.append("  No significant anomalies detected.")
    lines.append("")

    # ── Section 2: Year-by-Year Summary Table ─────────────────────────────────
    lines.append("2. YEAR-BY-YEAR SUMMARY TABLE")
    lines.append(hr)
    header = (f"{'Year':<6} {'Avail':>5} {'Rented':>6} {'Occ%':>6} "
              f"{'Actual Income':>14} {'Pred (future)':>14} {'ADR':>8} "
              f"{'VRBO%':>7} {'Direct%':>8} {'Fam/Comp':>9}")
    lines.append(header)
    lines.append("-" * len(header))

    for ys in all_year_stats:
        if not ys:
            continue
        future_note = f"  +${ys['total_future_pred']:,.0f}" if ys['total_future_pred'] > 0 else ""
        lines.append(
            f"{ys['label']:<6} {ys['available_weeks']:>5} {ys['booked_weeks']:>6} "
            f"{ys['occupancy_pct']:>5.1f}% "
            f"  ${ys['total_actual_income']:>11,.0f} "
            f"  ${ys['total_future_pred']:>11,.0f} "
            f"  ${ys['adr']:>6,.0f} "
            f"{ys['vrbo_pct']:>6.1f}% "
            f"{ys['direct_pct']:>7.1f}% "
            f"{ys['family_comp_weeks']:>9}"
        )
    lines.append("")

    # ── Section 2b: Channel Detail ─────────────────────────────────────────────
    lines.append("  Channel Breakdown Detail:")
    lines.append(f"  {'Year':<6}  " + "  ".join(f"{'Channel':<14} {'Weeks':>5} {'Income':>10}" for _ in [1]))
    for ys in all_year_stats:
        if not ys:
            continue
        parts = []
        for ch, cnt in sorted(ys["channel_counts"].items()):
            inc = ys["channel_income"].get(ch, 0)
            parts.append(f"    {ch:<16} {cnt:>5} wks  ${inc:>10,.0f}")
        if parts:
            lines.append(f"  {ys['label']}:")
            lines.extend(parts)
    lines.append("")

    # ── Section 2c: Seasonal Detail ───────────────────────────────────────────
    lines.append("  Seasonal Occupancy Detail:")
    lines.append(f"  {'Year':<6}  {'Season':<12}  {'Avail':>5}  {'Booked':>6}  {'Occ%':>6}  {'Income':>12}")
    for ys in all_year_stats:
        if not ys:
            continue
        for season in SEASON_ORDER:
            sd = ys["seasonal"].get(season)
            if not sd:
                continue
            occ = (sd["booked"] / sd["weeks"] * 100) if sd["weeks"] else 0
            lines.append(f"  {ys['label']:<6}  {season:<12}  {sd['weeks']:>5}  "
                         f"{sd['booked']:>6}  {occ:>5.1f}%  ${sd['income']:>10,.0f}")
    lines.append("")

    # ── Section 3: Trend Analysis ──────────────────────────────────────────────
    lines.append("3. TREND ANALYSIS")
    lines.append(hr)

    # Revenue growth
    complete = [ys for ys in all_year_stats if ys and ys["year"] and ys["year"] <= 2024 and ys["total_actual_income"] > 0]
    if len(complete) >= 2:
        first = complete[0]
        last = complete[-1]
        total_yrs = last["year"] - first["year"]
        if total_yrs > 0 and first["total_actual_income"] > 0:
            cagr = ((last["total_actual_income"] / first["total_actual_income"]) ** (1 / total_yrs) - 1) * 100
        else:
            cagr = 0
        lines.append(f"  Revenue Growth ({first['year']}-{last['year']}):")
        lines.append(f"    {first['year']} Actual Income: ${first['total_actual_income']:,.0f}")
        lines.append(f"    {last['year']} Actual Income: ${last['total_actual_income']:,.0f}")
        lines.append(f"    CAGR: {cagr:.1f}%")
        lines.append("")

    # YoY income changes
    lines.append("  Year-over-Year Income Change:")
    prev = None
    for ys in all_year_stats:
        if not ys or not ys["year"] or ys["total_actual_income"] == 0:
            prev = ys
            continue
        if prev and prev["total_actual_income"] > 0:
            chg = (ys["total_actual_income"] - prev["total_actual_income"]) / prev["total_actual_income"] * 100
            lines.append(f"    {prev['year']} -> {ys['year']}: ${prev['total_actual_income']:,.0f} -> ${ys['total_actual_income']:,.0f}  ({chg:+.1f}%)")
        prev = ys
    lines.append("")

    # ADR trend
    lines.append("  ADR (Average Daily/Weekly Rate) Trend:")
    for ys in all_year_stats:
        if not ys or not ys["year"] or ys["adr"] == 0:
            continue
        bar_len = int(ys["adr"] / 100)
        lines.append(f"    {ys['label']:<8} ${ys['adr']:>7,.0f}  {'|' * min(bar_len, 40)}")
    lines.append("")

    # Occupancy trend
    lines.append("  Occupancy Rate Trend:")
    for ys in all_year_stats:
        if not ys or not ys["year"]:
            continue
        bar_len = int(ys["occupancy_pct"] / 2.5)
        lines.append(f"    {ys['label']:<8} {ys['occupancy_pct']:>5.1f}%  {'|' * min(bar_len, 40)}")
    lines.append("")

    # Channel mix
    lines.append("  Channel Mix Over Time (VRBO% vs Direct%):")
    for ys in all_year_stats:
        if not ys or not ys["year"]:
            continue
        lines.append(f"    {ys['label']:<8}  VRBO: {ys['vrbo_pct']:>5.1f}%  Direct: {ys['direct_pct']:>5.1f}%  "
                     f"Other: {100 - ys['vrbo_pct'] - ys['direct_pct']:>5.1f}%")
    lines.append("")

    # Seasonal ADR by year
    lines.append("  Seasonal Average Weekly Rate by Year:")
    lines.append(f"  {'Season':<12}" + "".join(f"  {ys['year'] or ys['label']!s:>6}" for ys in all_year_stats if ys and ys["year"]))
    for season in SEASON_ORDER:
        row_parts = [f"  {season:<12}"]
        for ys in all_year_stats:
            if not ys or not ys["year"]:
                continue
            yr_data = season_adr_by_year.get(season, {})
            rate = yr_data.get(ys["year"])
            row_parts.append(f"  {('$'+f'{rate:,.0f}') if rate else '     -':>6}")
        lines.append("".join(row_parts))
    lines.append("")

    # Predicted vs Actual variance
    lines.append("  Predicted vs Actual Income Variance (completed years):")
    for ys in all_year_stats:
        if not ys or not ys["year"] or ys["year"] > 2025:
            continue
        pred_total = sum(w["pred_income"] for w in ys["raw_weeks"]
                         if w["pred_income"] and w["pred_income"] > 0 and not w["is_future"])
        act_total = ys["total_actual_income"]
        if pred_total > 0:
            variance = (act_total - pred_total) / pred_total * 100
            lines.append(f"    {ys['label']:<8}  Predicted: ${pred_total:>10,.0f}  Actual: ${act_total:>10,.0f}  "
                         f"Variance: {variance:+.1f}%")
    lines.append("")

    # Family/Comp impact
    lines.append("  Family/Comp Impact on Revenue:")
    for ys in all_year_stats:
        if not ys or not ys["year"]:
            continue
        fc = ys["family_comp_weeks"]
        avg_rate = ys["avg_weekly_rate"] if ys["avg_weekly_rate"] else ys["adr"]
        lost_rev = fc * avg_rate
        lines.append(f"    {ys['label']:<8}  Family/Comp weeks: {fc:>2}  "
                     f"Estimated foregone revenue: ${lost_rev:>8,.0f}")
    lines.append("")

    # ── Section 4: 2027 Pricing Recommendations ────────────────────────────────
    lines.append("4. 2027 PRICING RECOMMENDATIONS")
    lines.append(hr)
    lines.append("  Based on year-over-year rate progression and occupancy trends.")
    lines.append("")

    # Project per season
    season_projections = {}
    for season in SEASON_ORDER:
        proj, pct = project_rate_2027(season_adr_by_year, season)
        season_projections[season] = (proj, pct)

    lines.append(f"  {'Month':<12} {'Season':<12} {'Suggested Weekly':>16} {'Suggested Nightly':>18} {'Notes'}")
    lines.append("  " + "-" * 76)

    # Holiday weeks typically add 10-25% premium
    month_notes = {
        1: "Post-holiday slow; consider 7-night minimum",
        2: "Presidents Day wknd - small premium possible",
        3: "Spring Break potential; shoulder push",
        4: "Spring shoulder; Easter = holiday premium",
        5: "Memorial Day wknd = holiday premium",
        6: "Peak season begins; high demand",
        7: "Peak - 4th of July = highest demand week",
        8: "Late peak; Labor Day wknd premium",
        9: "Labor Day wknd premium; shoulder starts mid-month",
        10: "Shoulder; Columbus Day wknd small premium",
        11: "Off-peak; Thanksgiving wknd premium",
        12: "Christmas/NYE = holiday premium; Jan 1 wknd",
    }

    for month in range(1, 13):
        season = MONTH_SEASONS[month]
        proj_rate, pct_growth = season_projections.get(season, (None, None))
        if proj_rate and proj_rate > 0:
            weekly = round(proj_rate / 50) * 50  # round to nearest $50
            nightly = round(weekly / NIGHTS / 5) * 5  # round to nearest $5
        else:
            # Fallback to base + modest inflation
            base = SEASON_BASE_RATES.get(season, 1200)
            weekly = round(base * 1.05 / 50) * 50
            nightly = round(weekly / NIGHTS / 5) * 5

        growth_note = f"(proj. {pct_growth:+.1f}%/yr)" if pct_growth is not None else "(insufficient data)"
        note = month_notes.get(month, "")
        lines.append(f"  {MONTH_NAMES[month]:<12} {season:<12} ${weekly:>14,.0f} ${nightly:>16,.0f}   {growth_note}  {note}")

    lines.append("")
    lines.append("  Holiday Premium Recommendations:")
    lines.append("    - Memorial Day week:      +15-20% above standard weekly rate")
    lines.append("    - 4th of July week:       +20-25% above standard weekly rate")
    lines.append("    - Labor Day week:         +15-20% above standard weekly rate")
    lines.append("    - Thanksgiving week:      +10-15% above standard weekly rate")
    lines.append("    - Christmas/New Year wk:  +20-30% above standard weekly rate")
    lines.append("    - Easter week:            +10-15% above standard weekly rate")
    lines.append("")

    # Detailed season rate tables
    lines.append("  Seasonal Rate History & Projections:")
    for season in SEASON_ORDER:
        yr_data = season_adr_by_year.get(season, {})
        proj_rate, pct_growth = season_projections.get(season, (None, None))
        lines.append(f"    {season}:")
        for yr in sorted(yr_data.keys()):
            lines.append(f"      {yr}: ${yr_data[yr]:>8,.0f}/week  (${yr_data[yr]/NIGHTS:,.0f}/night)")
        if proj_rate:
            growth_str = f"{pct_growth:+.1f}%/yr growth rate" if pct_growth is not None else "insufficient data for trend"
            lines.append(f"      2027 PROJECTED: ${proj_rate:>8,.0f}/week  (${proj_rate/NIGHTS:,.0f}/night)  "
                         f"[{growth_str}]")
        lines.append("")

    # ── Section 5: Confidence Notes ───────────────────────────────────────────
    lines.append("5. CONFIDENCE NOTES")
    lines.append(hr)
    lines.append("  * Column detection is automated; if a year's data looks off, check col_map manually.")
    lines.append("  * 2025 and 2026 projections include predicted (not actual) income for future weeks.")
    lines.append("  * Rate projections use linear regression on 5 most recent complete years.")
    lines.append("  * Occupancy rates exclude Family/Comp weeks from the denominator.")
    lines.append("  * ADR is based on actual income only (not predicted); future weeks excluded.")
    lines.append("  * Holiday detection relies on non-empty holiday/notes column; verify manually.")
    lines.append("  * Channel mix may undercount Direct bookings if rental type field was left blank.")
    lines.append("  * 2026 data is partial-year; income figures will grow as the year fills in.")
    lines.append("  * Recommend 3-5% annual rate increase minimum to match inflation trends.")
    lines.append("  * Peak season (Jun-Aug) has highest occupancy leverage; prioritize rate over discount.")
    lines.append("")
    lines.append(HR)
    lines.append("  END OF REPORT")
    lines.append(HR)

    return "\n".join(lines)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print("Authenticating with Google Sheets...")
    creds = get_creds()
    client = gspread.authorize(creds)

    SPREADSHEET_ID = "1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY"
    print(f"Opening spreadsheet {SPREADSHEET_ID}...")
    spreadsheet = client.open_by_key(SPREADSHEET_ID)

    all_ws = spreadsheet.worksheets()
    ws_titles = [ws.title for ws in all_ws]
    print(f"Found sheets: {ws_titles}")

    TARGET_YEARS = ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"]

    target_sheets = []
    for ws in all_ws:
        for yr in TARGET_YEARS:
            if yr in ws.title:
                target_sheets.append(ws)
                break

    print(f"Processing {len(target_sheets)} year sheets: {[ws.title for ws in target_sheets]}")

    all_anomalies = []
    all_year_data = []

    for ws in target_sheets:
        print(f"  Reading '{ws.title}'...")
        try:
            data = ws.get_all_values()
            yd = process_sheet(ws.title, data, all_anomalies)
            if yd:
                all_year_data.append(yd)
        except Exception as e:
            all_anomalies.append(f"{ws.title}: Error reading sheet - {e}")
            print(f"    ERROR: {e}")

    print("Aggregating statistics...")
    all_year_stats = [aggregate_year(yd) for yd in all_year_data]

    print("Computing seasonal ADR trends...")
    season_adr_by_year = compute_season_adr_by_year(all_year_stats)

    print("Building report...")
    report = build_report(all_year_stats, all_anomalies, season_adr_by_year)

    output_path = "/Users/tomcallis/sheets-project/observation_point_analysis.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\nReport saved to: {output_path}\n")
    print(report)


if __name__ == "__main__":
    main()
