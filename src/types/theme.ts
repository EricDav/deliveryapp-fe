export interface ThemeConfig {
  brand: {
    name: string;
    logo: string;
    textColor: string;
  };
  currency: {
    symbol: string;
    code: string;
  };
  status: {
    available: {
      color: string;
      text: string;
    };
    lowStock: {
      color: string;
      text: string;
    };
    unavailable: {
      color: string;
      text: string;
    };
  };
} 