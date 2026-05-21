## 2024-05-21 - Mongoose .lean() Optimization
**Learning:** By default, Mongoose queries return full Mongoose documents, which include overhead like getters/setters and change tracking. For read-only operations where the document is immediately serialized to JSON, this overhead is wasted.
**Action:** Always append `.lean()` to Mongoose queries (`find`, `findOne`, `findById`) that are strictly read-only and returned directly via an API response.
