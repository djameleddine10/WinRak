import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { useT } from '../../hooks/useT'
import { Txt } from './Txt'
import { Icon } from './Icon'
import { ActionSheet } from './ActionSheet'

type Shape = 'square' | 'circle'
type State = 'empty' | 'uploading' | 'uploaded'

interface PhotoUploadProps {
  onPhotoSelected?: (uri: string) => void
  required?: boolean
  size?: number
  shape?: Shape
  label?: string
  initialUri?: string | null
}

export function PhotoUpload({
  onPhotoSelected, required, size = 120, shape = 'square', label, initialUri = null,
}: PhotoUploadProps) {
  const Colors = useColors()
  const t = useT()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  const [uri, setUri] = useState<string | null>(initialUri)
  const [state, setState] = useState<State>(initialUri ? 'uploaded' : 'empty')
  const [sheetVisible, setSheetVisible] = useState(false)

  const radius = shape === 'circle' ? size / 2 : 16

  const borderColor =
    state === 'uploaded' ? Colors.success :
    state === 'uploading' ? Colors.gold :
    required ? Colors.danger : Colors.dark4

  async function pickFrom(source: 'camera' | 'library') {
    try {
      const perm = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(t('photo.permTitle'), t('photo.permMsg'))
        return
      }
      setState('uploading')
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.85 })
      if (result.canceled || !result.assets?.[0]) {
        setState(uri ? 'uploaded' : 'empty')
        return
      }
      const picked = result.assets[0].uri
      setUri(picked)
      setState('uploaded')
      onPhotoSelected?.(picked)
    } catch {
      setState(uri ? 'uploaded' : 'empty')
    }
  }

  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <Pressable onPress={() => setSheetVisible(true)}>
        <View
          style={[
            styles.box,
            {
              width: size, height: size, borderRadius: radius, borderColor,
              borderStyle: state === 'empty' ? 'dashed' : 'solid',
            },
          ]}
        >
          {uri ? (
            <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />
          ) : state === 'uploading' ? (
            <ActivityIndicator color={Colors.gold} />
          ) : (
            <Icon name="camera" size={size * 0.28} color={required ? Colors.danger : Colors.muted} />
          )}
          {state === 'uploaded' && (
            <View style={styles.badge}>
              <Icon name="check" size={16} color={Colors.pureWhite} />
            </View>
          )}
        </View>
      </Pressable>

      {!!label && <Txt size={12} color={Colors.muted}>{label}</Txt>}

      <ActionSheet
        visible={sheetVisible}
        title={t('photo.addTitle')}
        onClose={() => setSheetVisible(false)}
        actions={[
          {
            label: t('photo.camera'),
            icon: 'camera-outline',
            onPress: () => { setSheetVisible(false); pickFrom('camera') },
          },
          {
            label: t('photo.gallery'),
            icon: 'image-multiple-outline',
            onPress: () => { setSheetVisible(false); pickFrom('library') },
          },
          {
            label: t('common.cancel'),
            variant: 'cancel',
            onPress: () => setSheetVisible(false),
          },
        ]}
      />
    </View>
  )
}

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    box: {
      backgroundColor: Colors.dark3,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    badge: {
      position: 'absolute', bottom: 4, right: 4,
      backgroundColor: Colors.success,
      borderRadius: 12, width: 24, height: 24,
      alignItems: 'center', justifyContent: 'center',
    },
  })
}
