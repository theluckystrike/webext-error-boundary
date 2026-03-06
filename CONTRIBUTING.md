# Contributing to webext-error-boundary

Thank you for your interest in contributing. This guide covers how to report issues and develop this project.

## REPORTING ISSUES

When reporting bugs or requesting features, please use the GitHub issue templates. Include the following:

- A clear description of the issue or feature request
- Steps to reproduce (for bugs)
- Your environment details (browser, extension manifest version)
- Any relevant code samples or error messages

Before submitting, search existing issues to avoid duplicates.

## DEVELOPMENT WORKFLOW

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch from main
4. Make your changes
5. Test your changes
6. Commit with clear, descriptive messages
7. Push to your fork and submit a pull request

## CODE STYLE

This project follows these conventions:

- TypeScript with strict mode enabled
- Use functional methods and clear variable names
- Add JSDoc comments for public APIs
- Keep lines under 100 characters when practical
- Use 4 spaces for indentation

Run the build before committing:

```bash
npm run build
```

## TESTING

Before submitting changes, verify the TypeScript compiles without errors:

```bash
npm run build
```

There are no runtime tests in this project. Manual testing in a Chrome extension environment is recommended for UI-related changes.

## LICENSE

By contributing, you agree that your contributions will be licensed under the MIT License.
