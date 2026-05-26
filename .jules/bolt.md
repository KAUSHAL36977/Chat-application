## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2024-05-26 - Atomic Update Overheads
**Learning:** Replacing two-step `findById` then `save()` with atomic `findByIdAndUpdate` requires manual re-enabling of schema validation since atomic updates bypass `pre('save')` middleware hooks.
**Action:** Always include `{ runValidators: true }` when optimizing two-step updates into a single atomic operation in Mongoose.
