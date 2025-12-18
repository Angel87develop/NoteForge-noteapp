# Inkdrop

![all-app](https://files.catbox.moe/86qd4y.png)
![settings](https://files.catbox.moe/d30z6j.png)

## Math support for your class!
![math](https://files.catbox.moe/h4lm0o.png)

A beautiful, feature-rich Markdown note-taking desktop application built with Electron, React, and Tailwind CSS 4.1.

![NoteForge](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## Features

### 📝 Markdown Editor
- **Live Preview**: Real-time Markdown rendering with synchronized scrolling
- **Multiple View Modes**: Editor-only, editor with live preview, or preview-only
- **Syntax Highlighting**: Beautiful code syntax highlighting
- **Customizable Appearance**: Adjustable font size, font family, line height, and more
- **Line Numbers**: Optional line numbering for better navigation
- **Active Line Highlighting**: Visual focus on the current line

### 📚 Organization
- **Notebooks**: Organize your notes into custom notebooks
- **Tags**: Tag your notes with custom colors for easy categorization
- **Filtering**: Filter notes by notebook, status, or tags
- **Starred Notes**: Pin important notes for quick access
- **Search**: Quick search functionality to find notes instantly

### ⚙️ Customization
- **Editor Settings**: 
  - Font size and family customization
  - Line height and word wrap options
  - Maximum text width for better readability
  - Line numbers and active line highlighting
- **UI Theme**:
  - Light, dark, and system theme support
  - Window transparency and blur effects (Windows)
  - Customizable border radius
  - Interface density options (compact, normal, comfortable)
  - Animation controls
- **Keyboard Shortcuts**:
  - Customizable keyboard shortcuts
  - Multiple profiles (Default, Vim, Emacs)
  - Import/export shortcut configurations

### 🔧 Advanced Features
- **Auto-save**: Automatic saving with configurable intervals
- **Session Restoration**: Restore your previous session on startup
- **Markdown Dialects**: Support for CommonMark and GitHub Flavored Markdown
- **Extended Markdown**:
  - Tables
  - Task lists
  - Footnotes
  - Math support (KaTeX/LaTeX) - optional
  - Diagrams (Mermaid) - optional
  - Embedded HTML rendering
- **Welcome Note**: Automatic welcome note for new users with Markdown syntax guide

## Installation

### Prerequisites
- Node.js 18+ and Yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/inkdrop.git
cd inkdrop
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

### Building

Build for your platform:
```bash
# Build for Windows
yarn build:win

# Build for macOS
yarn build:mac

# Build for Linux
yarn build:linux

# Build unpacked (for testing)
yarn build:unpack
```

## Usage

### Getting Started

When you first launch Inkdrop, a welcome note will be automatically created with a quick guide to Markdown syntax and the application features.

### Creating Notes

- Click the **+** icon in the top-left of the sidebar to create a new note
- Use `Ctrl+N` (or `Cmd+N` on macOS) as a keyboard shortcut

### Organizing Notes

- **Notebooks**: Create notebooks to group related notes together
- **Tags**: Add tags to notes by clicking the tag icon in the note editor
- **Starring**: Click the star icon to pin important notes

### Markdown Syntax

Inkdrop supports standard Markdown syntax including:

- **Text Formatting**: Bold (`**text**`), italic (`*text*`), strikethrough
- **Headings**: `# H1` through `###### H6`
- **Lists**: Bulleted (`-`) and numbered (`1.`)
- **Links**: `[text](url)`
- **Images**: `![alt](url)`
- **Code**: Inline `` `code` `` and code blocks
- **Blockquotes**: `> quote`
- **Tables**: GitHub Flavored Markdown tables
- **Task Lists**: `- [ ]` and `- [x]`
- **Footnotes**: `[^1]` and `[^1]: note`

### Settings

Access settings by clicking the gear icon in the sidebar. You can configure:

- **Editor Appearance**: Font, size, line height, and visual options
- **Editor Behavior**: View modes, auto-save, and session settings
- **Markdown Options**: Dialect selection and feature toggles
- **UI Theme**: Colors, transparency, and interface density
- **Keyboard Shortcuts**: Customize or import shortcut profiles

## Project Structure

```
inkdrop/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts      # Main entry point
│   │   ├── fileManager.ts # File system operations
│   │   └── mdStorage.ts  # Markdown storage utilities
│   ├── preload/          # Preload scripts
│   └── renderer/         # React application
│       └── src/
│           ├── components/  # React components
│           ├── contexts/     # React contexts
│           ├── types/        # TypeScript types
│           └── utils/        # Utility functions
├── resources/            # App resources
│   ├── icon.png         # App icon
│   └── welcomeNote.md   # Welcome note template
├── build/                # Build resources
└── out/                  # Compiled output
```

## Tech Stack

- **Electron** ^39.2.6 - Cross-platform desktop framework
- **React** ^19.2.1 - UI library
- **TypeScript** ^5.9.3 - Type safety
- **Tailwind CSS** ^4.1.18 - Styling
- **react-markdown** ^10.1.0 - Markdown rendering
- **remark-gfm** ^4.0.1 - GitHub Flavored Markdown support
- **electron-vite** ^5.0.0 - Build tool
- **electron-builder** ^26.0.12 - App packaging

## Data Storage

Notes are stored locally in your Documents folder:
- **Windows**: `%USERPROFILE%\Documents\inkdrop-notes\`
- **macOS**: `~/Documents/inkdrop-notes/`
- **Linux**: `~/Documents/inkdrop-notes/`

Each note is saved as a `.md` file with the format: `{Title}_{NoteID}.md`

## Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build the application
- `yarn typecheck` - Run TypeScript type checking
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier

### Code Style

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [electron-vite](https://github.com/alex8088/electron-vite)
- Icons and UI inspired by modern note-taking applications
- Markdown rendering powered by [react-markdown](https://github.com/remarkjs/react-markdown)

## Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/your-username/inkdrop/issues).

---

Made with ❤️ for note-takers who love Markdown

