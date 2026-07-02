# Contributing to AskTheOracle

Thanks for your interest! This is a small, focused project — contributions are welcome but please read this first.

## Quick Rules

1. **Before coding** — open an issue to discuss what you want to change
2. **Keep it simple** — this is a zero-dependency static site, no frameworks
3. **One thing per PR** — don't bundle unrelated changes
4. **Test manually** — open `index.html` in at least 2 browsers before submitting

## Development

```bash
# Just open the file — no build step
open index.html

# Or serve locally
python -m http.server 8080
```

## Code Style

- Plain JavaScript (ES5+), no transpilation
- Chinese comments are fine
- Follow existing patterns in `js/app.js`

## Project Architecture

```
js/
├── gua-data.js      # 64 hexagram data (GUA_DATA array + GUA_BY_BINARY index)
├── stroke-data.js   # Chinese character stroke lookup
├── app.js           # Main logic (modes, casting, rendering)
└── animation.js     # CSS animation helpers
```

## License

By contributing, you agree that your code will be licensed under the AGPL v3.0.
