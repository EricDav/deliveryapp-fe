import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CartProvider } from "../contexts/CartContext";
import { ThemeProvider } from '@/contexts/ThemeContext'
import { defaultTheme } from '@/config/theme'
import { Toaster } from "@/components/ui/toaster"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider initialTheme={defaultTheme}>
      <CartProvider>
        <div>
          <Component {...pageProps} />
          <div id="toast-container">
            <Toaster />
          </div>
        </div>
      </CartProvider>
    </ThemeProvider>
  );
}
