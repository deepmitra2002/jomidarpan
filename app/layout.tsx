import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'জমিদর্পণ · জমি কেনার আগে যাচাই',description:'জমির তথ্য খুঁজুন, বিক্রেতার নথি তুলনা করুন এবং প্রমাণ দেখুন।'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="bn"><body>{children}</body></html>}
