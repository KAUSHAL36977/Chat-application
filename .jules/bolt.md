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
## 2026-06-07 - Mongoose Model Validation during save()
**Learning:** Calling `await doc.save()` unnecessarily runs validation logic over unmodified fields, invokes schema pre-save hooks (like lowercasing emails), and requires tracking document modification state just to update a simple field like `lastLogin`.
**Action:** Replace `this.save()` with `this.model('ModelName').updateOne({ _id: this._id }, { $set: { ... } })` inside instance methods when performing targeted, high-frequency updates where full document validation and hydration are not needed.
## 2026-06-17 - Concurrent Exists Checks
**Learning:** When validating multiple unique fields (like email and username) for specific error messages, using `findOne({ $or: [...] })` hydrates the full document unnecessarily. Replacing this with concurrent `Promise.all([Model.exists(...), Model.exists(...)])` calls reduces database payload and memory overhead.
**Action:** Use concurrent `exists()` calls for validation that requires differentiating between multiple failing fields, instead of a single `findOne` with `$or`.
## 2024-05-24 - Registration Endpoint Duplicate Key Optimization
**Learning:** Removing `Model.findOne()` pre-checks and relying on MongoDB's unique index constraint (error code `11000`) is a powerful optimization for registration endpoints, cutting database roundtrips on the happy path. However, when doing this, it is critical to handle the `11000` error *locally* within the route's catch block, parsing the `error.keyPattern` to preserve the original 400 Bad Request error contract. Simply passing it to `next(error)` will often trigger a generic 500 error if the global handler is not explicitly configured for client-friendly duplicate key responses.
**Action:** When migrating from manual existence checks to database constraints, always verify the global error handler's capabilities. If it lacks specific support, parse the `11000` error locally in the route to ensure the API contract (status codes and messages) remains completely unchanged.
