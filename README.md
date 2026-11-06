# Cloud AI Interview Prep

A self-contained study site for junior Cloud and AI engineering interviews, covering **Linux**, **Git & GitHub** and **Docker** from the basics to intermediate level. It is plain HTML, CSS and JavaScript with no build step, so it runs from a file, from GitHub Pages, or from any static host.

## Features

- **Concepts with command examples** for each track
- **Searchable command cheat sheets**
- **80 interview questions** (basic, intermediate and scenario) with model answers
- **Hands-on labs** to run on your own Linux machine
- **A 14-week study plan** with weekly tasks you can tick off
- **Flashcard drill** and a **self-graded mock interview**
- **Progress saved locally** in your browser (`localStorage`); nothing is sent anywhere

## Getting started

No install needed.

```bash
git clone https://github.com/bikash9cmd/interview-prep.git
cd interview-prep
open index.html            # macOS; on Linux use xdg-open, on Windows double-click it
```

Or serve it locally, which some browsers prefer for local storage:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

To publish it, enable **GitHub Pages** for the `main` branch (root folder) in the repo settings. The `.nojekyll` file is already there so Pages serves the files as is.

## Project structure

```text
index.html          Page shell, styles and layout
app.js              Rendering, search, flashcards, mock interview, progress
data-linux-*.js     Linux concepts, commands, questions and labs
data-git-*.js       Git & GitHub content
data-docker-*.js    Docker content
data-plan.js        The 14-week study plan
```

## Tech stack

HTML · CSS · vanilla JavaScript · Google Fonts (Archivo, IBM Plex Sans, JetBrains Mono)

## Contributing

Corrections and new questions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Released under the [MIT License](LICENSE).
