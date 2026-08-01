#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$REPO_ROOT/.agent-vendor/mattpocock-skills"
EXPECTED_COMMIT="2ab958093e83e0ec752e6c1c5932da465bf23e0c"
INSTALL_ROOT="${HOME}"
FORCE=0

usage() {
  cat <<'EOF'
Usage: scripts/install-agent-skills.sh [--root PATH] [--force]

Installs every non-deprecated skill from the pinned Matt Pocock skills
submodule into:
  PATH/.agents/skills  (Codex / Agent Skills)
  PATH/.claude/skills  (Claude Code)

PATH defaults to $HOME. Use --root "$PWD" for a project-local install.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --root)
      [ "$#" -ge 2 ] || { echo "error: --root requires a path" >&2; exit 2; }
      INSTALL_ROOT="$2"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

command -v git >/dev/null 2>&1 || { echo "error: git is required" >&2; exit 1; }

if [ ! -e "$SOURCE/.git" ] && [ ! -f "$SOURCE/.git" ]; then
  git -C "$REPO_ROOT" submodule update --init --recursive .agent-vendor/mattpocock-skills
fi

ACTUAL_COMMIT="$(git -C "$SOURCE" rev-parse HEAD)"
if [ "$ACTUAL_COMMIT" != "$EXPECTED_COMMIT" ]; then
  echo "error: unexpected skills commit" >&2
  echo "expected: $EXPECTED_COMMIT" >&2
  echo "actual:   $ACTUAL_COMMIT" >&2
  echo "Update the pinned commit and documentation intentionally before installing." >&2
  exit 1
fi

TMP_DIRS="$(mktemp)"
trap 'rm -f "$TMP_DIRS"' EXIT
find "$SOURCE/skills" -name SKILL.md -not -path '*/deprecated/*' -print \
  | sed 's#/SKILL.md$##' \
  | sort > "$TMP_DIRS"

if [ ! -s "$TMP_DIRS" ]; then
  echo "error: no installable skills found" >&2
  exit 1
fi

install_into() {
  destination="$1"
  manifest="$destination/.matt-pocock-skills-uimposition"
  previous="$(mktemp)"
  names="$(mktemp)"
  trap 'rm -f "$TMP_DIRS" "$previous" "$names"' EXIT

  mkdir -p "$destination"
  if [ -f "$manifest" ]; then
    sed -n '2,$p' "$manifest" > "$previous"
  else
    : > "$previous"
  fi

  while IFS= read -r skill_dir; do
    [ -n "$skill_dir" ] || continue
    basename "$skill_dir" >> "$names"
  done < "$TMP_DIRS"

  while IFS= read -r name; do
    [ -n "$name" ] || continue
    target="$destination/$name"
    if [ -e "$target" ] && ! grep -Fxq "$name" "$previous" && [ "$FORCE" -ne 1 ]; then
      echo "error: unmanaged skill already exists: $target" >&2
      echo "Re-run with --force only if replacing it is intentional." >&2
      exit 1
    fi
  done < "$names"

  while IFS= read -r old_name; do
    [ -n "$old_name" ] || continue
    rm -rf "$destination/$old_name"
  done < "$previous"

  while IFS= read -r skill_dir; do
    [ -n "$skill_dir" ] || continue
    name="$(basename "$skill_dir")"
    rm -rf "$destination/$name"
    cp -R "$skill_dir" "$destination/$name"
  done < "$TMP_DIRS"

  {
    echo "source=$EXPECTED_COMMIT"
    sort -u "$names"
  } > "$manifest"

  count="$(wc -l < "$names" | tr -d ' ')"
  echo "installed $count skills into $destination"

  rm -f "$previous" "$names"
  trap 'rm -f "$TMP_DIRS"' EXIT
}

install_into "$INSTALL_ROOT/.agents/skills"
install_into "$INSTALL_ROOT/.claude/skills"

echo "Matt Pocock skills are installed from pinned commit $EXPECTED_COMMIT."
echo "Restart Codex/Claude Code so the skill index is refreshed."
