export const createArtist = async (name) => {
  const artistData = {
    name,
    genres: [],
    popularity: 0,
    image: {
      thumbnail: null,
      medium: null,
      large: null
    }
  };

  const response = await fetchWithAuth('/api/artists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(artistData)
  });

  return response;
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

  if (!response.ok) {
    const text = await response.text();
    let message;
    try {
      const json = JSON.parse(text);
      message = json.message || 'Une erreur est survenue';
    } catch (e) {
      message = `Erreur ${response.status}: ${text}`;
    }
    throw new Error(message);
  }

  try {
    const data = await response.json();
    return data;
  } catch (e) {
    throw new Error('Réponse invalide du serveur');
  }
};

export const uploadTrackAudio = async (file) => {
  try {
    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetchWithAuth('/api/backoffice/upload/audio', {
      method: 'POST',
      body: formData,
      headers: {
        // Ne pas définir Content-Type ici, il sera automatiquement défini avec le boundary correct
        'Accept': 'application/json',
      }
    });

    if (!response.success) {
      throw new Error(response.message || "Erreur lors de l'upload du fichier audio");
    }

    return {
      success: true,
      url: response.url,
      duration: response.duration
    };
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    throw error;
  }
};

// Fonction pour lire les métadonnées d'un fichier audio
const readAudioMetadata = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Utilisation de l'API Web Audio pour extraire la durée
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(e.target.result);
        
        resolve({
          duration: Math.floor(audioBuffer.duration),
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        });
      } catch (error) {
        console.error('Erreur lors de la lecture des métadonnées:', error);
        resolve({
          duration: 0,
          sampleRate: 44100,
          numberOfChannels: 2
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const formatTrackData = (track) => ({
  id: track.id || track._id,
  title: track.title,
  albumId: track.albumId,
  artist: track.artist?.name || 'Artiste Inconnu',
  album: track.album?.title || 'Album Inconnu',
  duration: track.duration || 0,
  trackNumber: track.trackNumber || 1,
  audioUrl: track.audioUrl || null,
  featuring: Array.isArray(track.featuring) ? track.featuring : [],
  genres: Array.isArray(track.genres) ? track.genres : []
}); 