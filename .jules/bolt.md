## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2026-05-28 - Mongoose Atomic Updates
**Learning:** Updating a Mongoose document by mutating fields and calling `save()` after a `findById` lookup involves unnecessary full-document hydration and two database roundtrips.
**Action:** Use `findByIdAndUpdate()` with `{ $set: { ... } }` and options `{ new: true, runValidators: true }` to achieve a 50% reduction in database trips for simple updates while maintaining safety.

## 2026-05-31 - Atomic Array Updates & Concurrency
**Learning:** Replacing `findById()` + manual array manipulation + `save()` with atomic `updateOne()` operations (e.g., using `$ne` checks and `$push`) not only avoids full document hydration overhead but also eliminates race conditions in high-concurrency endpoints like view tracking.
**Action:** Prioritize native MongoDB array operators (`$addToSet`, `$pull`, `$push` with `$ne`) over application-level array manipulation whenever possible.
## 2026-06-03 - Atomic Array Updates & Avoiding Race Conditions
**Learning:** Replacing a read-modify-write pattern with multiple atomic updates (e.g., trying an update and falling back to a push) can introduce TOCTOU race conditions where concurrent requests insert duplicate data, bypassing Mongoose's optimistic concurrency control.
**Action:** When performing atomic upsert-like array operations, use query operators like `$ne` within the update query filter (`{ 'array.user': { $ne: req.user.userId } }`) to ensure duplicates cannot be pushed concurrently.
## 2024-08-08 - Safe replacement of instance .save()
**Learning:** Replacing `this.save()` in Mongoose instance methods with `updateOne` is a massive optimization as it bypasses all pre/post hooks and full document validations. However, the local instance values must be explicitly mutated (e.g. `this.lastLogin = now`) immediately after the db query to ensure any downstream synchronous application logic still functions properly.
**Action:** When refactoring instance methods to atomic db queries, always cache the new value to a variable, use the variable in the db query, and assign the variable to the local instance field.
