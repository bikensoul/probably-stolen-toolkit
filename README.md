# Probably Stolen Toolkit

Unofficial fan-made helper tools for the game *Probably Stolen*: water mixing, plasma cartridge appraisal, chemistry recipes and the Mirage Projector.

Live site: https://bikensoul.github.io/probably-stolen-toolkit/

## Structure

```
index.html          page shell: header, tab bar, footer
css/base.css        shared styles (colours, layout, phones)
css/<tool>.css      styles for one tool
tools/<tool>.html   markup for one tool
js/common.js        shared code: tab switching, remembered inputs, pour breakdown, % limits
js/<tool>.js        logic for one tool (registers Toolkit.tools.<tool>)
img/                pictures used by the tools
```

Tools: `home` (landing page), `water`, `appraiser` (holds the items `plasma`, `hands` and `ribwich`, each with its own js file), `chemist`, `projector`.

Without a `#tool` in the address, the site opens the tool used last, or Home on a first visit.

### Adding a tool

1. Create `tools/<name>.html` with `<div class="tab" id="<name>"> … </div>`.
2. Create `css/<name>.css` and `js/<name>.js` (`Toolkit.tools.<name> = () => { … };`).
3. Add `<name>` to `TOOLS` in `js/common.js`, a link in the nav and the `<link>`/`<script>` tags in `index.html`.

Inputs with an `id` are remembered in the visitor's browser automatically. Wrap markup in `data-nosave` to opt out.

### Releasing an update

Change the version in `index.html` (the `toolkit-version` meta tag and every `?v=` on the css/js links) so browsers don't keep using cached files.

### Running locally

The tools are loaded with `fetch`, so open the site through a local web server rather than as a file, e.g. `python3 -m http.server` in this folder, then http://localhost:8000.
