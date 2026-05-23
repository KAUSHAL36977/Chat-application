## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2026-05-23 - Mongoose Delete Authorization API Contract
**Learning:** Replacing findById + save with findOneAndUpdate or updateOne can inadvertently merge HTTP 404 (Not Found) and HTTP 403 (Forbidden) response codes into a single 404 response. This breaks frontend clients relying on the distinct HTTP codes.
**Action:** When optimizing delete/update routes, first fetch only the authorization fields using .select().lean() to preserve the 404/403 distinction before applying the atomic update.
