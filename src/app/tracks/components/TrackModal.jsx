import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Button } from '../styles/TrackStyles';
import * as api from '../utils/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #282828;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  margin: 20px;

  @media (max-width: 768px) {
    padding: 1.5rem;
    width: 95%;
  }

  /* Style de la scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1a1a;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 4px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
  max-width: 400px;

  @media (max-width: 768px) {
    margin-bottom: 1rem;
    max-width: 100%;
  }
`;

const Label = styled.label`
  display: block;
  color: white;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: #3E3E3E;
  border: 1px solid #404040;
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
  max-width: 400px;

  &:focus {
    outline: none;
    border-color: #1DB954;
  }

  @media (max-width: 768px) {
    padding: 0.625rem;
    max-width: 100%;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  background: #3E3E3E;
  border: 1px solid #404040;
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
  max-width: 400px;

  &:focus {
    outline: none;
    border-color: #1DB954;
  }

  @media (max-width: 768px) {
    padding: 0.625rem;
    max-width: 100%;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
  &.artist-select-wrapper,
  &.album-select-wrapper {
    z-index: 1001;
  }
`;

const ArtistList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #3E3E3E;
  border: 1px solid #404040;
  border-radius: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
`;

const ArtistItem = styled.li`
  padding: 0.75rem;
  cursor: pointer;
  color: white;

  &:hover {
    background: #4E4E4E;
  }

  &.new-artist {
    border-top: 1px solid #404040;
    color: #1DB954;
  }
`;

const TrackModal = ({ isOpen, onClose, onSubmit, track }) => {
  const [formData, setFormData] = useState({
    title: '',
    artistId: '',
    artistName: '',
    albumId: '',
    albumTitle: '',
    audioFile: null,
    genres: []
  });
  const [error, setError] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [albumSearch, setAlbumSearch] = useState('');
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [showArtistList, setShowArtistList] = useState(false);
  const [showAlbumList, setShowAlbumList] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [initialArtist, setInitialArtist] = useState(null);
  const artistWrapperRef = useRef(null);
  const albumWrapperRef = useRef(null);

  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title || '',
        artistId: track.artist?.id || track.artistId || '',
        artistName: track.artist?.name || '',
        albumId: track.album?.id || track.albumId || '',
        albumTitle: track.album?.title || '',
        genres: track.genres || []
      });
      setArtistSearch(track.artist?.name || '');
      setAlbumSearch(track.album?.title || '');
      setSelectedArtist({
        id: track.artist?.id || track.artistId,
        name: track.artist?.name || ''
      });
      setInitialArtist({
        id: track.artist?.id || track.artistId,
        name: track.artist?.name || ''
      });
      setSelectedAlbum({
        id: track.album?.id || track.albumId,
        title: track.album?.title || ''
      });
    } else {
      setFormData({
        title: '',
        artistId: '',
        artistName: '',
        albumId: '',
        albumTitle: '',
        audioFile: null,
        genres: []
      });
      setArtistSearch('');
      setAlbumSearch('');
      setSelectedArtist(null);
      setSelectedAlbum(null);
      setInitialArtist(null);
    }
  }, [track]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (artistWrapperRef.current && !artistWrapperRef.current.contains(event.target)) {
        setShowArtistList(false);
      }
      if (albumWrapperRef.current && !albumWrapperRef.current.contains(event.target)) {
        setShowAlbumList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setShowArtistList(false);
      setShowAlbumList(false);
    }
  }, [isOpen]);

  const searchArtists = async (query) => {
    if (!query.trim()) {
      setArtists([]);
      return;
    }

    try {
      const response = await api.fetchWithAuth(`/api/artists?name=${encodeURIComponent(query)}`);
      if (response.success) {
        setArtists(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des artistes:', error);
    }
  };

  const searchAlbums = async (query) => {
    if (!query.trim()) {
      setAlbums([]);
      return;
    }

    try {
      const response = await api.fetchWithAuth(`/api/albums?title=${encodeURIComponent(query)}`);
      if (response.success) {
        setAlbums(response.data);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche des albums:', error);
    }
  };

  const handleArtistSearch = (e) => {
    const value = e.target.value;
    setArtistSearch(value);
    setShowArtistList(true);
    searchArtists(value);
  };

  const handleAlbumSearch = (e) => {
    const value = e.target.value;
    setAlbumSearch(value);
    setShowAlbumList(true);
    searchAlbums(value);
  };

  const selectArtist = (artist) => {
    setSelectedArtist(artist);
    setArtistSearch(artist.name);
    setFormData(prev => ({
      ...prev,
      artistId: artist.id,
      artistName: artist.name
    }));
    setShowArtistList(false);
  };

  const selectAlbum = (album) => {
    setSelectedAlbum(album);
    setAlbumSearch(album.title);
    setFormData(prev => ({
      ...prev,
      albumId: album.id,
      albumTitle: album.title
    }));
    setShowAlbumList(false);
  };

  const handleGenresChange = (e) => {
    const genresArray = e.target.value.split(',').map(genre => genre.trim()).filter(genre => genre !== '');
    setFormData(prev => ({
      ...prev,
      genres: genresArray
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Le titre de la piste est requis");
      return;
    }

    if (!selectedArtist && !artistSearch.trim()) {
      setError("L'artiste est requis");
      return;
    }

    if (!selectedAlbum && !albumSearch.trim()) {
      setError("L'album est requis");
      return;
    }

    if (!track && !formData.audioFile) {
      setError("Le fichier audio est requis");
      return;
    }

    try {
      let artistId = selectedArtist?.id;
      let albumId = selectedAlbum?.id;

      // Créer un nouvel artiste seulement si :
      // - Nous ne sommes pas en mode édition OU l'artiste a été changé
      // - ET aucun artiste existant n'est sélectionné
      // - ET un nom d'artiste a été saisi
      if (!artistId && artistSearch.trim() && 
          (!track || (track && artistSearch !== initialArtist?.name))) {
        const newArtistResponse = await api.createArtist(artistSearch.trim());
        if (newArtistResponse.success) {
          artistId = newArtistResponse.data._id;
        } else {
          throw new Error("Erreur lors de la création de l'artiste");
        }
      }

      // Si nous sommes en mode édition et que l'artiste n'a pas changé, utiliser l'ID initial
      if (track && artistSearch === initialArtist?.name) {
        artistId = initialArtist.id;
      }

      // Créer un nouvel album seulement si nécessaire
      if (!albumId && albumSearch.trim() && artistId) {
        const newAlbumResponse = await api.fetchWithAuth('/api/albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: albumSearch.trim(),
            artistId: artistId,
            type: 'album',
            releaseDate: new Date().toISOString()
          })
        });

        if (newAlbumResponse.success) {
          albumId = newAlbumResponse.data._id;
        } else {
          throw new Error("Erreur lors de la création de l'album");
        }
      }

      let audioUrl = null;
      let duration = 0;

      // Upload du fichier audio seulement en création
      if (!track && formData.audioFile) {
        const uploadResponse = await api.uploadTrackAudio(formData.audioFile);
        if (uploadResponse.success) {
          audioUrl = uploadResponse.url;
          duration = uploadResponse.duration;
        }
      }

      // Préparer les données de la piste
      const trackData = {
        title: formData.title.trim(),
        artistId: artistId,
        albumId: albumId,
        genres: formData.genres
      };

      // Ajouter audioUrl et duration seulement en création
      if (!track) {
        trackData.audioUrl = audioUrl;
        trackData.duration = duration;
        trackData.trackNumber = 1;
      }

      console.log('Données de la piste à envoyer:', trackData);

      await onSubmit(trackData);
      setError('');
    } catch (error) {
      console.error('Erreur complète:', error);
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Titre *</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titre de la piste"
            />
          </FormGroup>

          <FormGroup>
            <Label>Artiste *</Label>
            <SelectWrapper ref={artistWrapperRef} className="artist-select-wrapper">
              <Input
                type="text"
                value={artistSearch}
                onChange={handleArtistSearch}
                onFocus={() => setShowArtistList(true)}
                placeholder="Rechercher un artiste..."
              />
              {showArtistList && (artistSearch || artists.length > 0) && (
                <ArtistList>
                  {artists.map(artist => (
                    <ArtistItem
                      key={artist.id}
                      onClick={() => selectArtist(artist)}
                    >
                      {artist.name}
                    </ArtistItem>
                  ))}
                  {artistSearch && !artists.find(a => a.name.toLowerCase() === artistSearch.toLowerCase()) && (
                    <ArtistItem
                      className="new-artist"
                      onClick={() => {
                        setSelectedArtist(null);
                        setShowArtistList(false);
                      }}
                    >
                      + Créer "{artistSearch}"
                    </ArtistItem>
                  )}
                </ArtistList>
              )}
            </SelectWrapper>
          </FormGroup>

          <FormGroup>
            <Label>Album *</Label>
            <SelectWrapper ref={albumWrapperRef} className="album-select-wrapper">
              <Input
                type="text"
                value={albumSearch}
                onChange={handleAlbumSearch}
                onFocus={() => setShowAlbumList(true)}
                placeholder="Rechercher un album..."
              />
              {showAlbumList && (albumSearch || albums.length > 0) && (
                <ArtistList>
                  {albums.map(album => (
                    <ArtistItem
                      key={album.id}
                      onClick={() => selectAlbum(album)}
                    >
                      {album.title}
                    </ArtistItem>
                  ))}
                  {albumSearch && !albums.find(a => a.title.toLowerCase() === albumSearch.toLowerCase()) && (
                    <ArtistItem
                      className="new-artist"
                      onClick={() => {
                        setSelectedAlbum(null);
                        setShowAlbumList(false);
                      }}
                    >
                      + Créer "{albumSearch}"
                    </ArtistItem>
                  )}
                </ArtistList>
              )}
            </SelectWrapper>
          </FormGroup>

          {!track && (
            <FormGroup>
              <Label>Fichier audio *</Label>
              <Input
                type="file"
                accept="audio/*"
                onChange={e => setFormData(prev => ({ ...prev, audioFile: e.target.files[0] }))}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="genres">Genres (séparés par des virgules)</Label>
            <Input
              type="text"
              id="genres"
              value={Array.isArray(formData.genres) ? formData.genres.join(', ') : ''}
              onChange={handleGenresChange}
              placeholder="Pop, Rock, Jazz..."
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Button type="submit" style={{ marginTop: '1.5rem' }}>
            {track ? 'Modifier' : 'Créer'}
          </Button>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default TrackModal; 