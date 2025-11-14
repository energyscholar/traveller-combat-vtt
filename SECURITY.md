# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.12.x  | :white_check_mark: |
| < 0.12  | :x:                |

## Reporting a Vulnerability

We take the security of Traveller Combat VTT seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** Open a Public Issue

Security vulnerabilities should not be publicly disclosed until they have been addressed. Please do not open GitHub issues for security concerns.

### 2. Report Privately

Send vulnerability reports to: **[Your contact email or security contact]**

Please include:
- Description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Potential impact assessment
- Any suggested fixes (if available)

### 3. Response Timeline

- **Initial Response:** Within 48 hours of report submission
- **Status Update:** Within 7 days with assessment and planned fix timeline
- **Resolution:** Security patches released as soon as possible, typically within 30 days

### 4. Coordinated Disclosure

We follow coordinated disclosure practices:
- We will work with you to understand and validate the vulnerability
- We will develop and test a fix
- We will release the security patch
- After the patch is released, we will publicly credit you (if desired) in the release notes

## Security Update Policy

### High and Critical Severity
- Immediate patch development
- Emergency release within 48-72 hours
- All supported versions receive patches

### Moderate Severity
- Patch included in next scheduled release (typically within 2 weeks)
- Backported to supported versions if requested

### Low Severity
- Addressed in regular release cycle
- Documented in release notes

## Security Best Practices

When deploying Traveller Combat VTT:

### 1. Dependencies
- Run `npm audit` regularly to check for vulnerable dependencies
- Use `npm audit fix` to automatically update to patched versions
- Review Dependabot PRs promptly

### 2. Network Security
- Use HTTPS/WSS for production deployments
- Implement rate limiting on Socket.io connections
- Use firewall rules to restrict access if not publicly accessible

### 3. Input Validation
- All user input is validated on both client and server
- XSS protection via sanitization (avoid `innerHTML` for user content)
- Maximum message size limits enforced

### 4. Authentication (Future)
- User authentication not yet implemented
- Planned for Stage 14+
- Will include password hashing (bcrypt), session management, CSRF protection

## Known Security Considerations

### Current Limitations
- **No authentication system** - Currently a trust-based multiplayer system
- **In-memory state** - No persistence layer; server restart clears all data
- **No rate limiting** - DoS protection not yet implemented
- **No user roles** - All connected clients have equal capabilities

These limitations are documented and will be addressed in future releases. See [ROADMAP.md](.claude/ROADMAP.md) for planned security improvements.

### Dependency Security
- **Automated scanning:** GitHub Dependabot enabled
- **CI/CD checks:** npm audit runs on every commit
- **Update policy:** Weekly dependency reviews via Dependabot

## Security-Related Configuration

### Environment Variables
No sensitive environment variables currently required. Future production deployments may require:
- `SESSION_SECRET` - For session cookie encryption (when auth implemented)
- `DATABASE_URL` - For persistence layer (Stage 14+)

### Deployment Security
See [PRODUCTION-DEPLOYMENT-STRATEGY.md](.claude/PRODUCTION-DEPLOYMENT-STRATEGY.md) for production security recommendations.

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be credited in:
- Release notes
- This SECURITY.md file (Hall of Fame section below)
- Project README acknowledgments

### Security Hall of Fame

*No vulnerabilities reported yet. Be the first!*

## Questions?

For security-related questions that don't involve vulnerability disclosure, please:
- Open a GitHub Discussion in the "Security" category
- Review existing documentation in `.claude/` directory

---

**Last Updated:** 2025-11-14
**Policy Version:** 1.0
**Contact:** [Update with your contact information]

This security policy will be reviewed and updated quarterly or as needed when security practices evolve.
