# ChatGPT Test Webpage

This repository hosts a small GitHub Pages site that links to a few minimal web projects.
View the site live at https://tleety.github.io/Chatgpt-Test-webpage/.

## Projects

- **Simple Jekyll Project** – Markdown rendered using Jekyll.
- **Simple Phaser Game** – Phaser 3 example with a bouncing logo.
- **Go WASM Game** – Tiny Go WebAssembly demo that moves a square with the arrow keys.

## Running locally

1. **Open the landing page**
   ```
   open index.html
   ```
   This lets you click through to each project.

2. **Run the Jekyll site**
   ```
   cd jekyll-site
   jekyll serve
   ```
   Requires a Ruby environment with Jekyll installed.

3. **Run the Phaser demo**
   ```
   open phaser-game/index.html
   ```
   It loads Phaser from a CDN, so no build step is necessary.

4. **Build the Go WASM demo**
   ```
   cd go-wasm-game
   GOOS=js GOARCH=wasm go build -o game.wasm
   ```
   After building, serve the folder with any static web server and open `index.html` in a browser.

## Testing

Unit tests are available for the Snake game logic:

```bash
# Install test dependencies
npm install

# Run tests
npm test
```

See [TESTING.md](TESTING.md) for detailed information about the test suite.

## License

The Go runtime file `wasm_exec.js` is licensed under the BSD-style license from the Go authors.
