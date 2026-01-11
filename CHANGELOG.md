# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-01-09

### Added
- Initial release of Azure Workflow Actions library
- `deploy-azure-function` action for deploying Azure Functions
- `deploy-spring-api` action for deploying Spring Boot APIs
- `create-release` action for automatic GitHub releases
- `notify-deployment` action for Teams and Slack notifications
- `setup-azure-credentials` action for Azure authentication
- `run-tests` action for running Node.js and Java tests
- Reusable workflow `deploy-function.yml` for complete Function deployment
- Reusable workflow `deploy-spring-api.yml` for complete API deployment
- Reusable workflow `promote-to-release.yml` for release creation
- Support for multiple environments (dev, staging, prod)
- Support for deployment slots
- Automatic release creation on successful deployments
- Comprehensive documentation (README, USAGE, EXAMPLES)
- Example workflows for common scenarios
- Configuration templates for environments and notifications

### Features
- ✅ Multi-environment support (dev, staging, production)
- ✅ Configurable deployment steps per environment
- ✅ Automatic release creation after successful deploys
- ✅ Notifications via Microsoft Teams and Slack
- ✅ Support for Azure Functions (Node.js)
- ✅ Support for Spring Boot APIs (Maven and Gradle)
- ✅ Deployment slots support for blue-green deployments
- ✅ Automatic test execution before deployment
- ✅ Comprehensive error handling
- ✅ Detailed deployment summaries

### Documentation
- Complete README with quick start guide
- Detailed USAGE guide with all configuration options
- EXAMPLES document with 8+ real-world scenarios
- Contributing guidelines
- MIT License

---

## Release Notes Format

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes
