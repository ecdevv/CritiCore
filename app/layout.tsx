import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "./components/navbar/Navbar";
import Footer from "./components/footer/Footer";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://criticore.vercel.app/"),
  title: {
    default: "Criticore | Video Game Reviews",
    template: "%s | Criticore"
  },
  description: "Discover the ultimate hub for video game review!",
  openGraph: {
    title: "Criticore | Video Game Reviews",
    description: "Discover the ultimate hub for video game review!",
    type: "website",
    url: "https://criticore.vercel.app/",
    siteName: "Criticore",
    locale: "en_US",
    images: [
      {
        url: "/images/opengraph/opengraph-image.webp",
        alt: "Criticore Logo",
        width: 1200,
        height: 630
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content="Criticore" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
