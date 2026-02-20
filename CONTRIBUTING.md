# contributing

thanks for wanting to contribute to ats screener. here's everything you need to get started.

## development setup

### prerequisites

- [node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v10+

### getting started

```bash
# clone the repo
git clone https://github.com/sunnypatell/ats-screener.git
cd ats-screener

# install dependencies
pnpm install

# start dev server
pnpm dev
```

### available scripts

| command         | what it does                          |
| --------------- | ------------------------------------- |
| `pnpm dev`      | start development server              |
| `pnpm build`    | build for production                  |
| `pnpm preview`  | preview production build              |
| `pnpm check`    | run svelte-check type checking        |
| `pnpm lint`     | run eslint                            |
| `pnpm format`   | format code with prettier             |
| `pnpm test`     | run unit tests                        |
| `pnpm test:e2e` | run end-to-end tests                  |
| `pnpm validate` | run all checks (types + lint + tests) |

## branching strategy

we use a standard git flow:

- `main` - production, always stable
- `dev` - integration branch, where features merge into
- `feature/*` - individual feature branches off `dev`

### workflow

1. create a feature branch off `dev`: `git checkout -b feature/your-feature dev`
2. make your changes, commit using conventional commits
3. push and open a PR against `dev`
4. once CI passes and review is approved, squash merge into `dev`
5. periodically, `dev` gets merged into `main` as a release

## commit conventions

we use [conventional commits](https://www.conventionalcommits.org):

```
type(scope): description

- bullet points explaining the change
- keep it scannable
```

**types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**rules:**

- lowercase everything (except code references)
- imperative mood ("added feature" not "add feature")
- be descriptive but concise

## code style

- TypeScript strict mode
- svelte 5 runes (`$state`, `$derived`, `$effect`)
- scoped CSS with CSS custom properties (no utility frameworks)
- tabs for indentation
- single quotes

## testing

- **unit tests**: `tests/unit/` - test engine modules (parser, scorer, NLP)
- **component tests**: `tests/component/` - test svelte components
- **e2e tests**: `tests/e2e/` - test full user flows with playwright

write tests for any new engine logic. component tests are encouraged but not strictly required for every UI change.

## pull requests

- keep PRs focused on a single concern
- write a clear description explaining the _why_, not just the _what_
- reference related issues
- make sure CI passes before requesting review
