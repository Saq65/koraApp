# TODO

## Theme compliance (hardcoded colors -> theme)

- [ ] 1) Update `app/(tabs)/home.tsx`: remove hardcoded TEAL/gray/white/etc and use `useTheme()` tokens.
- [ ] 2) Update `app/(tabs)/cart.tsx`: remove hardcoded palette constants and use `useTheme()` tokens.
- [ ] 3) Update `app/(tabs)/orders.tsx`: replace remaining hardcoded colors (#fff, #E53935, etc) with theme tokens.
- [ ] 4) Update `app/subcategory.tsx`: remove hardcoded C palette and use `useTheme()` tokens.
- [ ] 5) Update `app/category.tsx`: remove hardcoded palette and use `useTheme()`.
- [ ] 6) Update `app/placeorder/placeorder.tsx`: remove hardcoded palette and use `useTheme()`.
- [ ] 7) Update `app/payment/payment.tsx`: remove hardcoded palette and use `useTheme()`.
- [ ] 8) Update `app/paymentucces.tsx`, `trackorder/trackorder.tsx`, `notifications.tsx`: remove hardcoded colors and use `useTheme()`.
- [ ] 9) Update onboarding/profile pages with hardcoded colors (language/terms/profile subpages) to use theme.

## SafeAreaView + AppBackground consistency

- [ ] 10) For every modified screen: ensure it uses `<SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>` and wraps content in `<AppBackground>`.

## Verification

- [ ] 11) Run lint/typecheck: `npm run lint` and `npm run typecheck` (if available).
- [ ] 12) Smoke test in app: switch to dark mode and ensure pages don’t show wrong colors.

