# Auto-Merge

Auto-Merge in GitHub pull requests only appears when at least one review or the required status checks are configured and still outstanding. Once all mandatory reviews and checks succeed, the merge will proceed automatically.

## Schnellstart

1. Aktiviere im Repository unter **Settings → Pull Requests → Allow auto-merge** den entsprechenden Schalter (muss einmalig manuell gesetzt werden).
2. Öffne einen Pull Request und klicke auf **Enable auto-merge** oder nutze alternativ `gh pr merge --auto --squash <PR-nummer>`.
