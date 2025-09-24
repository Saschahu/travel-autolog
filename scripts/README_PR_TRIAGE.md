# PR Triage Script Documentation

Das `pr-triage.sh` Skript automatisiert die Verwaltung von Pull Requests mit GitHub CLI (`gh`).

## Voraussetzungen

### GitHub CLI Installation

**Ubuntu/Debian:**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**macOS:**
```bash
brew install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

### Authentifizierung

```bash
# GitHub CLI authentifizieren
gh auth login

# Status prüfen
gh auth status
```

### Berechtigungen

Das Skript benötigt folgende GitHub-Berechtigungen:
- **Repository**: Read/Write access
- **Pull Requests**: Read/Write access
- **Issues**: Read/Write access (für Labels)

## Verwendung

### Basis-Aufrufe

```bash
# Normaler Lauf (führt alle Aktionen aus)
./scripts/pr-triage.sh

# Dry-Run (zeigt nur was gemacht würde)
./scripts/pr-triage.sh --dry-run

# Mit Umgebungsvariable
DRY_RUN=true ./scripts/pr-triage.sh
```

### Optionen

| Option | Beschreibung |
|--------|--------------|
| `-h, --help` | Hilfe anzeigen |
| `-d, --dry-run` | Dry-Run Modus (keine Änderungen) |
| `-r, --repo` | Repository spezifizieren |

### Umgebungsvariablen

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `DRY_RUN` | Dry-Run Modus aktivieren | `false` |
| `GITHUB_REPOSITORY` | Repository überschreiben | Auto-erkennung |

## Funktionen

### 1. Labels erstellen

Das Skript erstellt automatisch folgende Labels:

- **automerge** (grün): Automatisch mergen wenn bereit
- **needs-review** (hellgrün): Braucht Review von Maintainern
- **blocked** (rot): Blockiert aus verschiedenen Gründen
- **conflicts** (rotbraun): Hat Merge-Konflikte
- **breaking-change** (rot): Enthält Breaking Changes

### 2. Bot-PRs finden und labeln

- Findet PRs von Dependabot und Renovate
- Fügt automatisch das `automerge` Label hinzu
- Erkennung über Author-Namen (case-insensitive)

### 3. Automatisches Mergen

- Merged alle PRs mit `automerge` Label
- Bedingungen:
  - PR ist mergeable
  - Alle Status Checks sind erfolgreich
- Verwendet `--squash --delete-branch --auto`

### 4. Konflikt-Erkennung

- Findet PRs mit Merge-Konflikten
- Fügt das `conflicts` Label hinzu
- Basiert auf GitHub's `mergeable` Status

### 5. Stale PR Behandlung

- Findet PRs älter als 90 Tage
- Fügt Kommentar hinzu
- Setzt `blocked` Label
- Überspringt bereits geblockierte PRs

### 6. Summary Report

Zeigt am Ende einen Bericht mit:
- PRs die Review brauchen (mergeable, kein automerge/blocked)
- Statistiken (Total, Open, Automerge, Conflicts, Blocked)

## Dry-Run Beispiele

### Vollständiger Dry-Run

```bash
$ ./scripts/pr-triage.sh --dry-run

[INFO] Starting PR triage for repository: Saschahu/travel-autolog
[WARNING] Running in DRY RUN mode - no changes will be made
[INFO] Checking prerequisites...
[SUCCESS] Prerequisites check passed
[INFO] Creating required labels...
[INFO] Label 'automerge' already exists
[INFO] [DRY RUN] Would execute: gh label create 'needs-review' --color 'd4edda' --description 'Needs review from maintainers'
[INFO] Finding and labeling bot PRs...
[INFO] [DRY RUN] Would execute: gh pr edit '42' --add-label 'automerge'
...
```

### Nur bestimmte Funktionen testen

```bash
# Nur Labels erstellen (dry-run)
DRY_RUN=true ./scripts/pr-triage.sh | grep -A 10 "Creating required labels"

# Nur Bot-PRs finden
DRY_RUN=true ./scripts/pr-triage.sh | grep -A 10 "Finding and labeling bot PRs"
```

## Typische Szenarien

### Daily Maintenance

```bash
# Morgendlicher Triage-Lauf
./scripts/pr-triage.sh

# Logs in Datei speichern
./scripts/pr-triage.sh 2>&1 | tee pr-triage-$(date +%Y%m%d).log
```

### Nach größeren Changes

```bash
# Dry-Run um Auswirkungen zu sehen
./scripts/pr-triage.sh --dry-run

# Dann echter Lauf
./scripts/pr-triage.sh
```

### CI/CD Integration

```yaml
# .github/workflows/pr-triage.yml
name: PR Triage
on:
  schedule:
    - cron: '0 8 * * *'  # Täglich um 8:00 UTC
  workflow_dispatch:

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PR Triage
        run: ./scripts/pr-triage.sh
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Fehlerbehebung

### Häufige Probleme

**GitHub CLI nicht authentifiziert:**
```bash
Error: GitHub CLI is not authenticated
→ Lösung: gh auth login
```

**Keine Berechtigung für Repository:**
```bash
Error: HTTP 403: Forbidden
→ Lösung: Berechtigungen prüfen oder anderen Token verwenden
```

**JSON Parsing Fehler:**
```bash
Error: parse error: Invalid numeric literal
→ Lösung: GitHub CLI updaten (gh --version)
```

### Debug-Modus

```bash
# Verbose Logging
set -x
./scripts/pr-triage.sh --dry-run
set +x

# Nur bestimmte Schritte ausführen (Script modifizieren)
# Kommentiere nicht benötigte Funktionen in main() aus
```

### Manual Testing

```bash
# Einzelne gh-Befehle testen
gh pr list --json number,author,title,labels --jq '.[] | select(.author.login | test("dependabot"; "i"))'

# Labels anzeigen
gh label list

# PR Status prüfen  
gh pr view 123 --json mergeable,statusCheckRollup
```

## Sicherheitshinweise

- **Immer erst mit `--dry-run` testen**
- Script nur in vertrauenswürdigen Repositories verwenden
- Bei CI/CD: Minimale Token-Berechtigungen verwenden
- Logs auf sensitive Daten prüfen vor dem Teilen

## Anpassungen

Das Script kann für spezifische Bedürfnisse angepasst werden:

- **Stale-Tage ändern**: `STALE_DAYS=90` in Zeile 12 modifizieren
- **Zusätzliche Labels**: Labels-Array in `create_labels()` erweitern  
- **Bot-Erkennung**: Regex in `label_bot_prs()` anpassen
- **Merge-Strategie**: `--squash` durch `--merge` oder `--rebase` ersetzen

## Support

Bei Problemen oder Fragen:
1. Dry-Run Modus verwenden um Ursache einzugrenzen
2. GitHub CLI Version prüfen: `gh --version`
3. Repository-Berechtigungen validieren
4. Issue im Repository erstellen mit Script-Output