// src/components/AccessibleButton.tsx
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
	Animated,
	StyleSheet,
	Text,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle
} from 'react-native';
import { TTSService } from '../services/TTSService';

interface AccessibleButtonProps {
  title: string;
  onPress: () => void;
  description?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gradient' | 'glass';
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  hapticFeedback?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  description,
  style,
  textStyle,
  disabled = false,
  variant = 'primary',
  icon,
  size = 'medium',
  hapticFeedback = true,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    if (hapticFeedback && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      TTSService.speak(`${title.replace(/[📸🔊🏠🎤🛑📄]/g, '').trim()} activated`);
      onPress();
    }
  };

  const handleLongPress = () => {
    if (!disabled) {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      const message = description || `${title.replace(/[📸🔊🏠🎤🛑📄]/g, '').trim()} button. Long press for more information.`;
      TTSService.speak(message);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[size],
      disabled && styles.disabled,
      style
    ];

    switch (variant) {
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'success':
        return [...baseStyle, styles.success];
      case 'warning':
        return [...baseStyle, styles.warning];
      case 'danger':
        return [...baseStyle, styles.danger];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    return [
      styles.buttonText,
      styles[`${size}Text`],
      disabled && styles.disabledText,
      textStyle
    ];
  };

  const renderButton = () => {
    const buttonContent = (
      <View style={styles.buttonContent}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={getTextStyle()}>
          {title}
        </Text>
      </View>
    );

    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={disabled ? ['#cccccc', '#aaaaaa'] : ['#667eea', '#764ba2']}
          style={[styles.gradientButton, styles[size], style]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {buttonContent}
        </LinearGradient>
      );
    }

    if (variant === 'glass') {
      return (
        <BlurView 
          intensity={80} 
          tint={disabled ? "light" : "dark"}
          style={[styles.glassButton, styles[size], style]}
        >
          {buttonContent}
        </BlurView>
      );
    }

    return (
      <View style={getButtonStyle()}>
        {buttonContent}
      </View>
    );
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }]
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        accessible={true}
        accessibilityLabel={title.replace(/[📸🔊🏠🎤🛑📄]/g, '').trim()}
        accessibilityHint={description}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        delayLongPress={800}
        activeOpacity={0.8}
      >
        {renderButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Size variants
  small: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    minHeight: 64,
  },
  // Color variants
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#6C7B7F',
  },
  success: {
    backgroundColor: '#34C759',
  },
  warning: {
    backgroundColor: '#FF9500',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  // Special variants
  gradientButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  glassButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  // Text styles
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 16,
  },
  mediumText: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 22,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  // Disabled states
  disabled: {
    backgroundColor: '#E1E1E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: '#A1A1A1',
  },
});