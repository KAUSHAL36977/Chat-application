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
## 2026-06-17 - Concurrent Exists Checks
**Learning:** When validating multiple unique fields (like email and username) for specific error messages, using `findOne({ $or: [...] })` hydrates the full document unnecessarily. Replacing this with concurrent `Promise.all([Model.exists(...), Model.exists(...)])` calls reduces database payload and memory overhead.
**Action:** Use concurrent `exists()` calls for validation that requires differentiating between multiple failing fields, instead of a single `findOne` with `$or`.
## 2024-06-25 - MongoDB Unique Index for Existence Checks
**Learning:** Pre-insert existence checks via `Model.findOne()` or `Model.exists()` prior to saving a new document add redundant database roundtrips. Relying on MongoDB's native unique index constraints and catching the `11000` duplicate key error achieves the same validation synchronously during the insert operation, eliminating a query on the happy path.
**Action:** Remove explicit pre-insert existence checks for fields backed by unique indexes. Catch `code: 11000` natively in error handlers to extract and report the duplicated field via `error.keyPattern`.
