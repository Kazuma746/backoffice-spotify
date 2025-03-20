'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Header, Title, Button, ErrorMessage } from './styles/AlbumStyles';
import AlbumTable from './components/AlbumTable';
import AlbumModal from './components/AlbumModal';
import * as api from './utils/api';
import Pagination from './components/Pagination';
import CreateAlbumModal from './components/CreateAlbumModal';
import EditAlbumModal from './components/EditAlbumModal';
import { createAlbum, updateAlbum } from './utils/albumActions';

// Composant interne qui utilise useSearchParams
function AlbumsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalAlbums, setTotalAlbums] = useState(0);
  const itemsPerPage = 10;

  // Récupérer la page depuis l'URL ou utiliser 1 par défaut
  const currentPage = parseInt(searchParams.get('page') || '1');

  const updatePageInUrl = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/albums?${params.toString()}`);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchAlbums();
  }, [user, loading, currentPage]);

  const fetchAlbums = async () => {
    try {
      const data = await api.fetchWithAuth(`/api/albums?page=${currentPage}&limit=${itemsPerPage}`);
      
      const detailPromises = data.data.map(album => {
        return Promise.all([
          api.fetchWithAuth(`/api/albums/${album.id}`),
          api.fetchWithAuth(`/api/albums/${album.id}/tracks`)
        ]);
      });

      const detailedResults = await Promise.all(detailPromises);

      const formattedAlbums = data.data.map((album, index) => {
        const [albumDetails, tracksDetails] = detailedResults[index];
        const detailedAlbum = albumDetails.data;
        
        return {
          id: album.id,
          title: album.title || 'Album Inconnu',
          artist: detailedAlbum.artistId?.name || 'Artiste inconnu',
          artistId: detailedAlbum.artistId?._id,
          genres: detailedAlbum.genres || [],
          releaseDate: detailedAlbum.releaseDate,
          type: detailedAlbum.type || 'album',
          trackCount: Array.isArray(tracksDetails.data) ? tracksDetails.data.length : 0,
          tracks: Array.isArray(tracksDetails.data) ? tracksDetails.data : [],
          coverImage: {
            thumbnail: album.coverUrl || null,
            medium: album.coverUrl || null,
            large: album.coverUrl || null
          }
        };
      });
      
      setAlbums(formattedAlbums);
      setTotalPages(Math.ceil(data.pagination?.totalItems / itemsPerPage) || 1);
      setTotalAlbums(data.pagination?.totalItems || 0);
      setError('');
    } catch (error) {
      console.error('Erreur dans fetchAlbums:', error);
      setError(error.message);
      if (error.message === 'Non authentifié') router.push('/login');
    }
  };

  const handleEdit = (album) => {
    setSelectedAlbum(album);
    setIsEditModalOpen(true);
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet album ?')) return;

    try {
      await api.fetchWithAuth(`/api/albums/${id}`, { method: 'DELETE' });
      await fetchAlbums();
      setError('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const urls = await api.uploadAlbumCover(file, selectedAlbum.title);
      if (urls?.thumbnail) {
        setSelectedAlbum(prev => ({
          ...prev,
          coverImage: urls.thumbnail
        }));
      }
      return urls;
    } catch (error) {
      setError("Erreur lors de l'upload de l'image: " + error.message);
      throw error;
    }
  };

  const handleSubmit = async (albumData) => {
    try {
      let response;
      
      if (selectedAlbum) {
        response = await updateAlbum(selectedAlbum.id, albumData);
      } else {
        response = await createAlbum(albumData);
      }

      if (response.success) {
        await fetchAlbums();
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setSelectedAlbum(null);
        setError('');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.message || 'Une erreur est survenue lors de la création/modification de l\'album');
    }
  };

  if (loading) return <Container>Chargement...</Container>;
  if (!user) return null;

  return (
    <Container>
      <Header>
        <Title>Albums ({totalAlbums})</Title>
        <Button onClick={handleCreate}>
          Nouvel album
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <AlbumTable 
        albums={albums}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination 
        page={currentPage}
        totalPages={totalPages}
        onPageChange={updatePageInUrl}
      />

      <CreateAlbumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <EditAlbumModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAlbum(null);
        }}
        onSubmit={handleSubmit}
        album={selectedAlbum}
      />
    </Container>
  );
}

// Composant principal qui enveloppe dans Suspense
export default function AlbumsPage() {
  return (
    <Suspense fallback={<Container>Chargement...</Container>}>
      <AlbumsContent />
    </Suspense>
  );
} 