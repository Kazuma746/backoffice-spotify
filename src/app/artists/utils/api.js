export const extractBaseUrl = (signedUrl) => {
  if (!signedUrl) return null;
  try {
    const url = new URL(signedUrl);
    // Supprimer tous les paramètres de requête AWS
    const baseUrl = url.origin + url.pathname;
    // Supprimer les éventuels encodages d'URL doubles
    return decodeURIComponent(decodeURIComponent(baseUrl));
  } catch (e) {
    return signedUrl;
  }
};

export const getAuthToken = () => {
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('token='));
  if (!cookie) return null;
  return cookie.split('=')[1];
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getAuthToken();
  if (!token) throw new Error('Non authentifié');

  // Utiliser le proxy Next.js pour éviter les problèmes CORS
  // Construit l'URL pour utiliser le rewrite configuré dans next.config.js
  const apiPath = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;

  const response = await fetch(apiPath, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Response Error:', {
      status: response.status,
      statusText: response.statusText,
      data,
      endpoint,
      apiPath
    });
    throw new Error(data.message || 'Une erreur est survenue');
  }
  return data;
};

export const uploadArtistImage = async (file, artistName) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('prefix', `artist-${artistName}`);

  const response = await fetchWithAuth('/api/upload/image', {
    method: 'POST',
    body: formData,
    // Ne pas définir Content-Type, il sera automatiquement défini avec le boundary
    headers: {
      // Supprimer le Content-Type pour laisser le navigateur le gérer avec FormData
      ...Object.fromEntries(
        Object.entries(fetchWithAuth.headers || {}).filter(([key]) => key.toLowerCase() !== 'content-type')
      )
    }
  });

  return response.urls;
};

export const formatArtistData = (artist) => ({
  id: artist.id || artist._id,
  name: artist.name,
  genres: Array.isArray(artist.genres) ? artist.genres : [artist.genres],
  popularity: artist.popularity || 0,
  imageUrl: artist.image?.thumbnail || artist.image?.medium || artist.image?.large || artist.imageUrl || null
}); 