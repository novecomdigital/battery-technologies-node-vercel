# User Acceptance Testing (UAT) Scripts

> **Note**: This is a template file. UAT scripts should be generated from requirements and designs.

## 📋 How to Use UAT Scripts

1. Review feature requirements in `requirements.md`
2. Generate UAT scripts using Cursor AI (see prompt below)
3. Customer/QA executes tests in staging environment
4. Document pass/fail results
5. Create GitHub issues for any failures

## 🤖 Generating UAT Scripts with Cursor

Use this prompt to generate UAT scripts:

```
Generate a UAT script for "[FEATURE NAME]" based on:
- Requirements: [requirements.md section]
- Designs: [designs.md screens]

Include:
- Test Case ID
- Preconditions
- Step-by-step actions
- Expected result
- Actual result (to be filled during testing)
- Pass/Fail (to be filled during testing)

Format: Markdown table
```

---

## 🧪 UAT Script Template

### Feature: [Feature Name]

**Epic**: [Link to Epic]
**Feature ID**: F-XXX
**Test Date**: [Date]
**Tester**: [Name]
**Environment**: Staging / Production
**Version**: [Version/Commit]

---

#### Test Case: TC-001 - [Test Case Name]

**Priority**: P1 (Critical) | P2 (High) | P3 (Medium) | P4 (Low)

**Preconditions**:
- User is logged in
- [Other preconditions]

**Test Data**:
- Username: `test@example.com`
- Password: `Test123!`
- [Other test data]

**Steps**:

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|---------------|-----------|
| 1 | Navigate to `/feature` | Page loads successfully | | ⬜ |
| 2 | Click "Submit" button | Form validates | | ⬜ |
| 3 | Enter valid data | No errors shown | | ⬜ |
| 4 | Click "Save" | Success message appears | | ⬜ |
| 5 | Verify data in database | Data saved correctly | | ⬜ |

**Overall Result**: ⬜ Pass / ⬜ Fail

**Notes**:
[Any additional observations or issues]

**Screenshots**:
[Attach screenshots if test fails]

---

## 📝 Example UAT Scripts

### Feature: User Registration

#### TC-REG-001 - Successful User Registration

**Priority**: P1

**Preconditions**:
- User is not logged in
- Test email is not already registered

**Test Data**:
- Email: `newuser+test@example.com`
- Password: `SecurePass123!`
- Name: `Test User`

**Steps**:

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|---------------|-----------|
| 1 | Navigate to `/register` | Registration page loads with form | | ⬜ |
| 2 | Enter email in email field | Email field accepts input | | ⬜ |
| 3 | Enter password in password field | Password is masked, strength indicator shows | | ⬜ |
| 4 | Enter name in name field | Name field accepts input | | ⬜ |
| 5 | Click "Register" button | Loading state shown | | ⬜ |
| 6 | Wait for response | Success message: "Account created successfully" | | ⬜ |
| 7 | Verify email sent | Verification email received | | ⬜ |
| 8 | Check user dashboard | Redirected to dashboard | | ⬜ |

**Overall Result**: ⬜ Pass / ⬜ Fail

---

#### TC-REG-002 - Registration with Invalid Email

**Priority**: P2

**Preconditions**:
- User is not logged in

**Test Data**:
- Email: `invalid-email` (no @ symbol)
- Password: `SecurePass123!`
- Name: `Test User`

**Steps**:

| Step | Action | Expected Result | Actual Result | Pass/Fail |
|------|--------|----------------|---------------|-----------|
| 1 | Navigate to `/register` | Registration page loads | | ⬜ |
| 2 | Enter invalid email | Email field accepts input | | ⬜ |
| 3 | Enter valid password | Password accepted | | ⬜ |
| 4 | Click "Register" button | Error message: "Please enter a valid email address" | | ⬜ |
| 5 | Verify form not submitted | User remains on registration page | | ⬜ |

**Overall Result**: ⬜ Pass / ⬜ Fail

---

## 📊 UAT Test Summary

### Test Execution Summary

| Feature | Total Tests | Passed | Failed | Blocked | Pass Rate |
|---------|------------|--------|--------|---------|-----------|
| User Registration | 10 | 8 | 2 | 0 | 80% |
| [Feature 2] | - | - | - | - | - |

### Critical Issues Found

| Issue ID | Feature | Test Case | Severity | Status | Assigned To |
|----------|---------|-----------|----------|--------|-------------|
| BUG-001 | Registration | TC-REG-001 | High | Open | @developer |

---

## ✅ UAT Sign-off

### Acceptance Criteria

- [ ] All P1 (Critical) test cases pass
- [ ] ≥95% of P2 (High) test cases pass
- [ ] ≥90% of P3 (Medium) test cases pass
- [ ] No critical bugs blocking release
- [ ] Performance meets requirements
- [ ] Accessibility requirements met (WCAG AA)

### Sign-off

**Customer Approval**:
- Name: ________________
- Date: ________________
- Signature: ________________

**Comments**:
[Customer feedback and approval notes]

---

## 🔄 UAT Process

### 1. Preparation
1. Review requirements and designs
2. Generate UAT scripts from requirements
3. Set up test environment (staging)
4. Prepare test data
5. Schedule UAT session with customer

### 2. Execution
1. Customer/QA follows UAT scripts step-by-step
2. Document actual results
3. Mark pass/fail for each test case
4. Take screenshots of any issues
5. Document observations and feedback

### 3. Reporting
1. Summarize test results
2. Create GitHub issues for failures
3. Prioritize issues (P1/P2/P3/P4)
4. Communicate results to development team
5. Plan remediation work

### 4. Retest
1. Developers fix issues
2. Deploy fixes to staging
3. Retest failed test cases
4. Verify fixes don't break other functionality
5. Update UAT scripts if needed

### 5. Sign-off
1. All critical tests pass
2. Customer reviews and approves
3. Document approval in Notion
4. Proceed to production deployment

---

## 📋 UAT Best Practices

### For Testers
- Follow scripts exactly as written
- Document every issue, no matter how small
- Take screenshots for visual issues
- Test on multiple browsers and devices
- Verify both happy path and error cases
- Test with realistic data

### For Developers
- Generate comprehensive UAT scripts
- Include both positive and negative test cases
- Cover all acceptance criteria
- Consider edge cases
- Make scripts easy to follow
- Update scripts when requirements change

### For Product Owners
- Review UAT scripts before testing
- Participate in UAT sessions when possible
- Provide timely feedback on results
- Prioritize issues realistically
- Sign off formally when satisfied

---

## 🔗 Related Documentation

- **Requirements**: See `requirements.md`
- **Designs**: See `designs.md`
- **Architecture**: See `architecture.md`
- **Test Specifications**: [Link to P11 process doc]

---

**Last Updated**: [Date]
**UAT Owner**: [Name/Team]
**Next UAT Session**: [Date]

