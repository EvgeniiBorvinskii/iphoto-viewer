# Contributing to iPhoto Viewer

First off, thank you for considering contributing to iPhoto Viewer! 🎉

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates.

When creating a bug report, include:
- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:
- **Clear title and description**
- **Use case** explaining why this would be useful
- **Possible implementation** (if you have ideas)

### Pull Requests

1. **Fork the repo** and create your branch from `master`
2. **Install dependencies**: `npm install`
3. **Make your changes**
4. **Test your changes**: Ensure the app builds and runs
5. **Follow the coding style**: Use ESLint and Prettier
6. **Commit your changes**: Use clear commit messages
7. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Keep changes focused on a single feature/fix
- Update documentation if needed
- Add/update tests if applicable
- Follow the existing code style
- Write clear commit messages

## Development Setup

```powershell
# Clone your fork
git clone https://github.com/YOUR_USERNAME/iphoto-viewer.git
cd iphoto-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

## Coding Style

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable/function names
- Add comments for complex logic

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: add/update tests
chore: maintenance tasks
```

## Project Structure

```
iphoto-viewer/
├── electron/       # Electron main process
├── src/            # React application
│   ├── components/ # UI components
│   ├── contexts/   # React contexts
│   └── ...
├── package.json
└── README.md
```

## Questions?

Feel free to open an issue with your question!

Thank you for contributing! 🚀
