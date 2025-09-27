#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed or not available in PATH." >&2
  exit 1
fi

default_branch=$(gh repo view --json defaultBranchRef -q '.defaultBranchRef.name')
if [[ -z "${default_branch}" ]]; then
  echo "Error: Could not determine default branch." >&2
  exit 1
fi

name_with_owner=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
if [[ -z "${name_with_owner}" ]]; then
  echo "Error: Could not determine repository owner/name." >&2
  exit 1
fi

owner=${name_with_owner%%/*}
repo=${name_with_owner##*/}

payload=$(cat <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["lint", "test"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "block_creations": false,
  "lock_branch": false
}
JSON
)

printf '%s\n' "${payload}" | gh api \
  --method PUT \
  "repos/${owner}/${repo}/branches/${default_branch}/protection" \
  --header "Accept: application/vnd.github+json" \
  --input -

echo "Branch protection successfully configured for '${default_branch}' on ${name_with_owner}."
