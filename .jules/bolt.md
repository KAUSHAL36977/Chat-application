## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2024-05-25 - Atomic Operations Validation
**Learning:** Replacing Mongoose `save()` with atomic operations like `findByIdAndUpdate` bypasses schema validation by default.
**Action:** Always include `{ runValidators: true }` in the options object when performing atomic updates on user-supplied data to maintain data integrity.
