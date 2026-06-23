import { Text, TextProps } from 'react-native'
import { useColors } from '../../hooks/useColors'
import { Typography, FontWeight } from '../../constants/typography'
import { useIsRTL } from '../../i18n/locale'

const FONT_SCALE = 1.15

interface TxtProps extends TextProps {
  weight?: FontWeight
  size?: number
  color?: string
  center?: boolean
}

// Cairo-font text wrapper. Alignment follows the active layout direction (right in RTL,
// left in LTR) so French/English read naturally; `center` overrides it.
export function Txt({
  weight = 'regular',
  size = Typography.sizes.base,
  color,
  center,
  style,
  children,
  ...rest
}: TxtProps) {
  const Colors = useColors()
  const isRTL = useIsRTL()
  const textAlign = center ? 'center' : isRTL ? 'right' : 'left'
  return (
    <Text
      {...rest}
      style={[
        {
          textAlign,
          writingDirection: isRTL ? 'rtl' : 'ltr',
          fontFamily: Typography.fonts[weight],
          fontSize: size * FONT_SCALE,
          color: color ?? Colors.white,
        },
        style,
      ]}
    >
      {children}
    </Text>
  )
}
