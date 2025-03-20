export const extractBaseUrl = (signedUrl) => {
  if (!signedUrl) return null;
  try {
    const url = new URL(signedUrl);
    const baseUrl = url.origin + url.pathname;
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
  if (!token) {
    throw new Error('Non authentifié');
  }

  try {
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
      throw new Error(data.message || 'Une erreur est survenue');
    }
    
    return data;
  } catch (error) {
    throw new Error(error.message || 'Une erreur est survenue lors de la requête');
  }
};

export const uploadAlbumCover = async (file, albumTitle) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('prefix', `album-${albumTitle}`);

  const response = await fetchWithAuth('/api/upload/image', {
    method: 'POST',
    body: formData,
    headers: {
      ...Object.fromEntries(
        Object.entries(fetchWithAuth.headers || {}).filter(([key]) => key.toLowerCase() !== 'content-type')
      )
    }
  });

  return response.urls;
};

export const formatAlbumData = (album) => ({
  id: album.id || album._id,
  title: album.title,
  genres: Array.isArray(album.genres) ? album.genres : [album.genres],
  releaseDate: album.releaseDate,
  type: album.type,
  trackCount: album.trackCount || 0,
  coverImage: album.coverImage || null
});

// Récupérer les pistes disponibles pour un album
export const getAvailableTracksForAlbum = async (albumId) => {
  return await fetchWithAuth(`/api/albums/${albumId}/available-tracks`);
};

// Mettre à jour les pistes d'un album
export const updateAlbumTracks = async (albumId, trackIds) => {
  return await fetchWithAuth(`/api/albums/${albumId}/tracks`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds })
  });
};

// Récupérer les pistes d'un artiste
export const getArtistTracks = async (artistId) => {
  return await fetchWithAuth(`/api/artists/${artistId}/top-tracks`);
};

export const searchArtists = async (query) => {
  if (!query || query.length < 2) return { success: true, data: [] };
  
  try {
    return await fetchWithAuth(`/api/artists/search?query=${encodeURIComponent(query)}`);
  } catch (error) {
    return { success: false, data: [] };
  }
}; 