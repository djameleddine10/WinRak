import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'
import { Txt } from '../../components/ui/Txt'
import { Icon } from '../../components/ui/Icon'
import { TopBar } from '../../components/layout/TopBar'
import { useRestaurantStore, allRestaurants, type ChatMessage } from '../../store/restaurantStore'
import { useIsRTL } from '../../i18n/locale'

export default function RestaurantChat() {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors, isRTL), [Colors, isRTL])
  const insets = useSafeAreaInsets()
  const { id } = useLocalSearchParams<{ id: string }>()

  const registered  = useRestaurantStore((s) => s.registered)
  const restaurants = useRestaurantStore((s) => s.restaurants)
  const r = allRestaurants(registered, restaurants).find((x) => x.id === id)
  const chats = useRestaurantStore((s) => s.chats)
  const ensureChat = useRestaurantStore((s) => s.ensureChat)
  const sendMessage = useRestaurantStore((s) => s.sendMessage)

  const [text, setText] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const messages: ChatMessage[] = (id && chats[id]) || []

  useEffect(() => { if (r) ensureChat(r) }, [r, ensureChat])
  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(timer)
  }, [messages.length])

  if (!r) return null

  function send() {
    if (!text.trim()) return
    sendMessage(r!.id, text)
    setText('')
  }

  function quickOrder(name: string, price: number) {
    sendMessage(r!.id, t('chat.quickOrder', { name, price: price.toLocaleString('en-US'), currency: t('common.currency') }))
  }

  return (
    <View style={styles.container}>
      <TopBar title={r.name} showBack />
      <View style={styles.subHeader}>
        <View style={styles.recDot} />
        <Txt size={12} color={Colors.muted}>{t('chat.subHeader', { name: r.reception })}</Txt>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top + 90}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          {messages.map((m) => {
            const mine = m.from === 'me'
            return (
              <View key={m.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Txt size={14} color={mine ? Colors.dark1 : Colors.white}>{m.key ? t(m.key, m.vars) : m.text}</Txt>
                <Txt size={10} color={mine ? 'rgba(0,0,0,0.45)' : Colors.muted} style={styles.time}>{m.time}</Txt>
              </View>
            )
          })}
        </ScrollView>

        {r.menu.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow} contentContainerStyle={styles.quickContent}>
            {r.menu.map((m) => (
              <Pressable key={m.id} style={styles.quickChip} onPress={() => quickOrder(m.name, m.price)}>
                <Icon name="plus" size={14} color={Colors.gold} />
                <Txt size={12}>{m.name}</Txt>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <TextInput
            style={[styles.input, { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }]}
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={Colors.muted}
            multiline
            onSubmitEditing={send}
          />
          <Pressable style={styles.sendBtn} onPress={send} hitSlop={6}>
            <Icon name="send" size={20} color={Colors.dark1} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

function makeStyles(Colors: Palette, isRTL: boolean) {
  const row = isRTL ? 'row-reverse' : 'row'
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.dark1 },
    subHeader: {
      flexDirection: row, alignItems: 'center', gap: 6,
      backgroundColor: Colors.dark2, paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.sm,
      borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },
    messages: { padding: Spacing.lg, gap: Spacing.sm },
    bubble: { maxWidth: '80%', borderRadius: Spacing.radiusMd, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    mine: { alignSelf: 'flex-end', backgroundColor: Colors.gold, borderBottomRightRadius: 4 },
    theirs: { alignSelf: 'flex-start', backgroundColor: Colors.dark3, borderBottomLeftRadius: 4 },
    time: { marginTop: 4, textAlign: 'left' },
    quickRow: { flexGrow: 0, backgroundColor: Colors.dark1 },
    quickContent: { flexDirection: row, gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
    quickChip: {
      flexDirection: row, alignItems: 'center', gap: 4,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusFull,
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    },
    inputBar: {
      flexDirection: row, alignItems: 'flex-end', gap: Spacing.sm,
      backgroundColor: Colors.dark2, borderTopWidth: 1, borderTopColor: Colors.border,
      paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    },
    input: {
      flex: 1, maxHeight: 110, minHeight: 44,
      backgroundColor: Colors.dark3, borderRadius: Spacing.radiusLg,
      paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
      color: Colors.white, fontFamily: Typography.fonts.regular, fontSize: 14,
    },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  })
}
