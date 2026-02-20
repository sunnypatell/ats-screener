# Contributing

Thanks for wanting to contribute to ATS Screener. Here's everything you need to get started.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v10+

### Getting Started

```bash
# Clone the repo
git clone https://github.com/sunnypatell/ats-screener.git
cd ats-screener

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

### Available Scripts

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `pnpm dev`      | Start development server              |
| `pnpm build`    | Build for production                  |
| `pnpm preview`  | Preview production build              |
| `pnpm check`    | Run svelte-check type checking        |
| `pnpm lint`     | Run ESLint                            |
| `pnpm format`   | Format code with Prettier             |
| `pnpm test`     | Run unit tests (106 tests)            |
| `pnpm test:e2e` | Run end-to-end tests with Playwright  |
| `pnpm validate` | Run all checks (types + lint + tests) |

## Architecture Overview

```
src/lib/engine/          # Core logic (no UI dependencies)
├── parser/              # PDF/DOCX text extraction, section detection
├── scorer/              # Scoring engine + 6 ATS profiles
│   └── profiles/        # Workday, Taleo, iCIMS, Greenhouse, Lever, SAP
├── nlp/                 # Tokenizer, TF-IDF, synonyms, skills taxonomy
├── llm/                 # LLM client, prompts, fallback
└── job-parser/          # Job description requirement extraction
```

The engine is fully decoupled from the UI. All scoring logic is pure TypeScript functions with no framework dependencies. This makes it easy to test and reason about.

## Branching Strategy

For early development, I push directly to `main`. As the project matures:

- `main` - production, always stable
- `dev` - integration branch for feature merges
- `feature/*` - individual feature branches off `dev`

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org):

```
type(scope): description

- bullet points explaining the change
- keep it scannable
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Rules:**

- lowercase everything (except code references)
- imperative mood ("added feature" not "add feature")
- be descriptive but concise
- reference commit SHAs when relevant

## Code Style

- TypeScript strict mode
- Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- Scoped CSS with CSS custom properties (no utility frameworks)
- Tabs for indentation, single quotes
- Brief inline `//` comments where logic isn't obvious (no JSDoc blocks)

## Testing

- **Unit tests**: `tests/unit/` - engine modules (parser, scorer, NLP, job-parser)
- **Integration tests**: `tests/unit/integration/` - full pipeline tests
- **Component tests**: `tests/component/` - Svelte component tests
- **E2E tests**: `tests/e2e/` - full user flows with Playwright

Write tests for any new engine logic. Run `pnpm test` before pushing.

## Pull Requests

- Keep PRs focused on a single concern
- Write a clear description explaining the _why_, not just the _what_
- Reference related issues and commits
- Make sure the build passes before requesting review
