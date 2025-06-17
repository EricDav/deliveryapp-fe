const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'folixx-delivery-app';

export const encryptData = async (data: string): Promise<string> => {
  const CryptoJS = (await import('crypto-js')).default;
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = async (encryptedData: string): Promise<string> => {
  const CryptoJS = (await import('crypto-js')).default;
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
