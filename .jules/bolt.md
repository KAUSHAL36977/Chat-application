## 2024-05-24 - Use `.lean()` for Read-Only Mongoose Queries
**Learning:** Mongoose queries return fully hydrated Mongoose documents by default, which have overhead for saving, getters/setters, etc. If the result is only going to be sent back as a JSON response (read-only), this overhead is completely unnecessary and creates a performance bottleneck in the codebase.
**Action:** Always append `.lean()` to Mongoose read-only queries (`find`, `findOne`, `findById`) whose results are directly returned as JSON responses.
