## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2026-05-28 - Mongoose Atomic Updates
**Learning:** Updating a Mongoose document by mutating fields and calling `save()` after a `findById` lookup involves unnecessary full-document hydration and two database roundtrips.
**Action:** Use `findByIdAndUpdate()` with `{ $set: { ... } }` and options `{ new: true, runValidators: true }` to achieve a 50% reduction in database trips for simple updates while maintaining safety.

## 2026-05-31 - Atomic Array Updates & Concurrency
**Learning:** Replacing `findById()` + manual array manipulation + `save()` with atomic `updateOne()` operations (e.g., using `$ne` checks and `$push`) not only avoids full document hydration overhead but also eliminates race conditions in high-concurrency endpoints like view tracking.
**Action:** Prioritize native MongoDB array operators (`$addToSet`, `$pull`, `$push` with `$ne`) over application-level array manipulation whenever possible.
## 2026-06-01 - Avoid Network Latency and TOCTOU Bugs in Updates
**Learning:** Breaking an update into multiple queries (e.g., `exists` check followed by `updateOne` and then `findByIdAndUpdate`) actually degrades performance by adding database network roundtrips. Additionally, doing an `exists` check before an atomic update introduces a Time-Of-Check to Time-Of-Use (TOCTOU) vulnerability where the document could be deleted in between, causing the update to return null resulting in an invalid HTTP 200 response.
**Action:** Always favor a single atomic operation (like `findOneAndUpdate`) over multiple queries. If a single atomic operation isn't feasible, do not split it up at the cost of network roundtrips. Also, use `Model.exists()` for pure boolean existence checks instead of `Model.findOne()`, and `Model.updateOne()` instead of `Model.findByIdAndUpdate()` when the returned document is unused.
