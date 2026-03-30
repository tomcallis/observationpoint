# Observation Point — Project Context

## Property
- **Name:** Observation Point
- **Address:** 50184 Treasure Ct, Frisco, NC 27936 (Hatteras Island, OBX)
- **VRBO listing:** #766628
- **Bedrooms/Baths:** 2BR / 2BA
- **Sleeps:** 6
- **Water access:** Soundfront (Pamlico Sound)

## Folder Structure
```
observationpoint/
├── site/           # Next.js website (Vercel)
└── rental-data/    # Google Sheets scripts & credentials
```

---

## Google Drive Access

### Authentication
- **Credentials:** `rental-data/client_secret.json` (OAuth 2.0 Desktop App)
- **Token:** `rental-data/token.pickle` (already authenticated — no browser login needed)
- **Account:** tomcallis Google account

### How to connect
```python
import pickle, gspread
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

def get_creds():
    with open("/Users/tomcallis/observationpoint/rental-data/token.pickle", "rb") as f:
        creds = pickle.load(f)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    return creds

creds = get_creds()
client = gspread.authorize(creds)                        # for Sheets
drive  = build("drive", "v3", credentials=creds)        # for Drive
sheets = build("sheets", "v4", credentials=creds)       # for Sheets formatting
```

### Key Google Drive locations
- **Observation Point folder ID:** `0B05aPI_UDvlmfmFUYnpGWTBJYnRNSVFkUjJCa1ctSjhaUXY0V21nQkVLbkV2Z2xmdUthN3M`

---

## Google Sheets

### Master Rental Data (clean consolidated spreadsheet)
- **Name:** Observation Point — Master Rental Data
- **ID:** `1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw`
- **URL:** https://docs.google.com/spreadsheets/d/1Hqq9WOHaPW2yc4KXNZAzsMsthcGZwrIVgrO_kzqnkAw/edit

#### Tabs:
| Tab | Contents |
|-----|----------|
| **Annual Summary** | Year-by-year income, occupancy, ADR, channel mix (2015–2027) |
| **Weekly Bookings** | Individual booking records 2023–2026 (218 rows) |
| **Rate History** | Weekly & nightly rates by season, 2017–2027 |
| **2027 Projection** | Week-by-week 2027 calendar with projected income |
| **2027 Rate Card** | Clean formatted rate card with season rates, holiday premiums, income projection |

### Source Spreadsheets
- **Observation Point Rates** (source data): `1cy1FMB_AfUzk5Ll_1USTIIKoIthBd3ft4OEypBgHzlY`
  - Sheets: 2017–2026 Rates (weekly booking records by year)
  - Also contains: Emails tab (guest contact list)
- **Observation Point Rental** (financial/expense history): `1PoP04esh7yKdgCDo-XiAqLBDcUWFvBOyT9zivOtZPIk`
- **Booking & Rate Analysis**: `1tyZVihY3dz5ENk8fxskN8zJBlE1K0mCpyEAnNNeOuZw`
  - Tabs: Rate History (2022–2026 + 2027 proposals), Booking History, Annual Summary, 2027 Recommendations
- **Comp Rate Tracker**: `12dSdy7mwx27F9IZrBd70Ydr1T7L-tm5A51kPnbddPMg`
  - Tabs: Trends (year-over-year comp summary), 2026 Rates (week-by-week comps), OP vs Comp Premium

> **Rates live in spreadsheets, not here.** See Booking & Rate Analysis → Rate History for current and proposed rates.

---

## Rental-Data Scripts
Located in `rental-data/`:
| Script | Purpose |
|--------|---------|
| `build_clean_sheet.py` | Built the Master Rental Data spreadsheet |
| `update_projection.py` | Updates 2027 Projection tab |
| `analyze_rates.py` | Full trend analysis & report |
| `rate_card.py` | Builds/refreshes the 2027 Rate Card tab |
| `sheets.py` | Simple interactive sheet reader |
| `booking_analysis.py` | Builds Booking & Rate Analysis spreadsheet (rate history, booking history, annual summary, 2027 recommendations) |
| `create_comp_sheet.py` | Created the Comp Rate Tracker spreadsheet |
| `update_comp_sheet.py` | Added Trends tab to Comp Rate Tracker |

---

## Website
- **Framework:** Next.js 16 + Tailwind CSS 4
- **Location:** `site/`
- **Rates config:** `site/config/property.ts`
- **Holiday price overrides:** `site/data/weekly-prices.json`
- **Deployment:** Vercel (requires `vercel login` then `vercel --prod` from `site/`)
