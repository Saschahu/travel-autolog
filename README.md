<!-- CI trigger: ensure required checks are registered -->
[![CI](https://github.com/<Sascha-Hu-Inc>/<travel-autolog>/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

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

## Konfiguration

### Mapbox Tokens

- **Web**: `VITE_MAPBOX_TOKEN_WEB` (mit URL-Restrictions)
- **Native**: `VITE_MAPBOX_TOKEN_MOBILE` (ohne URL-Restrictions)

## Data Import

Die Anwendung unterstützt den Import von Arbeitszeitdaten über Excel-Dateien mit konfigurierbarer Funktionalität:

### Feature Flag: VITE_ENABLE_XLSX_IMPORT

- **Standard**: `false` (XLSX-Import deaktiviert)
- **Aktivierung**: Setzen Sie `VITE_ENABLE_XLSX_IMPORT=true` in der `.env`-Datei

### CSV Fallback

Wenn XLSX-Import deaktiviert ist, steht automatisch CSV-Import als Fallback zur Verfügung:
- Unterstützte Formate: `.csv` mit Standard-Trennzeichen (Komma, Semikolon)
- Gleiche Datenstruktur wie XLSX-Import erwartet
- Automatische Encoding-Erkennung (UTF-8, ISO-8859-1)

### Sicherheitsmaßnahmen

Für beide Import-Methoden gelten folgende Limits:
- **Dateigröße**: Maximal 10 MB
- **Zeilen**: Maximal 10.000 Datensätze pro Datei
- **Formeln**: Excel-Formeln werden automatisch als Werte importiert
- **Malware-Schutz**: Nur whitelistete Dateitypen erlaubt

### XLSX-Import wieder aktivieren

```bash
# .env-Datei bearbeiten
echo "VITE_ENABLE_XLSX_IMPORT=true" >> .env

# Anwendung neu starten
npm run dev
```

**Hinweis**: Nach Aktivierung ist die Excel-Upload-Komponente im Export-Bereich verfügbar.

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

## Report Editor – Images

The report editor supports image uploads with the following features:

### Limits & Formats
- **File size**: Maximum 8MB per image
- **Formats**: JPEG, PNG, WebP, GIF
- **Auto-resize**: Images are automatically resized to max 1600px while preserving aspect ratio
- **Quality**: JPEG compression at ~85% for optimal size/quality balance

### Privacy & Security
- **EXIF stripping**: All metadata including GPS location is automatically removed
- **File validation**: Images are validated by both MIME type and file signature (magic bytes)
- **Access control**: Images are stored with user-specific paths and signed URLs

### Feature Flag
Images can be disabled by setting `VITE_ENABLE_REPORT_IMAGES=false` (default: enabled)

### Storage
- Images are stored in Supabase Storage bucket `reports`
- Path structure: `{userId}/{year}/{month}/{day}/{uuid}.jpg`
- Signed URLs with 7-day expiry for secure access

### Troubleshooting
- If upload fails, check Supabase storage bucket configuration
- In development mode without bucket, temporary URLs are used
- Images support lazy loading and include alt-text for accessibility
