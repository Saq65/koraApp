# TODO

## SideDrawer redirects
- [ ] Inspect `components/SideDrawer.tsx` and identify where navigation items are defined but no `onPress` handlers exist.
- [ ] Map drawer item labels to actual expo-router routes that exist in `app/`.
- [ ] Implement safe navigation helper that checks route existence (or falls back) to handle pages that may not yet exist.
- [ ] Wire up `onPress` for each drawer item to close drawer and redirect.
- [ ] Verify no invalid routes like `/cart` vs `/(tabs)/cart`.
- [ ] Run TypeScript check / build if available.

