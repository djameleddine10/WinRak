import { useCallback, useRef } from 'react'
import { BackHandler, Platform, ToastAndroid } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useT } from './useT'

// Makes a screen behave like an app root: the Android hardware back never pops out of
// the current section (which would silently cross into the other app mode). `onBefore`
// runs first — return true to consume the press (e.g. close an open drawer). Otherwise
// the first press shows a hint and a second within 2s exits the app.
//
// Uses useFocusEffect so the handler is only active while the screen is focused — a
// modal presented on top (e.g. incoming-request) keeps its own back behavior.
export function useExitOnBack(onBefore?: () => boolean) {
  const beforeRef = useRef(onBefore)
  beforeRef.current = onBefore
  const lastBack = useRef(0)
  const t = useT()
  const msgRef = useRef('')
  msgRef.current = t('common.pressAgainExit')

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (beforeRef.current?.()) return true
        const now = Date.now()
        if (now - lastBack.current < 2000) {
          BackHandler.exitApp()
          return true
        }
        lastBack.current = now
        if (Platform.OS === 'android') ToastAndroid.show(msgRef.current, ToastAndroid.SHORT)
        return true
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack)
      return () => sub.remove()
    }, []),
  )
}
