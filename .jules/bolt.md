## 2024-08-28 - Mongoose Lowercase Modifier vs Pre-save hook
**Learning:** If a Mongoose schema defines a field with a modifier property like `lowercase: true`, it automatically applies this transformation during casting and validation. Any custom `pre('save')` middleware hooks performing the exact same string transformation are completely redundant and add unnecessary function execution overhead.
**Action:** Always check schema modifiers before adding or keeping pre-save hooks for simple string transformations like lowercasing or trimming.
