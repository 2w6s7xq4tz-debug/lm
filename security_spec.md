# Security Specification - Lumina Movie

## 1. Data Invariants
- A Catalog Item must have a unique ID, title, and type.
- A Catalog Item's status must be one of the predefined values.
- Views data is stored in a single document `views/data`.
- Timestamps should be consistent.

## 2. The "Dirty Dozen" Payloads (Targeting Vulnerabilities)
1. **Shadow Field Attack**: Adding `isAdmin: true` to a Catalog Item.
2. **Type Poisoning**: Sending `year` as a number instead of a string.
3. **Identity Spoofing**: Trying to write a catalog item without proper fields.
4. **Denial of Wallet**: Sending 1MB description string.
5. **ID Poisoning**: Using `../../system/root` as document ID.
6. **Enum Breach**: Setting type to "Music".
7. **Orphaned Write**: Creating a view for a non-existent item (though views are global here).
8. **Negative Views**: Setting a view count to -1.
9. **Malformed URL**: Sending "not-a-url" for poster.
10. **Immutable Breach**: Trying to change `publishedAt` on update.
11. **Large Array**: Sending 10,000 genres.
12. **Status Shortcut**: Setting status to "Live" without required metadata.

## 3. Test Runner Plan
We will use a test script to verify that:
- Public can read catalog.
- Public can write (for now, as requested, but we should recommend auth).
- Schema is strictly enforced on write.
