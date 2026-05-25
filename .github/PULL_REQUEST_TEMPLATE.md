<!--
Title: feat(spec-XX): <feature> | fix(spec-XX): <issue> | chore: ...
Keep PRs scoped to one spec file from /docs when possible.
-->

## What
Implements `docs/XX-...md` — <one-line summary>.

## Verification gate
Gate ID from `EXECUTION_PLAN.md` §2 (e.g., G4) and the command + observed output.

```
$ <command>
<output>
```

## Notes
- Decisions, deviations from the spec, or follow-ups.

## Inspector checklist
- [ ] Conventional commit messages
- [ ] No cross-feature imports (`features/X` does not import from `features/Y`)
- [ ] Brand tokens not hardcoded outside `tokens.css`
- [ ] Typecheck + build pass locally
