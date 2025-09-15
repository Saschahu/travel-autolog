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

## Data Import (CSV & XLSX)

### XLSX Feature Flag
- **Default**: **OFF** (CSV nur)
- **Aktivierung**: `.env` → `VITE_ENABLE_XLSX_IMPORT=true`
- **CSV ist immer verfügbar** (unabhängig vom XLSX-Flag)

### Upload-Limits
Standard-Limits (überschreibbar via Environment-Variablen):
```
VITE_UPLOAD_MAX_BYTES=5242880   # 5MB
VITE_UPLOAD_MAX_ROWS=50000      # 50.000 Zeilen
```

### Sicherheit
**Formula-Injection-Mitigation**: Führende Sonderzeichen (`= + - @`) werden automatisch mit einem `'` escaped, um Excel-Formel-Injection zu verhindern.

### Manueller Testplan
1. **Flag=false** (Standard):
   - Nur `.csv` Dateien werden akzeptiert
   - `.xlsx/.xls` Dateien werden blockiert mit Hinweis
   - "Excel-Import ist durch eine Richtlinie deaktiviert. CSV-Import bleibt verfügbar."

2. **Flag=true**:
   - `.xlsx`, `.xls` und `.csv` Dateien werden akzeptiert
   - Kein Einschränkungs-Hinweis wird angezeigt

3. **Upload-Limits**:
   - Datei zu groß → "Datei ist zu groß. Maximalgröße: X MB" Toast
   - Zu viele Zeilen → "Zu viele Zeilen (X). Maximal erlaubt: Y" Toast

4. **Formula-Injection-Test**:
   - CSV mit `=SUM(1,2)` → Wird angezeigt/verarbeitet als `'=SUM(1,2)`

### Troubleshooting
- **Encoding**: UTF-8 mit/ohne BOM unterstützt
- **Zeilenendezeichen**: CRLF und LF unterstützt  
- **Delimiter**: Komma (`,`) und Semikolon (`;`) automatisch erkannt
- **Quotes**: Doppelte und einfache Anführungszeichen unterstützt

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