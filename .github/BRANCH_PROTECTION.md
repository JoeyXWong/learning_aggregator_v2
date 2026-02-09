# Branch Protection Rules

This document describes the recommended branch protection settings for the `main` branch to ensure code quality and stability.

## Recommended Settings for `main` Branch

### General Rules
- **Require pull request before merging**: ✅ Enabled
  - **Required approvals**: 1
  - **Dismiss stale pull request approvals when new commits are pushed**: ✅ Enabled
  - **Require review from Code Owners**: ⬜ Optional (enable when CODEOWNERS file is added)

### Status Checks
- **Require status checks to pass before merging**: ✅ Enabled
  - **Require branches to be up to date before merging**: ✅ Enabled
  - **Required status checks**:
    - `Backend Tests`
    - `Frontend Tests`

### Branch Restrictions
- **Require linear history**: ✅ Recommended (enforces rebase/squash merges)
- **Do not allow bypassing the above settings**: ✅ Enabled
- **Restrict who can push to matching branches**: ✅ Enabled
  - Add specific users/teams who can push directly (typically only maintainers)

### Additional Rules
- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## How to Apply These Settings

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add branch protection rule**
4. Enter `main` as the branch name pattern
5. Configure the settings as described above
6. Click **Create** or **Save changes**

## CI/CD Integration

The branch protection rules work in conjunction with the GitHub Actions CI workflow (`.github/workflows/ci.yml`). The workflow runs two jobs:

- **Backend Tests**: Runs linting, Prisma client generation, and tests with coverage requirements
- **Frontend Tests**: Runs linting, TypeScript type checking, and tests with 20% coverage requirement

Both jobs must pass before a PR can be merged to `main`.

## Coverage Thresholds

### Backend
Configured in `backend/jest.config.js`:
- Branches: 70% (actual: 74.4%)
- Functions: 90% (actual: 95.36%)
- Lines: 90% (actual: 91.28%)
- Statements: 90% (actual: 91.52%)

### Frontend (20% minimum)
Configured in `frontend/vite.config.ts`:
- Branches: 20%
- Functions: 20%
- Lines: 20%
- Statements: 20%

> **Note**: As the frontend test coverage improves, the threshold should be gradually increased toward 80-90%.

## Exceptions

Branch protection rules can be temporarily bypassed in emergency situations by repository administrators. However, this should be:
1. Documented in the commit message
2. Followed up with a hotfix PR that includes proper tests
3. Used only for critical production issues

## Maintenance

Review and update these settings:
- **Monthly**: Review if coverage thresholds should be increased
- **Quarterly**: Review if additional status checks should be required
- **As needed**: When new CI jobs are added or team structure changes
