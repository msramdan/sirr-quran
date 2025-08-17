import {api} from '../utils/axios';

export interface TagihanHistory {
  id: number;
  no_tagihan: string;
  pelanggan_id: number;
  periode: string;
  metode_bayar: 'Cash' | 'Transfer Bank' | 'Payment Tripay' | null;
  status_bayar: 'Sudah Bayar' | 'Belum Bayar' | 'Waiting Review';
  nominal_bayar: number;
  potongan_bayar: number;
  ppn: 'Yes' | 'No' | null;
  nominal_ppn: number;
  total_bayar: number;
  tanggal_bayar: string | null;
  tanggal_review: string | null;
  tanggal_create_tagihan: string;
  tanggal_kirim_notif_wa: string | null;
  is_send: 'Yes' | 'No';
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  group: string;
  code: string;
  name: string;
  type: string;
  fee_merchant: {
    flat: number;
    percent: number;
  };
  fee_customer: {
    flat: number;
    percent: number;
  };
  total_fee: {
    flat: number;
    percent: string;
  };
  minimum_fee: number | null;
  maximum_fee: number | null;
  minimum_amount: number;
  maximum_amount: number;
  icon_url: string;
  active: boolean;
}

export interface PaymentMethodsResponse {
  success: boolean;
  message: string;
  data: {
    payment_methods: PaymentMethod[];
  };
}

export interface TransactionDetail {
  reference: string;
  merchant_ref: string;
  payment_selection_type: string;
  payment_method: string;
  payment_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  callback_url: string;
  return_url: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_code: string | null;
  pay_url: string | null;
  checkout_url: string | null;
  status: 'UNPAID' | 'PAID' | 'EXPIRED' | 'FAILED';
  paid_at: string | null;
  expired_at: string;
  instructions: Array<{
    title: string;
    steps: string[];
  }>;
  expired_time: number;
  created_at: string;
  updated_at: string;
}

export interface TagihanSearchResult {
  id: number;
  no_tagihan: string;
  pelanggan_id: number;
  periode: string;
  status_bayar: 'Sudah Bayar' | 'Belum Bayar' | 'Waiting Review';
  total_bayar: number;
  created_at: string;
}

export interface TagihanSearchResponse {
  success: boolean;
  data: TagihanSearchResult[];
  message?: string;
}

export interface TagihanDetail {
  id: number;
  no_tagihan: string;
  pelanggan_id: number;
  periode: string;
  metode_bayar: 'Cash' | 'Transfer Bank' | 'Payment Tripay' | null;
  bank_account_id: number | null;
  status_bayar: 'Sudah Bayar' | 'Belum Bayar' | 'Waiting Review';
  nominal_bayar: number;
  potongan_bayar: number;
  ppn: 'Yes' | 'No' | null;
  nominal_ppn: number;
  total_bayar: number;
  tanggal_bayar: string | null;
  tanggal_review: string | null;
  tanggal_create_tagihan: string;
  tanggal_kirim_notif_wa: string | null;
  payload_tripay: string | null;
  is_send: 'Yes' | 'No';
  created_by: number | null;
  reviewed_by: number | null;
  retry: number;
  created_at: string;
  updated_at: string;
}

export const fetchTagihanHistory = async (
  pelangganId: number,
  page = 1,
  limit = 10,
  filters?: {
    startDate?: string;
    endDate?: string;
    status?: 'Sudah Bayar' | 'Belum Bayar' | 'Waiting Review';
    metode_bayar?: 'Cash' | 'Transfer Bank' | 'Payment Tripay';
  },
) => {
  try {
    const response = await api.get(`/tagihan/pelanggan/${pelangganId}`, {
      params: {
        page,
        limit,
        ...(filters?.startDate && {start_date: filters.startDate}),
        ...(filters?.endDate && {end_date: filters.endDate}),
        ...(filters?.status && {status: filters.status}),
        ...(filters?.metode_bayar && {metode_bayar: filters.metode_bayar}),
      },
    });

    if (response.data.success) {
      return {
        data: response.data.data.data,
        total: response.data.data.total,
        page: response.data.data.page,
        limit: response.data.data.limit,
      };
    } else {
      console.warn('Failed to fetch Tagihan history:', response.data.message);
      return {data: [], total: 0, page, limit};
    }
  } catch (error) {
    console.error('Error fetching Tagihan history:', error);
    return {data: [], total: 0, page, limit};
  }
};

export const fetchTagihanDetail = async (tagihanId: number) => {
  try {
    const response = await api.get(`/tagihan/detail/${tagihanId}`);

    if (response.data.success) {
      return response.data.data.tagihan;
    } else {
      console.warn('Failed to fetch tagihan detail:', response.data.message);
      throw new Error(response.data.message || 'Gagal memuat detail tagihan');
    }
  } catch (error) {
    console.error('Error fetching tagihan detail:', error);
    throw error;
  }
};

export const fetchPaymentMethods =
  async (): Promise<PaymentMethodsResponse> => {
    try {
      const response = await api.get('/tagihan/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  };

export const payWithSaldo = async (tagihanId: number): Promise<any> => {
  try {
    const response = await api.post(`/tagihan/pay-with-saldo/${tagihanId}`);
    return response.data;
  } catch (error) {
    console.error('Error paying with saldo:', error);
    throw error;
  }
};

export const payWithMethod = async (
  tagihanId: number,
  methodCode: string,
): Promise<any> => {
  try {
    const response = await api.post(`/tagihan/pay-with-method/${tagihanId}`, {
      method_code: methodCode,
    });
    return response.data;
  } catch (error) {
    console.error('Error paying with method:', error);
    throw error;
  }
};

export const getTransactionDetail = async (reference: string): Promise<any> => {
  try {
    const response = await api.get(`/tagihan/transaction-detail/${reference}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    throw error;
  }
};

export const searchTagihan = async (pelangganId: number, query: string) => {
  try {
    const response = await api.get('/tagihan/search', {
      params: {
        pelanggan_id: pelangganId,
        query: query,
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data.data,
      };
    } else {
      console.warn('Search failed:', response.data.message);
      return {
        success: false,
        data: [],
      };
    }
  } catch (error) {
    console.error('Error searching tagihan:', error);
    return {
      success: false,
      data: [],
    };
  }
};
