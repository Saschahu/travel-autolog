#!/bin/bash

# PR Triage Script
# Automates PR management tasks using GitHub CLI

set -euo pipefail

# Configuration
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
DRY_RUN="${DRY_RUN:-false}"
STALE_DAYS=90
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Dry run wrapper
run_command() {
    local cmd="$1"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would execute: $cmd"
    else
        log_info "Executing: $cmd"
        eval "$cmd"
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first."
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Please run 'gh auth login' first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Create required labels
create_labels() {
    log_info "Creating required labels..."
    
    local labels=(
        "automerge:28a745:Automatically merge when ready"
        "needs-review:d4edda:Needs review from maintainers"
        "blocked:d73a4a:Blocked for various reasons"
        "conflicts:ff6b6b:Has merge conflicts"
        "breaking-change:ff0000:Contains breaking changes"
    )
    
    for label_def in "${labels[@]}"; do
        IFS=':' read -r name color description <<< "$label_def"
        
        if gh label list --json name -q ".[].name" | grep -q "^${name}$"; then
            log_info "Label '$name' already exists"
        else
            run_command "gh label create '$name' --color '$color' --description '$description'"
            log_success "Created label: $name"
        fi
    done
}

# Find and label bot PRs
label_bot_prs() {
    log_info "Finding and labeling bot PRs..."
    
    # Get bot PRs using robust gh pr list with JSON output
    local bot_prs
    bot_prs=$(gh pr list \
        --json number,author,title,labels \
        --jq '.[] | select(.author.login | test("dependabot|renovate"; "i")) | .number')
    
    if [[ -z "$bot_prs" ]]; then
        log_info "No bot PRs found"
        return
    fi
    
    while IFS= read -r pr_number; do
        # Check if automerge label already exists
        local has_automerge
        has_automerge=$(gh pr view "$pr_number" --json labels -q '.labels[] | select(.name == "automerge") | .name')
        
        if [[ -z "$has_automerge" ]]; then
            run_command "gh pr edit '$pr_number' --add-label 'automerge'"
            log_success "Added automerge label to PR #$pr_number"
        else
            log_info "PR #$pr_number already has automerge label"
        fi
    done <<< "$bot_prs"
}

# Auto-merge automerge PRs
auto_merge_prs() {
    log_info "Auto-merging PRs with automerge label..."
    
    # Get mergeable PRs with automerge label
    local automerge_prs
    automerge_prs=$(gh pr list \
        --json number,mergeable,labels,statusCheckRollup \
        --jq '.[] | select(.labels[]?.name == "automerge") | select(.mergeable == "MERGEABLE") | select(.statusCheckRollup // [] | map(.conclusion) | all(. == "SUCCESS" or . == "NEUTRAL" or . == "SKIPPED")) | .number')
    
    if [[ -z "$automerge_prs" ]]; then
        log_info "No mergeable automerge PRs found"
        return
    fi
    
    while IFS= read -r pr_number; do
        run_command "gh pr merge '$pr_number' --squash --delete-branch --auto"
        log_success "Auto-merged PR #$pr_number"
    done <<< "$automerge_prs"
}

# Find and label PRs with conflicts
label_conflict_prs() {
    log_info "Finding and labeling PRs with conflicts..."
    
    # Get PRs with conflicts
    local conflict_prs
    conflict_prs=$(gh pr list \
        --json number,mergeable,labels \
        --jq '.[] | select(.mergeable == "CONFLICTING") | .number')
    
    if [[ -z "$conflict_prs" ]]; then
        log_info "No PRs with conflicts found"
        return
    fi
    
    while IFS= read -r pr_number; do
        # Check if conflicts label already exists
        local has_conflicts
        has_conflicts=$(gh pr view "$pr_number" --json labels -q '.labels[] | select(.name == "conflicts") | .name')
        
        if [[ -z "$has_conflicts" ]]; then
            run_command "gh pr edit '$pr_number' --add-label 'conflicts'"
            log_success "Added conflicts label to PR #$pr_number"
        else
            log_info "PR #$pr_number already has conflicts label"
        fi
    done <<< "$conflict_prs"
}

# Handle stale PRs
handle_stale_prs() {
    log_info "Finding and handling stale PRs (older than $STALE_DAYS days)..."
    
    local stale_date
    stale_date=$(date -d "$STALE_DAYS days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Get stale PRs
    local stale_prs
    stale_prs=$(gh pr list \
        --json number,createdAt,labels,title \
        --jq --arg stale_date "$stale_date" \
        '.[] | select(.createdAt < $stale_date) | select(.labels[]?.name != "blocked") | .number')
    
    if [[ -z "$stale_prs" ]]; then
        log_info "No stale PRs found"
        return
    fi
    
    while IFS= read -r pr_number; do
        # Add stale comment
        local stale_comment="This PR has been open for more than $STALE_DAYS days and may be stale. Please review and update if needed, or close if no longer relevant."
        
        run_command "gh pr comment '$pr_number' --body '$stale_comment'"
        run_command "gh pr edit '$pr_number' --add-label 'blocked'"
        log_success "Marked PR #$pr_number as stale and blocked"
    done <<< "$stale_prs"
}

# Generate summary report
generate_summary() {
    log_info "Generating PR summary report..."
    
    echo ""
    echo "=== PR TRIAGE SUMMARY ==="
    echo ""
    
    # PRs needing review (open, mergeable, no automerge, no blocked)
    local review_prs
    review_prs=$(gh pr list \
        --json number,title,author,mergeable,labels,statusCheckRollup,updatedAt \
        --jq '.[] | select(.mergeable == "MERGEABLE") | select(.labels[]?.name != "automerge") | select(.labels[]?.name != "blocked") | select(.statusCheckRollup // [] | map(.conclusion) | all(. == "SUCCESS" or . == "NEUTRAL" or . == "SKIPPED")) | {number, title, author: .author.login, updatedAt}')
    
    if [[ -n "$review_prs" ]]; then
        echo "📋 PRs Ready for Review:"
        echo "$review_prs" | jq -r '"#\(.number) - \(.title) (@\(.author)) - Updated: \(.updatedAt | fromdateiso8601 | strftime("%Y-%m-%d"))"'
        echo ""
    else
        echo "✅ No PRs currently need review"
        echo ""
    fi
    
    # Statistics
    local total_prs open_prs automerge_prs conflict_prs blocked_prs
    total_prs=$(gh pr list --json number | jq length)
    open_prs=$(gh pr list --state open --json number | jq length)
    automerge_prs=$(gh pr list --json labels --jq '.[] | select(.labels[]?.name == "automerge")' | jq -s length)
    conflict_prs=$(gh pr list --json labels --jq '.[] | select(.labels[]?.name == "conflicts")' | jq -s length)
    blocked_prs=$(gh pr list --json labels --jq '.[] | select(.labels[]?.name == "blocked")' | jq -s length)
    
    echo "📊 Statistics:"
    echo "  Total PRs: $total_prs"
    echo "  Open PRs: $open_prs"
    echo "  Automerge PRs: $automerge_prs"
    echo "  Conflict PRs: $conflict_prs"
    echo "  Blocked PRs: $blocked_prs"
    echo ""
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

PR Triage Script - Automates PR management tasks

OPTIONS:
    -h, --help      Show this help message
    -d, --dry-run   Run in dry-run mode (show what would be done)
    -r, --repo      Specify repository (default: auto-detect)

ENVIRONMENT VARIABLES:
    DRY_RUN=true           Enable dry-run mode
    GITHUB_REPOSITORY      Override repository detection

EXAMPLES:
    # Run normally
    $0
    
    # Dry run to see what would happen
    $0 --dry-run
    
    # Dry run with environment variable
    DRY_RUN=true $0

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -r|--repo)
            REPO="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log_info "Starting PR triage for repository: $REPO"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "Running in DRY RUN mode - no changes will be made"
    fi
    
    check_prerequisites
    create_labels
    label_bot_prs
    auto_merge_prs
    label_conflict_prs
    handle_stale_prs
    generate_summary
    
    log_success "PR triage completed successfully!"
}

# Run main function
main "$@"