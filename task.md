# Performance Audit Tasks

## 🔴 Direct Performance Impact
- [x] useMemo on makeStyles — ALL files already have it ✅
- [ ] console.log/warn — wrap in __DEV__ guard in babel.config or create __DEV__ util
- [ ] React.memo on: Button, Card, Txt, Icon, Avatar, DirIcon, Badge (heavy primitives used everywhere)
- [ ] earnings.tsx Row + Stat sub-components — makeStyles called inside = re-create on every render → extract styles or use React.memo
- [ ] re-render selectors — no major issues found, all use (s) => s.field pattern ✅

## 🟡 Meaningful Improvements
- [ ] FlatList in notifications.tsx (ScrollView with list)
- [ ] FlatList in delivery-food.tsx (ScrollView with list)
- [ ] earnings.tsx stays ScrollView (mixed content, not pure list)
- [ ] Haptics — add expo-haptics to Button, driver accept/reject

## 🟢 Polish
- [ ] console statements wrap in __DEV__ 

## STATUS
- earnings.tsx Row/Stat: makeStyles called inside sub-component = BIG issue, fix first
