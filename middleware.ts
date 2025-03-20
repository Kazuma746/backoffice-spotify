import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Liste des chemins publics qui ne nécessitent pas d'authentification
const PUBLIC_PATHS = ['/login']

// Liste des chemins à ignorer complètement
const IGNORED_PATHS = [
  '/_next',
  '/api',
  '/static',
  '/favicon.ico',
  '/images',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('🔒 Middleware executing for path:', pathname)

  // Ignorer les ressources statiques et les appels API
  if (IGNORED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Vérifier si le chemin est public
  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const token = request.cookies.get('token')

  console.log('🍪 Token present:', !!token)
  console.log('📍 Is public path:', isPublicPath)

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!token && !isPublicPath) {
    console.log('⚠️ No token found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
  if (token && isPublicPath) {
    console.log('ℹ️ User already logged in, redirecting to home')
    const homeUrl = new URL('/', request.url)
    return NextResponse.redirect(homeUrl)
  }

  // Vérification du token pour toutes les routes protégées
  if (token && !isPublicPath) {
    try {
      console.log('🔍 Verifying token validity...')
      // Utiliser le proxy interne de Next.js pour éviter les problèmes CORS
      // Construire une URL absolue basée sur l'hôte actuel
      const baseUrl = request.nextUrl.origin
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (!response.ok) {
        console.log('❌ Token validation failed')
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }

      const userData = await response.json()
      console.log('👤 User role:', userData.role)
      
      if (userData.role !== 'admin') {
        console.log('🚫 Non-admin user, access denied')
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.log('💥 Error during token verification:', error)
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  console.log('✅ Access granted')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 