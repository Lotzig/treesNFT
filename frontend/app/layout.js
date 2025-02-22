import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider"
import { Toaster } from "@/components/ui/toaster"
import Layout from "@/components/shared/Layout"
import "./globals.css"
import { Inter as FontSans } from "next/font/google"
 
import { cn } from "@/lib/utils"
 
const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {
  title: "TreesNFT",
  description: "Buy a tree, get a yield NFT and carbon credits",
};
 
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <RainbowKitAndWagmiProvider>
          <Layout>
            {children}
          </Layout>
        </RainbowKitAndWagmiProvider>
        <Toaster />
      </body>
    </html>
  )
}
