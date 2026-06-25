import { memo, useMemo } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { type Palette } from '../../constants/colors'
import { useColors } from '../../hooks/useColors'
import { Txt } from './Txt'

interface AvatarProps {
  initial: string
  size?: number
  imageUri?: string | null
  showBorder?: boolean
}

// Gold circle with initial (or image). Optional gold ring + red warning badge.
export const Avatar = memo(function Avatar({ initial, size = 48, imageUri, showBorder }: AvatarProps) {
  const Colors = useColors()
  const styles = useMemo(() => makeStyles(Colors), [Colors])
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: showBorder ? 2 : 0,
            backgroundColor: imageUri ? Colors.dark3 : Colors.gold,
          },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        ) : (
          <Txt weight="black" size={size * 0.42} color={Colors.dark1}>{initial}</Txt>
        )}
      </View>
    </View>
  )
})

function makeStyles(Colors: Palette) {
  return StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center', borderColor: Colors.gold },
  })
}
