export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  // Utiliser le proxy Next.js pour éviter les problèmes CORS
  // Construit l'URL pour utiliser le rewrite configuré dans next.config.js
  const apiPath = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  
  const response = await fetch(apiPath, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Non authentifié');
    }
    throw new Error('Une erreur est survenue');
  }

  const data = await response.json();
  return data;
};

export const formatPlaylistData = (playlist) => ({
  id: playlist._id,
  name: playlist.name,
  creator: playlist.userId?.username || 'Utilisateur inconnu',
  totalTracks: playlist.totalTracks || 0,
}); 