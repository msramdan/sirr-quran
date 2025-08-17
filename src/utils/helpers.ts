// src/utils/helpers.ts

/**
 * Memformat angka menjadi format mata uang Rupiah (Rp 1.234.567).
 * @param amount Angka atau string angka yang akan diformat.
 * @returns String dalam format Rupiah.
 */
export const formatRupiah = (amount: number | string): string => {
  if (amount === null || amount === undefined) return '';

  const number_string = String(amount)
    .replace(/[^,\d]/g, '')
    .toString();
  const split = number_string.split(',');
  const sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    const separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }

  rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
  return rupiah;
};

/**
 * Mengonversi string format Rupiah (1.234.567) kembali menjadi angka.
 * @param rupiah String dalam format Rupiah.
 * @returns Angka murni.
 */
export const unformatRupiah = (rupiah: string): string => {
  if (!rupiah) return '';
  return rupiah.replace(/\./g, '');
};

export const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
