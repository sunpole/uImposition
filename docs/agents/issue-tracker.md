# Issue tracker: GitHub

Issues, specifications and investigation tickets for uImposition live in `sunpole/uImposition` GitHub Issues.

## Rules

- GitHub is the only source of truth for issue state.
- Prefer the connected GitHub app when it is available; use `gh` from a checked-out repository as the CLI fallback.
- Read the issue body, labels and all relevant comments before changing its state.
- A specification produced by `to-spec` is published as a GitHub issue unless the owner explicitly requests a repository document instead.
- A ticket produced by `to-tickets` is a GitHub issue and should declare blocking relationships.
- Pull requests are not a general feature-request surface.
- A bare `#42` can identify either an issue or a pull request; resolve the object type before acting.

## Common CLI fallback

```bash
gh issue view <number> --comments
gh issue create --title "..." --body-file <file>
gh issue comment <number> --body-file <file>
gh issue edit <number> --add-label "..."
gh issue close <number> --comment "..."
```

## Wayfinder

- The map is one GitHub issue labelled `wayfinder:map`.
- Child work is represented by GitHub sub-issues when available.
- Blocking is represented by native issue dependencies when available.
- Text task lists and `Blocked by: #<n>` are fallback representations only.
- An agent claims a ready child ticket before its first write.
