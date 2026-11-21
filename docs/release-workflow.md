# Release workflow

The public baseline is `@advanced-data-grid/react-data-grid@0.1.1` and tag `v0.1.1`. Only the library is released to npm. The root and Playground are private, and the English and Korean docs build with Playground.

## CI

`CI` runs for PRs targeting `main`, pushes to `main`, and manual dispatches. `Release` also calls the same workflow on the approved commit. The jobs use GitHub-hosted Ubuntu 24.04, Node 24.19.0 (bundled npm 11.17.0), pnpm 10.32.1 from `packageManager`, and `pnpm install --frozen-lockfile`.

| Job                                               | Checks                                                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `static-checks`                                   | `pnpm typecheck` (strict), `pnpm lint`, `pnpm format:check`                                                                                                                                        |
| `unit-tests`                                      | `pnpm test`                                                                                                                                                                                        |
| `build`                                           | `pnpm build` builds the library, Playground, and docs. `node scripts/check-package.mjs` runs `npm pack --dry-run` and checks the published JS, CSS, declaration files, and package metadata files. |
| `e2e (chromium)`, `e2e (firefox)`, `e2e (webkit)` | `pnpm test:e2e --project=<browser> --reporter=line,html` after installing the browser and Ubuntu dependencies                                                                                      |

Open the failed job log and download its `playwright-failure-<browser>` artifact for the HTML report, screenshots and traces when Playwright produced them. Artifacts expire after seven days. Edge remains an opt-in local project via `ADG_E2E_EDGE=1`. The existing Firefox axe skips apply on Windows because evaluation can crash the browser. The performance suite remains opt-in via `ADG_PERF=1`. The [WebKit regression report](webkit-editing-regression.md) records the prior fix and reproduction command.

CI runs with read-only contents access. Workflows pin external actions to full commit SHAs. Release jobs use fresh installs without dependency caches, and the OIDC job publishes the tarball from its own workflow run without a workspace dependency install.

## Changesets and version review

1. Run `pnpm changeset` for a user-facing library change and commit the generated Markdown file with the PR. Reviewers check that it names `@advanced-data-grid/react-data-grid` and describes the impact. Docs-only, Playground-only, and internal tool changes can ship without a Changeset.
2. Choose `patch` for a fix (for example, 0.1.1 to 0.1.2) or `minor` for a compatible feature (0.1.1 to 0.2.0). During 0.x, a breaking change also uses an explicitly reviewed minor bump, with migration instructions in the Changeset. Use `major` for an intentional 1.0 release and for breaking changes after 1.0.
3. On `main`, `Version PR` checks the registry and runs the official Changesets version action when the workspace matches npm `latest`. It maintains one version PR, running `pnpm version:packages` to consume Changesets, update the package manifest and [changelog](../packages/react-data-grid/CHANGELOG.md), and synchronize the lockfile.
4. Review the version PR, approve its Actions runs if prompted, and merge after the same CI checks pass. If Changesets accumulated while a previous version was awaiting publication, a successful `Release` run lets `Version PR` pick them up. Manual dispatch from `main` is also available.

For a local simulation, use a disposable checkout. Add a test patch, run `pnpm changeset status` and `pnpm version:packages`, then verify the manifest, package changelog, lockfile and unchanged Playground manifest. Delete the disposable checkout afterward.

## Activate on GitHub and npm

1. With maintainer approval, push these changes through a PR and confirm the checks on the PR and on `main`. Under **Settings → Actions → General**, enable **Allow GitHub Actions to create and approve pull requests**. The repository token creates and updates the PR. GitHub can hold the resulting CI runs for manual approval. Approve the runs in the PR's Checks view and wait for them to finish. [GitHub token behavior](https://docs.github.com/en/actions/concepts/security/github_token)
2. Protect `main` with a ruleset or branch protection. Require PRs and the six CI checks listed above, and block force pushes. Select check names from actual PR runs. Keep the version PR subject to the same checks. Strict up-to-date checks can be enabled if they fit the maintainer workflow.
3. Create the GitHub Environment `npm`, restrict deployment branches to `main`, and enable required reviewers if available. Explicit dispatch by a maintainer is the baseline approval. If a second reviewer is available, enable prevention of self-review. [GitHub deployment environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
4. The npm package owner opens the package settings and adds a GitHub Actions Trusted Publisher. Set owner `tuesdayy96`, repository `advanced-data-grid`, workflow filename `release.yml`, environment `npm`, and enable **npm publish** in Allowed Actions. Trusted Publishing requires at least Node 22.14.0 and npm 11.5.1. The publish job logs both versions and enforces the npm minimum. Its permissions are `contents: read` and `id-token: write`. [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)

## Publish an approved version

1. In **Actions → Release → Run workflow**, select `main` and enter the exact merged library version. Approve the `npm` environment deployment if required. Merging the version PR alone does not trigger publishing.
2. The workflow confirms the version matches the manifest, has a changelog entry, exceeds npm `latest`, and has no published registry version or remote tag. After CI passes, it builds and verifies the tarball. The publish job uses npm OIDC and checks registry integrity before the GitHub Release job runs.
3. GitHub Release creates `v<version>` on the dispatch commit and uses the matching changelog section, with links to npm, Playground, and both docs languages. Verify the release and tag on GitHub and run:

   ```sh
   npm view @advanced-data-grid/react-data-grid@<version> version dist.integrity
   ```

## Troubleshooting and recovery

- **CI fails** — Re-run the failing command locally with the frozen lockfile. For Playwright, use the browser named in the failed job and inspect the trace and screenshot. Keep the checks required.
- **No Version PR** — Confirm the intended Changeset is on `main`, the workspace matches npm `latest`, and Actions can write contents and create PRs. A version pending manual publication intentionally holds later bumps. Dispatch `Version PR` once publication is verified.
- **OIDC or npm fails** — Check the npm publisher owner/repository, exact workflow filename, environment, Allowed Actions and runtime versions. Check the package revision and registry before retrying. Use the failed run's **Re-run failed jobs** action after addressing the cause. A network or auth error fails the workflow. A matching tarball already visible on npm is verified without another publish.
- **npm succeeded but GitHub Release failed** — Re-run the failed jobs on the original run, keeping the original approved commit and artifact. The release job reuses a tag pointing to that commit and skips an existing release. Resolve a conflicting tag or a repository rule blocking tag creation with the maintainer before retrying. If artifacts expired, verify npm integrity and provenance against the original approved commit and create the missing GitHub Release on that commit through the maintainer account using its changelog section. A fresh dispatch for a published version stops in preflight.

## Vercel

Vercel uses its GitHub integration for production from `main` and PR previews. Verify the connected repository, production branch and preview deployments in the Vercel dashboard when activating Phase 9. Keep Root Directory `apps/playground`, external workspace sources enabled, Node 24.x, and automatic pnpm installation. The app has a `workspace:*` dependency on the library, which is built before Vite. The output is `dist` and requests under `/docs` rewrite to `index.html`. Test direct entry and refresh on Playground and English/Korean docs in both environments. Vercel's workspace graph can skip unaffected projects. [Repository configuration](../apps/playground/vercel.json) · [Vercel monorepos](https://vercel.com/docs/monorepos)
