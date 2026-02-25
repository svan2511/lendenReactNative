import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    LayoutChangeEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const MIN_TAB_WIDTH = 80;
const ACTIVE_INDICATOR_HEIGHT = 3;

interface TabRoute {
  name: string;
  title: string;
  icon: string;
  iconOutline: string;
}

interface ScrollableTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  activeTintColor?: string;
  inactiveTintColor?: string;
  backgroundColor?: string;
  indicatorColor?: string;
}

const TABS: TabRoute[] = [
  { name: 'index', title: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'billing', title: 'Billing', icon: 'receipt', iconOutline: 'receipt-outline' },
  { name: 'customers', title: 'Customers', icon: 'people', iconOutline: 'people-outline' },
  { name: 'products', title: 'Products', icon: 'layers', iconOutline: 'layers-outline' },
  { name: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  { name: 'reports', title: 'Reports', icon: 'stats-chart', iconOutline: 'stats-chart-outline' },
  // Add more tabs here - the design will adapt automatically!
  { name: 'settings', title: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
  { name: 'notifications', title: 'Alerts', icon: 'notifications', iconOutline: 'notifications-outline' },
  { name: 'analytics', title: 'Analytics', icon: 'bar-chart', iconOutline: 'bar-chart-outline' },
];

export default function ScrollableTabBar({
  state,
  descriptors,
  navigation,
  activeTintColor = '#007AFF',
  inactiveTintColor = '#8E8E93',
  backgroundColor = '#fff',
  indicatorColor = '#007AFF',
}: ScrollableTabBarProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Animated value for the indicator position
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  // Calculate which tabs are visible
  const visibleTabs = TABS.filter(tab => 
    state.routes.some((route: any) => route.name === tab.name)
  );

  const activeIndex = state.index;
  const activeRoute = state.routes[activeIndex];

  // Animate indicator to active tab
  useEffect(() => {
    const activeTabName = activeRoute.name;
    const layout = tabLayouts[activeTabName];
    
    if (layout) {
      Animated.parallel([
        Animated.spring(indicatorPosition, {
          toValue: layout.x,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
        Animated.spring(indicatorWidth, {
          toValue: layout.width,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
      ]).start();

      // Scroll to make active tab visible (center it if possible)
      if (scrollViewRef.current && containerWidth > 0) {
        const scrollTo = layout.x - (containerWidth / 2) + (layout.width / 2);
        scrollViewRef.current.scrollTo({
          x: Math.max(0, scrollTo),
          animated: true,
        });
      }
    }
  }, [activeIndex, tabLayouts, containerWidth]);

  const handleTabLayout = (tabName: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [tabName]: { x, width },
    }));
  };

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const onPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = (route: any) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={visibleTabs.length > 4} // Only scroll if tabs exceed 4
        contentContainerStyle={styles.scrollContent}
        onLayout={handleContainerLayout}
      >
        <View style={styles.tabsContainer}>
          {visibleTabs.map((tab, index) => {
            const route = state.routes.find((r: any) => r.name === tab.name);
            if (!route) return null;

            const isFocused = state.routes[state.index].name === tab.name;
            const color = isFocused ? activeTintColor : inactiveTintColor;

            return (
              <TouchableOpacity
                key={tab.name}
                onPress={() => onPress(route, isFocused)}
                onLongPress={() => onLongPress(route)}
                style={styles.tabButton}
                onLayout={handleTabLayout(tab.name)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <Ionicons
                    name={isFocused ? tab.icon : (tab.iconOutline as any)}
                    size={24}
                    color={color}
                    style={styles.icon}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      { color },
                      isFocused && styles.activeLabel,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.title}
                  </Text>
                </View>
                
                {/* Micro-interaction: Scale animation on active */}
                {isFocused && (
                  <Animated.View
                    style={[
                      styles.activeBackground,
                      {
                        backgroundColor: `${activeTintColor}15`, // 15 = ~8% opacity
                        transform: [{ scale: indicatorWidth.interpolate({
                          inputRange: [0, 100],
                          outputRange: [0.8, 1],
                        }) }],
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Animated Active Indicator Line */}
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: indicatorColor,
              transform: [{ translateX: indicatorPosition }],
              width: indicatorWidth,
            },
          ]}
        />
      </ScrollView>

      {/* Gradient fade indicators for scroll hint */}
      <View style={[styles.fadeLeft, { backgroundColor }]} pointerEvents="none" />
      <LinearGradientFade side="right" backgroundColor={backgroundColor} />
    </View>
  );
}

// Gradient component for scroll hints
function LinearGradientFade({ side, backgroundColor }: { side: 'left' | 'right'; backgroundColor: string }) {
  return (
    <View
      style={[
        styles.fadeBase,
        side === 'left' ? styles.fadeLeft : styles.fadeRight,
        {
          backgroundColor: side === 'left' 
            ? backgroundColor 
            : 'transparent',
        },
      ]}
      pointerEvents="none"
    >
      {side === 'right' && (
        <View
          style={[
            styles.gradientRight,
            { backgroundColor },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TAB_BAR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT - ACTIVE_INDICATOR_HEIGHT,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabButton: {
    minWidth: MIN_TAB_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 12,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeLabel: {
    fontWeight: '700',
  },
  activeBackground: {
    position: 'absolute',
    top: 8,
    left: 4,
    right: 4,
    bottom: 8,
    borderRadius: 12,
    zIndex: 1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: ACTIVE_INDICATOR_HEIGHT,
    borderRadius: ACTIVE_INDICATOR_HEIGHT / 2,
  },
  fadeBase: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 10,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
  gradientRight: {
    flex: 1,
    opacity: 0.9,
  },
});