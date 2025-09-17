# Contributing to Web2App Converter

Thank you for your interest in contributing to Web2App Converter! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 1. Fork the Repository
- Click the "Fork" button on the GitHub repository page
- Clone your fork locally:
```bash
git clone https://github.com/yourusername/web2app-converter.git
cd web2app-converter
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Your Changes
- Make your changes following the coding standards
- Test your changes thoroughly
- Update documentation if needed

### 4. Commit Your Changes
```bash
git add .
git commit -m "Add: brief description of your changes"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```
Then create a Pull Request on GitHub.

## 📋 Development Guidelines

### Code Style
- Use consistent indentation (2 spaces for JS/CSS, 4 spaces for HTML)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions small and focused

### Testing
- Test your changes on different devices/browsers
- Ensure the APK builds successfully
- Test the GitHub Actions workflow

### Documentation
- Update README.md if you add new features
- Add comments to complex code
- Update this CONTRIBUTING.md if needed

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System information (OS, Node.js version, etc.)

## ✨ Feature Requests

For feature requests, please:
- Check existing issues first
- Provide clear use case
- Explain the benefit to users
- Consider implementation complexity

## 📝 Pull Request Guidelines

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] APK builds successfully

### PR Description
Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots if UI changes

## 🏗️ Development Setup

### Prerequisites
- Node.js (v16 or higher)
- Android Studio
- Java JDK 11+

### Setup
```bash
npm install
npm run setup
npm run buildapk
```

## 🧪 Testing

### Local Testing
```bash
# Test the build process
npm run buildapk

# Test development mode
npm run dev

# Test setup script
npm run setup
```

### GitHub Actions Testing
- Push to a feature branch
- Check the Actions tab for build results
- Ensure APK is generated successfully

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Development Guide](https://developer.android.com/guide)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🎯 Areas for Contribution

### High Priority
- [ ] Improve error handling and user feedback
- [ ] Add support for iOS builds
- [ ] Enhance GitHub Actions workflow
- [ ] Add more customization options

### Medium Priority
- [ ] Add PWA features
- [ ] Improve mobile UI/UX
- [ ] Add plugin support
- [ ] Performance optimizations

### Low Priority
- [ ] Add more example templates
- [ ] Improve documentation
- [ ] Add unit tests
- [ ] Code refactoring

## 💬 Community

- Join discussions in GitHub Issues
- Share your projects using Web2App Converter
- Help other users in the community

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to Web2App Converter! 🚀

