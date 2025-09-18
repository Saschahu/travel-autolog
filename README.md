# Travel AutoLog

ServiceTracker automatische Dokumentation von Reise- und Arbeitszeiten für Servicetechniker.

## Data Import (CSV & XLSX)

Die Anwendung unterstützt den Import von Auftragsdaten über CSV- und Excel-Dateien mit erweiterten Sicherheitsfeatures:

### Unterstützte Formate
- **CSV**: Immer verfügbar, mit automatischer Formel-Sanitization
- **XLSX/XLS**: Optional aktivierbar über `VITE_ENABLE_XLSX=true`

### Sicherheitsfeatures
- **CSV Formel-Sanitizer**: Gefährliche Präfixe (`=`, `+`, `-`, `@`) werden automatisch mit `'` entschärft
- **Upload-Limits**: Konfigurierbare Größen- und Zeilenlimits
- **Validierung**: Dateien werden vor und nach dem Parsen validiert

### Konfiguration

Environment Variables in `.env`:

```env
# XLSX Feature aktivieren (CSV ist immer verfügbar)
VITE_ENABLE_XLSX=true

# Upload-Limits
VITE_MAX_UPLOAD_SIZE_MB=5      # Standard: 5 MB
VITE_MAX_UPLOAD_ROWS=50000     # Standard: 50.000 Zeilen
```

### Test-Szenarien

1. **Große Datei (>5MB)**: Fehler "Datei ist zu groß"
2. **Zu viele Zeilen (>50.000)**: Fehler "Zu viele Zeilen"
3. **CSV mit Formeln**: `=SUM(1,2)` → `'=SUM(1,2)` + Sicherheitshinweis
4. **XLSX bei deaktiviertem Flag**: Blockiert mit Hinweis auf CSV

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