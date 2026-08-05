# Auth store

Frontend state for auth on mobile.

Session state is provided directly by `authClient.useSession()` (better-auth
react hook) and is consumed by the route gates in `src/app/`. No local store
(zustand/context) is needed for auth currently.
