## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2024-05-27 - Mongoose Document Hydration Anti-Pattern
**Learning:** The codebase frequently uses two-step `findById()` followed by `.save()` for simple updates (like `isOnline` toggles or array `$push` for followers), causing unnecessary full document hydration and extra database roundtrips.
**Action:** Replace these patterns with atomic operations like `updateOne` and `findByIdAndUpdate` using `$set`, `$addToSet`, and `$pull` operators, while ensuring `{ runValidators: true }` is passed to maintain schema integrity.
