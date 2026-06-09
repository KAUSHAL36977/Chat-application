## 2024-05-20 - Mongoose Query Performance Overhead
**Learning:** Mongoose `findById().populate()` after saving a new document does a full DB roundtrip unnecessarily.
**Action:** Use `await doc.populate(...)` directly on the saved document to skip the extra query.
## 2024-05-24 - Duplicate Route Directories
**Learning:** The codebase contains duplicated route directories (e.g., `server/routes/` and `routes/`).
**Action:** Always verify which specific file and directory is actively loaded and used by the entry point before implementing changes to avoid confusing the file contexts or modifying dormant files.
## 2024-05-24 - The Risk of .lean() on Interactive Flow
**Learning:** Adding `.lean()` to interactive endpoints such as `/login` completely bypasses Mongoose instance methods, causing subsequent operations like `user.comparePassword()` to crash.
**Action:** Be extremely careful not to append `.lean()` blindly to queries that feed into authentication flows or business logic relying on Mongoose magic.
