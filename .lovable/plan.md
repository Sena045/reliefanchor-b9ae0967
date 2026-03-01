

## Plan: Remove Landing Page

### Changes

**1. `src/App.tsx`**
- Remove the `LandingPage` lazy import
- Remove `showAuth`, `showPressKit`, `showAbout` state variables (no longer needed for landing page navigation)
- Remove the landing page render block (lines 136-146)
- Remove the `showAuth`, `showPressKit`, `showAbout` conditional blocks (lines 113-135) — these were only reachable from the landing page
- When user is not logged in, show `AuthPage` directly (or `GuestChatPage` if on try-chat URL)

**2. `src/pages/LandingPage.tsx`**
- Delete the file (no longer used)

**3. Cleanup references**
- Remove any remaining imports or references to `LandingPage` across the codebase

### Result
Non-authenticated users will go directly to the sign-in/sign-up page instead of seeing a landing page first. Guest chat via `/try` URL and legal/delete-account pages remain accessible.

