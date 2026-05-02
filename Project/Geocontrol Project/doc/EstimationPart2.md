# Project Estimation Part 2

Goal of this document is to compare actual effort and size of the project, vs the estimates made in task1.

---

## Computation of Size


### Production Code (`src`)

| Language    | Files | Blank | Comment | Code |
|-------------|-------|--------|----------|------|
| TypeScript  | 53    | 417    | 430      | 2875 |
| **Total**   | 53    | 417    | 430      | **2875** |

**→ Production LOC = 2875**

---

### Test Code (`test`)

| Language    | Files | Blank | Comment | Code |
|-------------|-------|--------|----------|------|
| TypeScript  | 37    | 1607   | 39       | 7223 |
| **Total**   | 37    | 1607   | 39       | **7223** |

**→ Test LOC = 7223**

---

## Computation of Effort

From the `timesheet.md`, we sum all effort (excluding containerization) across all weeks:

**Total effort = 188 person-hours**

---
## Computation of productivity

- Productivity = (2875 + 7223) / 188 = 53.7 LOC/person-hour


---

## Comparison Table

| Metric                  | Estimated (Task 1) | Actual (June 7)       |
|-------------------------|--------------------|------------------------|
| Production Code Size    | unknown          | 2875 LOC               |
| Test Code Size          | unknown           | 7223 LOC               |
| **Total Code Size**     | 1100 LOC           | **10098 LOC**          |
| Effort                  | 125 hours          | **188 hours**          |
| Productivity            | 10 LOC/hour        | **≈ 53.7 LOC/hour**    |

---



## Estimated Effort via Activity Decomposition Technique:

| **Activity Name**        | **Estimated Effort (hours)** |
|--------------------------|------------------------------|
| Requirements Analysis    | 25                           |
| System Design            | 15                           |
| Frontend Development     | 15                           |
| Backend Development      | 25                           |
| Sensor Integration       | 10                           |
| Database Setup           | 10                           |
| Testing (Unit + API)     | 15                           |
| Documentation & Review   | 10                           |
| **Total**                | **125**                      |



