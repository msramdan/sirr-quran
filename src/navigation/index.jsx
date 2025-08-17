import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Splash from '../screens/splash';
import BottomTabsNavigation from './BottomTabsNavigation';
import DetailSurahScreen from '../screens/quran/detail';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={Splash}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QuranScreen"
          component={BottomTabsNavigation}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DetailSurah"
          component={DetailSurahScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
