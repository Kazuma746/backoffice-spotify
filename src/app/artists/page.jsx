'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Header, Title, Button, ErrorMessage } from './styles/ArtistStyles';
import ArtistTable from './components/ArtistTable';
import Pagination from './components/Pagination';
import ArtistModal from './components/ArtistModal';
import * as api from './utils/api';

// Composant interne qui utilise useSearchParams
function ArtistsContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const itemsPerPage = 10;

  // Récupérer la page depuis l'URL ou utiliser 1 par défaut
  const currentPage = parseInt(searchParams.get('page') || '1');

  const updatePageInUrl = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/artists?${params.toString()}`);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchArtists(currentPage);
  }, [user, loading, currentPage]);

  const fetchArtists = async (page = currentPage) => {
    try {
      const data = await api.fetchWithAuth(`/api/artists?page=${page}&limit=${itemsPerPage}`);
      
      const formattedArtists = data.data.map(api.formatArtistData);
      
      setArtists(formattedArtists);
      setTotalPages(Math.ceil(data.pagination?.totalItems / itemsPerPage) || 1);
      setTotalArtists(data.pagination?.totalItems || 0);
      setError('');
      
    } catch (error) {
      setError(error.message);
      if (error.message === 'Non authentifié') router.push('/login');
    }
  };

  const handleEdit = (artist) => {
    setSelectedArtist(artist);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet artiste ?')) return;

    try {
      await api.fetchWithAuth(`/api/artists/${id}`, { method: 'DELETE' });
      
      // Mettre à jour l'état local immédiatement
      setArtists(prevArtists => prevArtists.filter(artist => artist.id !== id));
      setError('');
      
      // Rafraîchir la liste pour la page actuelle
      fetchArtists(currentPage);
    } catch (error) {
      setError(error.message || "Erreur lors de la suppression de l'artiste");
      // Rafraîchir la liste même en cas d'erreur pour s'assurer de la cohérence
      fetchArtists(currentPage);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArtist(null);
  };

  const handleModalSubmit = async (artistData) => {
    try {
      if (selectedArtist) {
        // Mode édition
        const formattedData = {
          name: artistData.name,
          genres: artistData.genres,
          popularity: selectedArtist.popularity || 0,
          image: selectedArtist.image
        };

        const response = await api.fetchWithAuth(`/api/artists/${selectedArtist.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });

        if (response.success) {
          setError('');
          handleModalClose();
          fetchArtists(currentPage);
        }
      } else {
        // Mode création
        const response = await api.fetchWithAuth('/api/artists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(artistData)
        });

        if (response.success) {
          setError('');
          handleModalClose();
          // Rediriger vers la première page pour voir le nouvel artiste
          updatePageInUrl(1);
        }
      }
    } catch (error) {
      setError(error.message || "Une erreur est survenue");
    }
  };

  if (loading) return <Container>Chargement...</Container>;
  if (!user) return null;

  return (
    <Container>
      <Header>
        <Title>Artistes ({totalArtists})</Title>
        <Button onClick={() => setIsModalOpen(true)}>
          Nouvel artiste
        </Button>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ArtistTable 
        artists={artists}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination 
        page={currentPage}
        totalPages={totalPages}
        onPageChange={updatePageInUrl}
      />

      <ArtistModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        artist={selectedArtist}
      />
    </Container>
  );
}

// Composant principal qui enveloppe dans Suspense
export default function ArtistsPage() {
  return (
    <Suspense fallback={<Container>Chargement...</Container>}>
      <ArtistsContent />
    </Suspense>
  );
} 