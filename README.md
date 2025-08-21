# Travel AutoLog

ServiceTracker für automatische Dokumentation von Reise- und Arbeitszeiten für Servicetechniker.

## Project info

**URL**: https://lovable.dev/projects/7203a855-7cd4-4e82-992d-2cef8e48eef7

## Android Build Flow

### Frisch installieren (Clean Setup)

```sh
# 1. Repository aktualisieren
git fetch origin && git reset --hard origin/main

# 2. Dependencies installieren  
npm ci

# 3. Android Debug Build erstellen und starten
npm run build:android:debug
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

- `npm run build:native` - Native Build mit BUILD_TARGET=native
- `npm run build:android:debug` - Kompletter Android Debug Flow
- `npm run cap:sync` - Capacitor Assets synchronisieren
- `npm run android:install` - APK auf Gerät installieren
- `npm run android:run` - App auf Gerät starten
- `npm run clean:android` - Android Ordner löschen

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