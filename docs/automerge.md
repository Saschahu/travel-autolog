## Auto-Merge Übersicht

Der Button **Enable auto-merge** erscheint, sobald alle erforderlichen Status-Checks erfolgreich sind, mindestens eine verpflichtende Review vorliegt und der Pull Request aufgrund der Branch-Protection noch nicht direkt gemergt werden darf.

### CLI-Schnellanleitung
```
gh pr merge --auto --squash <PR-nummer>
```

### Two-tier testing

Für stabile Auto-Merges bleibt der required Check **test** aktiv und führt nur die Smoke-Tests (`pnpm test`, intern `pnpm test:smoke`) aus. Der optionale Job **test-full** startet parallel die vollständige Vitest-Suite (`pnpm test:full`) zur Beobachtung. Die Branch-Protection soll weiterhin nur die Checks **lint** und **test** als Pflicht voraussetzen.
