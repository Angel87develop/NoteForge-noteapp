# NoteForge

<p align="center">
  <img src="https://files.catbox.moe/86qd4y.png" alt="NoteForge Main Interface">
</p>

<p align="center">
A modern Markdown note-taking application built with Electron, React and Tailwind CSS.
</p>

<p align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-lightgrey)

</p>

---

## Overview

NoteForge is a desktop Markdown editor focused on speed, organization and customization. It combines a clean writing experience with powerful editing capabilities, notebook management and an interface designed for daily use.

---

## Preview

### Main Workspace

![Workspace](https://files.catbox.moe/86qd4y.png)

### Settings

![Settings](https://files.catbox.moe/d30z6j.png)

### Mathematical Expressions

KaTeX support allows rendering mathematical notation directly inside your notes.

![Math](https://files.catbox.moe/ae7kg0.png)

---

# Features

## Markdown Editor

- Live preview with synchronized scrolling
- Multiple editor layouts
- Syntax highlighting
- Line numbers
- Active line highlighting
- Adjustable typography
- Word wrap options
- Configurable editor width

---

## Organization

- Notebook management
- Colored tags
- Instant search
- Favorites
- Advanced filtering

---

## Markdown Support

Supports both CommonMark and GitHub Flavored Markdown.

Available extensions include:

- Tables
- Task Lists
- Footnotes
- KaTeX / LaTeX
- Mermaid diagrams
- Embedded HTML

---

## Customization

Configure nearly every aspect of the editor.

### Editor

- Fonts
- Font size
- Line height
- Maximum text width
- View modes
- Auto-save
- Session restoration

### Interface

- Light theme
- Dark theme
- System theme
- Blur effects (Windows)
- Adjustable border radius
- Interface density
- Animation controls

### Keyboard Shortcuts

- Fully customizable shortcuts
- Default profile
- Vim profile
- Emacs profile
- Import / Export configurations

---

## Additional Features

- Automatic welcome note
- Session persistence
- Local Markdown storage
- Fast file indexing
- Cross-platform support

---

# Installation

## Requirements

- Node.js 18+
- Yarn

Clone the repository:

```bash
git clone https://github.com/Angel87develop/NoteForge.git
cd NoteForge
```

Install dependencies:

```bash
yarn install
```

Run the development version:

```bash
yarn dev
```

---

# Building

Build for your operating system.

```bash
yarn build:win
```

```bash
yarn build:mac
```

```bash
yarn build:linux
```

Unpacked build:

```bash
yarn build:unpack
```

---

# Project Structure

```text
NoteForge
├── src
│   ├── main
│   ├── preload
│   └── renderer
│       ├── components
│       ├── contexts
│       ├── types
│       └── utils
│
├── resources
├── build
└── out
```

---

# Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron | Desktop application |
| React | User Interface |
| TypeScript | Static typing |
| Tailwind CSS | Styling |
| React Markdown | Markdown rendering |
| Remark GFM | GitHub Flavored Markdown |
| Electron Vite | Development tooling |
| Electron Builder | Application packaging |

---

# Local Storage

Notes are stored locally inside the user's **Documents** folder.

```
Windows
%USERPROFILE%/Documents/noteforge-notes
```

```
macOS
~/Documents/noteforge-notes
```

```
Linux
~/Documents/noteforge-notes
```

Each note is saved as an individual Markdown file.

```
Title_NoteID.md
```

---

# Available Scripts

```bash
yarn dev
```

Runs the application in development mode.

```bash
yarn build
```

Builds the application.

```bash
yarn typecheck
```

Runs TypeScript checks.

```bash
yarn lint
```

Runs ESLint.

```bash
yarn format
```

Formats the project using Prettier.

---

# Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push the branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# License

This project is licensed under the MIT License.

See the **LICENSE** file for more information.

---

# Credits

- electron-vite
- React Markdown
- Tailwind CSS
- Electron

---

# Support

Bug reports, feature requests and questions can be submitted through the GitHub Issues page.

https://github.com/Angel87develop/NoteForge/issues

