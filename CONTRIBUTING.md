# Contributing to PatchCanvas

First off, thank you for considering contributing to PatchCanvas! 🎉

It's people like you that make PatchCanvas such a great tool. We welcome contributions from everyone, whether you're fixing a typo, adding a feature, or improving documentation.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to providing a welcoming and inspiring community for all. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Be patient and welcoming
- Be collaborative
- Be mindful of your words and actions
- Gracefully accept constructive criticism

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git
- A GitHub account
- A Clerk account (for authentication testing)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/patchcanvas.git
   cd patchcanvas
   ```

3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/originalowner/patchcanvas.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Clerk credentials
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

7. **Run tests** to make sure everything works:
   ```bash
   npm test
   ```

## 🤔 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, browser, Node version)

[Report a bug →](https://github.com/yourusername/patchcanvas/issues/new?labels=bug)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternatives** you've considered

[Request a feature →](https://github.com/yourusername/patchcanvas/issues/new?labels=enhancement)

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Improvements to docs

### Pull Requests

We actively welcome your pull requests! Here's how:

1. Fork the repo and create your branch from `main`
2. Make your changes
3. Add tests if applicable
4. Ensure the test suite passes
5. Update documentation as needed
6. Submit your pull request!

## 🔄 Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-dark-mode`
- `fix/login-redirect-bug`
- `docs/update-readme`
- `refactor/simplify-api-calls`

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

3. **Keep your branch up to date**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

### Running Tests

Always run tests before submitting a PR:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

### Testing Your Changes

- Test your changes in both light and dark modes
- Test on different screen sizes (mobile, tablet, desktop)
- Test with different repositories (public and private)
- Verify authentication flows work correctly

## 🎨 Style Guidelines

### Code Style

We use ESLint and TypeScript to maintain code quality:

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic

### TypeScript Guidelines

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUserById(id: string): Promise<User> {
  // Implementation
}

// ❌ Avoid
function getUser(x: any): any {
  // Implementation
}
```

### React Component Guidelines

```typescript
// ✅ Good - Functional component with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ❌ Avoid - No types, unclear props
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### CSS/Tailwind Guidelines

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Use CSS variables for theme colors
- Keep custom CSS minimal

## 📝 Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add GitHub OAuth support

fix(dashboard): resolve repository loading issue

docs(readme): update installation instructions

refactor(api): simplify GitHub API client

test(hooks): add tests for useRepo hook
```

## 🔍 Pull Request Process

1. **Update documentation** if you're changing functionality
2. **Add tests** for new features
3. **Ensure all tests pass** (`npm test`)
4. **Update the README.md** if needed
5. **Link related issues** in your PR description
6. **Request review** from maintainers
7. **Address feedback** promptly and professionally

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No console.log or debugging code
- [ ] Branch is up to date with main

### PR Template

When opening a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

## 🏗️ Project Structure

Understanding the codebase:

```
src/
├── app/              # Next.js pages and API routes
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   ├── layout/      # Layout components
│   └── repo/        # Repository-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
└── stores/          # State management
```

## 🧪 Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders with correct label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button label="Click" onClick={handleClick} />);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- Test edge cases and error conditions
- Test user interactions
- Test accessibility

## 💬 Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/yourusername/patchcanvas/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/yourusername/patchcanvas/issues) - Report bugs
- 📧 Email: hello@patchcanvas.dev

### Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Project documentation

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)

## 🎉 Thank You!

Your contributions make PatchCanvas better for everyone. We appreciate your time and effort!

---

**Questions?** Feel free to reach out by opening an issue or starting a discussion.

**Happy coding!** 🚀
