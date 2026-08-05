# Auth schema

Frontend-only validation for auth forms.

There is no separate runtime schema package for mobile (validation lives in
`@repo/contracts` / `@repo/auth` where shared). Keep any mobile-specific field
rules here if they diverge from the web feature.
