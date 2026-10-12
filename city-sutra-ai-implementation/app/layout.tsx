import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CitySutraShell } from '@/components/citysutra-shell'
export const metadata: Metadata={title:'CitySutra AI · Urban climate action twin',description:'Explainable neighborhood environmental evidence and actions for Delhi.',generator:'CitySutra AI'}
export const viewport:Viewport={colorScheme:'light',themeColor:'#f6f8f7',userScalable:false}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className="antialiased"><CitySutraShell>{children}</CitySutraShell>{process.env.NODE_ENV==='production'&&<Analytics/>}</body></html>}
