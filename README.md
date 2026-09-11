# gh-label-action

Add or remove labels on a pull request or issue based on a `condition` input.

Unlike [buildsville/add-remove-label](https://github.com/buildsville/add-remove-label), there is no `type: add|remove`. Pass a boolean-like condition instead: truthy values add the labels, everything else removes them.

## Inputs

| Input | Required | Description |
| --- | --- | --- |
| `labels` | yes | Comma-separated label names |
| `condition` | yes | `true` / `True` / `1` → add; otherwise remove |
| `token` | no | Defaults to `${{ github.token }}` |

## Permissions

The workflow needs write access to pull requests and/or issues:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

## Example

This repository uses the action on its own pull requests via `uses: ./`
(see [`.github/workflows/label.yml`](.github/workflows/label.yml)).

In another repository:

```yaml
name: Label

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            docs:
              - 'docs/**'

      - name: docs label
        uses: Doomsta/gh-label-action@v1
        with:
          labels: docs
          condition: ${{ steps.changes.outputs.docs == 'true' }}
```

No `token` input is required when using the default `GITHUB_TOKEN`.

## Development

```bash
npm install
npm run build
```

The Action entrypoint is the bundled `dist/index.js` (built with `@vercel/ncc`).
