# Travel AutoLog

ServiceTracker automatische Dokumentation von Reise- und Arbeitszeiten für Servicetechniker.

## Project info

**URL**: https://lovable.dev/projects/7203a855-7cd4-4e82-992d-2cef8e48eef7

## Android Build Flow

### Android in 1 Befehl

```sh
# Alles in einem: Web build → Capacitor sync → APK install → App start
npm run android:run
```

**Voraussetzungen:**
- Android SDK/ADB installiert und im PATH
- Android-Gerät im USB-Debugging-Modus verbunden
- Bei erstem Lauf: `npx cap add android` falls android/ Ordner fehlt

### Frisch installieren (Clean Setup)

```sh
# 1. Repository aktualisieren
git fetch origin && git reset --hard origin/main

# 2. Dependencies installieren  
npm ci

# 3. Android Debug Build erstellen und starten
npm run android:run
```

### Alte App entfernen (bei Problemen)

```sh
adb uninstall com.lovable.travelautolog
```

### Version prüfen

1. **WebView Debug**: Chrome → `chrome://inspect` → Device öffnen
   - `location.href` sollte `capacitor://localhost` oder `https://localhost` zeigen (NICHT lovable.dev)
   
2. **BuildInfo Badge**: Unten rechts im Dashboard zeigt Version, Git-SHA und Target (native/web)

### Einzelschritte (Manual)

```sh
# Build erstellen
npm run build:native

# Capacitor sync
npm run cap:sync

# Android installieren
npm run android:install

# App starten
npm run android:run
```

## Web Development

```sh
# Entwicklungsserver starten
npm run dev

# Web Build erstellen
npm run build
```

## Verfügbare Scripts

- `npm run android:run` - **Hauptbefehl**: Build → Sync → Install → Start
- `npm run android:prep` - Web build + Capacitor sync
- `npm run android:install` - APK auf Gerät installieren
- `npm run android:start` - App auf Gerät starten
- `npm run android:clean` - Android Ordner neu erstellen
- `npm run verify:local` - Lokale Asset-Konsistenz prüfen
- `npm run build:native` - Native Build mit BUILD_TARGET=native

## Technologien

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Mobile**: Capacitor (Android/iOS)
- **Maps**: Mapbox GL JS
- **Backend**: Supabase

## Data Import (CSV & XLSX)

### Funktionen

Die Anwendung unterstützt den Import von Auftragsdaten über CSV- und Excel-Dateien mit integrierten Sicherheitsmaßnahmen.

#### CSV Import
- **Immer verfügbar**: CSV-Import ist standardmäßig aktiviert
- **Formel-Schutz**: Automatische Entschärfung gefährlicher Zellinhalte (=, +, -, @)
- **Upload-Limits**: Konfigurierbare Größen- und Zeilenbeschränkungen

#### XLSX Import
- **Feature-Flag-gesteuert**: Hinter `VITE_ENABLE_XLSX_IMPORT` Feature-Flag (Standard: deaktiviert)
- **Keine Sanitization**: XLSX-Dateien werden unverändert verarbeitet
- **Opt-in aktivierung**: Muss explizit über Umgebungsvariable eingeschaltet werden

### Umgebungsvariablen

```bash
# CSV/XLSX Upload Limits (Defaults gezeigt)
VITE_UPLOAD_MAX_BYTES=5242880     # 5 MB maximale Dateigröße
VITE_UPLOAD_MAX_ROWS=50000        # 50k Zeilen maximum
VITE_ENABLE_XLSX_IMPORT=false     # XLSX import feature flag (default: aus)
```

### Sicherheitsmaßnahmen

#### CSV Formula Injection Schutz
Die Anwendung schützt automatisch vor CSV Formula Injection Attacken:

- **Gefährliche Präfixe**: `=`, `+`, `-`, `@` am Zellenanfang
- **Automatische Entschärfung**: Gefährliche Zellen erhalten ein vorangestelltes `'`
- **Benutzerbenachrichtigung**: Nutzer werden über Sanitization informiert

#### Upload-Limits
- **Dateigröße**: Standard 5MB, über `VITE_UPLOAD_MAX_BYTES` konfigurierbar
- **Zeilenanzahl**: Standard 50.000 Zeilen, über `VITE_UPLOAD_MAX_ROWS` konfigurierbar
- **Echtzeit-Validierung**: Prüfung vor und nach dem Parsing

#### Feature-Flag-Guards
- **XLSX-Schutz**: Excel-Import muss explizit aktiviert werden
- **CSV-Verfügbarkeit**: CSV bleibt auch bei deaktiviertem XLSX verfügbar
- **UI-Integration**: Benutzerfreundliche Fehlermeldungen

### Manueller Testplan

#### Feature Flag Tests
```bash
# 1. XLSX deaktiviert (Standard)
VITE_ENABLE_XLSX_IMPORT=false
# Erwartung: .xlsx/.xls Dateien werden abgelehnt, CSV funktioniert

# 2. XLSX aktiviert
VITE_ENABLE_XLSX_IMPORT=true
# Erwartung: Alle Formate funktionieren
```

#### Limit Tests
```bash
# 1. Große Datei testen (>5 MB)
# Erwartung: Fehlermeldung "Datei zu groß"

# 2. Viele Zeilen testen (>50k)
# Erwartung: Fehlermeldung "Zu viele Zeilen"

# 3. Custom Limits
VITE_UPLOAD_MAX_BYTES=1048576  # 1 MB
VITE_UPLOAD_MAX_ROWS=1000      # 1k Zeilen
# Erwartung: Neue Limits werden angewendet
```

#### Formula Injection Tests
```csv
# Erstelle test.csv mit gefährlichen Inhalten:
name,formula,command,link
"John Doe","=SUM(A1:A10)","+CMD","@HYPERLINK(""http://evil.com"",""Click me"")"
```

**Erwartung**: Alle gefährlichen Formeln werden mit `'` escaped:
- `=SUM(A1:A10)` → `'=SUM(A1:A10)`
- `+CMD` → `'+CMD`
- `@HYPERLINK(...)` → `'@HYPERLINK(...)`

### Bekannte Grenzen

- **CSV-Encoding**: Nur UTF-8 vollständig unterstützt
- **CSV-Separator**: Standardmäßig Komma (`,`), andere Separatoren können Probleme verursachen  
- **XLSX-Komplexität**: Sehr komplexe Excel-Dateien können Performance-Probleme verursachen
- **Formel-Schutz**: Nur für CSV-Dateien, XLSX-Formeln bleiben unverändert

## Konfiguration

### Mapbox Tokens

- **Web**: `VITE_MAPBOX_TOKEN_WEB` (mit URL-Restrictions)
- **Native**: `VITE_MAPBOX_TOKEN_MOBILE` (ohne URL-Restrictions)

### Build Info

Das BuildInfo-Badge zeigt:
- App Version aus package.json
- Git SHA (kurz)
- Build Target (web/native)
- Build Timestamp

## Deployment

### Web (PWA)
Über Lovable: Project → Share → Publish

### Android APK
Nach `npm run build:android:debug` liegt die APK unter:
`android/app/build/outputs/apk/debug/app-debug.apk`

## Troubleshooting

### Duplicate Kotlin Class Errors
Die Android Gradle Konfiguration pinnt automatisch alle Kotlin Dependencies auf Version 1.8.22.

### Schwarzer Bildschirm
1. Console Logs prüfen (`chrome://inspect`)
2. BuildInfo Badge sollte sichtbar sein
3. Falls nicht: `npm run clean:android` und neu builden

### App-Daten zurücksetzen
In der App: Einstellungen → Erweitert → "App-Daten löschen"