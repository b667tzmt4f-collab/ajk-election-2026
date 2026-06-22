// ─────────────────────────────────────────────────────────────────────────────
// lib/seatNames.ts — SINGLE SOURCE OF TRUTH for all 45 constituency names.
//
// Every page imports SEAT_NAMES from here instead of maintaining its own
// hardcoded copy. When a name changes, update it once here.
//
// Names follow the official EC delimitation notification format:
//   Division-Numeral (Area qualifier)
// Refugee seats (LA-34 to LA-45) include the Pakistan province/city qualifier.
// ─────────────────────────────────────────────────────────────────────────────

export const SEAT_NAMES: Record<string, string> = {
  // ── Mirpur Division ────────────────────────────────────────────────────────
  'LA-1':  'Mirpur-I (Dadyal)',
  'LA-2':  'Mirpur-II (Chakswari)',
  'LA-3':  'Mirpur-III (Mirpur City)',
  'LA-4':  'Mirpur-IV (Khari Sharif)',
  // ── Bhimber District ───────────────────────────────────────────────────────
  'LA-5':  'Bhimber-I (Barnala)',
  'LA-6':  'Bhimber-II (Samahni)',
  'LA-7':  'Bhimber-III (Bhimber City)',
  // ── Kotli District ─────────────────────────────────────────────────────────
  'LA-8':  'Kotli-I (Raj Mahal)',
  'LA-9':  'Kotli-II (Nakyal)',
  'LA-10': 'Kotli-III (Kotli City)',
  'LA-11': 'Kotli-IV (Sehnsa)',
  'LA-12': 'Kotli-V (Charhoi)',
  'LA-13': 'Kotli-VI (Khuiratta)',
  // ── Bagh District ──────────────────────────────────────────────────────────
  'LA-14': 'Bagh-I (Dheer Kot)',
  'LA-15': 'Bagh-II (Wastee)',
  'LA-16': 'Bagh-III (Gharbi)',
  // ── Haveli District ────────────────────────────────────────────────────────
  'LA-17': 'Haveli',
  // ── Poonch & Sudhnoti ──────────────────────────────────────────────────────
  'LA-18': 'Poonch and Sudhnoti-I (Abbaspur)',
  'LA-19': 'Poonch and Sudhnoti-II (Hajira)',
  'LA-20': 'Poonch and Sudhnoti-III (Ali Sojal)',
  'LA-21': 'Poonch and Sudhnoti-IV (Rawalakot City)',
  'LA-22': 'Poonch and Sudhnoti-V (Pachiot/Thorar)',
  'LA-23': 'Poonch and Sudhnoti-VI (Palandri)',
  'LA-24': 'Poonch and Sudhnoti-VII (Baloch)',
  // ── Neelum District ────────────────────────────────────────────────────────
  'LA-25': 'Neelum-I (Upper Neelum)',
  'LA-26': 'Neelum-II (Athmuqam)',
  // ── Muzaffarabad District ──────────────────────────────────────────────────
  'LA-27': 'Muzaffarabad-I (Naseerabad)',
  'LA-28': 'Muzaffarabad-II (Lachrat)',
  'LA-29': 'Muzaffarabad-III (City)',
  'LA-30': 'Muzaffarabad-IV (Hattian)',
  'LA-31': 'Muzaffarabad-V (Khawra)',
  'LA-32': 'Muzaffarabad-VI (Hattian Bala)',
  'LA-33': 'Muzaffarabad-VII (Leepa)',
  // ── Jammu Refugee Seats (Pakistan) ────────────────────────────────────────
  'LA-34': 'Jammu-I (Punjab/Sindh/Baluchistan)',
  'LA-35': 'Jammu-II (Gujranwala)',
  'LA-36': 'Jammu-III (Sialkot)',
  'LA-37': 'Jammu-IV (Narowal)',
  'LA-38': 'Jammu-V (Gujrat)',
  'LA-39': 'Jammu-VI (Jhelum/Rawalpindi)',
  // ── Kashmir Valley Refugee Seats (Pakistan) ───────────────────────────────
  'LA-40': 'Valley-I (Sindh/Baluchistan)',
  'LA-41': 'Valley-II (Lahore Division)',
  'LA-42': 'Valley-III (Multan/Sahiwal)',
  'LA-43': 'Valley-IV (Rawalpindi)',
  'LA-44': 'Valley-V (Rawalpindi/Islamabad)',
  'LA-45': 'Valley-VI (KPK)',
}

// Ordered list of all 45 seat IDs — numerically sorted, never lexicographic.
export const SEAT_IDS = Object.keys(SEAT_NAMES).sort(
  (a, b) => parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])
)
