// types/navigation.ts

// Define your payment data and method types
export type PaymentData = {
  payment_name: string;
  reference: string;
  pay_code?: string;
  amount: number;
  checkout_url?: string;
  instructions?: Array<{
    title: string;
    steps: string[];
  }>;
  payment_method?: {
    icon_url: string;
  };
};

export type PaymentMethod = {
  group: string;
  code: string;
  name: string;
  type: string;
  icon_url: string;
  // Add other properties as needed from your API response
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  HomeScreen: undefined;
  InformationDetail: undefined;
  EditProfile: undefined;
  HistoryBalance: undefined;
  Withdraw: undefined;
  Tiket: undefined;
  TiketDetail: { id: number };
  Tagihan: undefined;
  TagihanDetail: { tagihanId: number };
  PaymentInstruction: {
    paymentData: PaymentData;
    paymentMethod: PaymentMethod;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}