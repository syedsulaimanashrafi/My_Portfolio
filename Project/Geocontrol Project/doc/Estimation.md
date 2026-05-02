
# Project Estimation

**Date:**  
**Version:**  

---

# Estimation Approach

This estimation is based on the GeoControl project as described in the Swagger documentation. The project is assumed to be developed independently from course deadlines and built from scratch.

---

# Estimate by Size

|                                                                                                         | Estimate |
| ------------------------------------------------------------------------------------------------------- | -------- |
| NC = Estimated number of classes to be developed                                                        | 20       |
| A = Estimated average size per class, in LOC                                                            | 40       |
| S = Estimated size of project, in LOC (= NC * A)                                                        | 800    |
| E = Estimated effort, in person hours (productivity = 10 LOC/person hour)                               | 80      |
| C = Estimated cost, in euro (1 person hour = 30 euro)                                                   | 2400    |
| Estimated calendar time, in calendar weeks (Team of 4, 8h/day, 5 days/week)                             | 2h     |

---

# Estimate by Product Decomposition

| Component Name       | Estimated Effort (person hours) |
| -------------------- | ------------------------------- |
| Requirement Document | 20                              |
| Design Document      | 15                              |
| Code                 | 40                              |
| Unit Tests           | 10                              |
| API Tests            | 10                              |
| Management Documents | 10                              |
| **Total**            | **105**                         |

---

# Estimate by Activity Decomposition

| Activity Name          | Estimated Effort (person hours) |
| ---------------------- | ------------------------------- |
| Requirements Analysis  | 25                              |
| System Design          | 15                              |
| Frontend Development   | 15                              |
| Backend Development    | 25                              |
| Sensor Integration     | 10                              |
| Database Setup         | 10                              |
| Testing (Unit + API)   | 15                              |
| Documentation & Review | 10                              |
| **Total**              | **125**                         |

---

# Summary

|                                    | Estimated Effort (hours) | Estimated Duration (weeks) |
| ---------------------------------- | ------------------------ | --------------------------- |
| Estimate by Size                   | 80                      | 5,7                        |
| Estimate by Product Decomposition  | 105                      | ~7,5                        |
| Estimate by Activity Decomposition | 125                      | 8,9                        |

---

## Discussion

- Differences between estimates are minimal due to consistent assumptions.
- Size-based estimation is straightforward but assumes uniform class size and productivity.
- Product-based estimation helps distribute effort by deliverables.
- Activity-based estimation allows tracking effort across lifecycle stages.