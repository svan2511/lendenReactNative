import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_CONFIG = [
  { name: 'index', title: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'billing', title: 'Billing', icon: 'receipt', iconOutline: 'receipt-outline', href: null },
  { name: 'customers', title: 'Customers', icon: 'people', iconOutline: 'people-outline' },
  { name: 'products', title: 'Products', icon: 'layers', iconOutline: 'layers-outline' },
  { name: 'profile', title: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  { name: 'reports', title: 'Reports', icon: 'stats-chart', iconOutline: 'stats-chart-outline' },
] as const;

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [tabMeasurements, setTabMeasurements] = React.useState<{[key: string]: {x: number, width: number}}>({});
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  const indicatorPosition = React.useRef(new Animated.Value(0)).current;

  const activeRoute = state.routes[state.index];

  React.useEffect(() => {
    const measurement = tabMeasurements[activeRoute.name];
    if (measurement && scrollViewRef.current) {
      // Calculate center position of the tab
      const centerX = measurement.x + (measurement.width / 2) - 10; // 10 is half of indicator width (20)
      
      Animated.spring(indicatorPosition, {
        toValue: centerX,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();

      // Auto-scroll to keep active tab visible
      const scrollTo = measurement.x - (containerWidth / 2) + (measurement.width / 2);
      scrollViewRef.current.scrollTo({
        x: Math.max(0, scrollTo),
        animated: true,
      });
    }
  }, [state.index, tabMeasurements, containerWidth]);

  const measureTab = (name: string) => (event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabMeasurements(prev => ({ ...prev, [name]: { x, width } }));
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        scrollEnabled={TAB_CONFIG.length > 4}
        contentContainerStyle={styles.scrollContent}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const config = TAB_CONFIG.find(t => t.name === route.name);
            if (!config) return null;
            
            const isFocused = state.index === index;
            
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  if (isFocused) {
                    // Already on this tab → reset stack to root (index screen)
                    navigation.reset({
                      index: 0,
                      routes: [{ name: route.name }],
                    });
                  } else {
                    navigation.navigate(route.name);
                  }
                }}
                onLayout={measureTab(route.name)}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconBox,
                  isFocused && styles.activeIconBox
                ]}>
                  <Ionicons
                    name={isFocused ? config.icon : config.iconOutline as any}
                    size={24}
                    color={isFocused ? '#007AFF' : '#8E8E93'}
                  />
                </View>
                
                <Text style={[
                  styles.label,
                  isFocused && styles.activeLabel
                ]}>
                  {config.title}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Animated Indicator inside the row */}
          <Animated.View
            style={[
              styles.indicator,
              { transform: [{ translateX: indicatorPosition }] }
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: tab.href,  // null for billing → treats it as directory with its own _layout
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    height: 65,
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 8,
    position: 'relative', // For indicator positioning
  },
  tabButton: {
    minWidth: 70,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -6
  },
  activeIconBox: {
    //backgroundColor: 'rgba(0,122,255,0.1)',
  },
  label: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#007AFF',
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    width: 20,
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginLeft: 0, // Will be offset by translateX
  },
});