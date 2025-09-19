1) Kommentar für PR #72 (einfügen)
**Status (admin-only PR)**
- Build: ✅ (~22s)
- Lint: ❌ 133 errors / 29 warnings (legacy, unabhängig von diesem PR)
- Tests: ⚠️ keine Test-Infra vorhanden (`check:i18n-gps`, `test:gps-status` fehlen in package.json)

**Implementation Gap**
- `GPSStatus.tsx` enthält noch harte DE-Strings (z.B. „Aktueller Zustand“, „Timer“).
- EN-Keys im GPS-Namespace fehlen; State-Labels nutzen DE-Strings ohne i18n.

**Next (separater Implementierungs-PR, kein Code hier)**
- i18n: `gpsTracking.status.*` mit EN/DE-Parität anlegen.
- Component-Refactor: überall `t()` mit Namespace einsetzen.
- A11y: `aria-label` & sinnvolle `role`-Attribute.
- Guard-Script + minimale Tests (Parity + Smoke).
- CI: i18n-Check in Workflow integrieren.

**Admin**
- Labels: `i18n`, `accessibility`, `test`, `chore`
- Reviewer: @OsloSascha
- Draft-Status beibehalten bis Lint-Strategie (incremental) aktiv ist.
