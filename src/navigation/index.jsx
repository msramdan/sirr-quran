import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTabsNavigation from './BottomTabsNavigation';
import Splash from '../screens/splash';
import Login from '../screens/login';
import InformationDetail from '../screens/informasi/detail';
import EditProfile from '../screens/profile/edit';
import HistoryBalanceScreen from '../screens/history-balance';
import WithdrawScreen from '../screens/withdraw';
import TiketScreen from '../screens/tiket';
import TiketDetailScreen from '../screens/tiket/detail';
import ForgotPassword from '../screens/forgot-password';
import TagihanScreen from '../screens/tagihan';
import TagihanDetailScreen from '../screens/tagihan/detail';
import PaymentInstructionScreen from '../screens/tagihan/PaymentInstructionScreen';
import TopupScreen from '../screens/topup';
import TopupCreateScreen from '../screens/topup/create';
import TopupDetailScreen from '../screens/topup/detail_topup';
import WithdrawEditScreen from '../screens/withdraw/edit';
import {SettingsProvider} from '../context/SettingsContext';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <SettingsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Splash">
          <Stack.Screen
            name="Splash"
            component={Splash}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="HomeScreen"
            component={BottomTabsNavigation}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="InformationDetail"
            component={InformationDetail}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfile}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="HistoryBalance"
            component={HistoryBalanceScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Withdraw"
            component={WithdrawScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="WithdrawEdit"
            component={WithdrawEditScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Topup"
            component={TopupScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TopupCreate"
            component={TopupCreateScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TopupDetail"
            component={TopupDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Tiket"
            component={TiketScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TiketDetail"
            component={TiketDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Tagihan"
            component={TagihanScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="TagihanDetail"
            component={TagihanDetailScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="PaymentInstruction"
            component={PaymentInstructionScreen}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}
