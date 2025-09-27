#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required but not installed." >&2
  exit 1
fi

repo_full_name=$(gh repo view --json nameWithOwner -q .nameWithOwner)
default_branch=$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)

owner=${repo_full_name%%/*}
repo=${repo_full_name##*/}

payload=$(cat <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {"context": "lint"},
      {"context": "test"}
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
)

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/${owner}/${repo}/branches/${default_branch}/protection" \
  --input - <<<"${payload}"

echo "Branch protection enabled for ${repo_full_name} on ${default_branch}."
