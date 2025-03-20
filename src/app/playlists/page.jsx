"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from '../utils/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Header, Title, Button, ErrorMessage } from './styles/PlaylistStyles';
import PlaylistTable from './components/PlaylistTable';
import EditPlaylistModal from './components/EditPlaylistModal';
import Pagination from '../components/Pagination';
import * as api from './utils/api';

// Composant interne qui utilise useSearchParams
function PlaylistsContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [playlists, setPlaylists] = useState([]);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [totalPlaylists, setTotalPlaylists] = useState(0);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const itemsPerPage = 10;

    // Récupérer la page depuis l'URL ou utiliser 1 par défaut
    const currentPage = parseInt(searchParams.get('page') || '1');

    const updatePageInUrl = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`/playlists?${params.toString()}`);
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user) fetchPlaylists(currentPage);
    }, [user, loading, currentPage]);

    const fetchPlaylists = async (page = currentPage) => {
        try {
            const data = await api.fetchWithAuth(`/api/playlists?page=${page}&limit=${itemsPerPage}`);
            setPlaylists(data);
            setTotalPages(Math.ceil(data.length / itemsPerPage) || 1);
            setTotalPlaylists(data.length);
            setError('');
        } catch (error) {
            setError(error.message);
            if (error.message === 'Non authentifié') router.push('/login');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette playlist ?')) return;

        try {
            await api.fetchWithAuth(`/api/playlists/${id}`, { method: 'DELETE' });
            
            // Mettre à jour l'état local immédiatement
            setPlaylists(prevPlaylists => prevPlaylists.filter(playlist => playlist._id !== id));
            setError('');
            
            // Rafraîchir la liste
            fetchPlaylists(currentPage);
        } catch (error) {
            setError(error.message || "Erreur lors de la suppression de la playlist");
        }
    };

    const handleEdit = (playlist) => {
        setSelectedPlaylist(playlist);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedPlaylist(null);
    };

    const handleModalSubmit = async (formData) => {
        try {
            if (selectedPlaylist) {
                // Mode édition
                await api.fetchWithAuth(`/api/playlists/${selectedPlaylist._id}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                // Mode création
                await api.fetchWithAuth('/api/playlists', {
                    method: 'POST',
                    body: formData
                });
            }
            
            setError('');
            handleModalClose();
            fetchPlaylists(currentPage);
        } catch (error) {
            setError(error.message || "Une erreur est survenue");
        }
    };

    if (loading) return <Container>Chargement...</Container>;
    if (!user) return null;

    return (
        <Container>
            <Header>
                <Title>Playlists ({totalPlaylists})</Title>
                <Button onClick={() => {
                    setSelectedPlaylist(null);
                    setIsModalOpen(true);
                }}>
                    Nouvelle Playlist
                </Button>
            </Header>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <PlaylistTable 
                playlists={playlists}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Pagination 
                page={currentPage}
                totalPages={totalPages}
                onPageChange={updatePageInUrl}
            />

            <EditPlaylistModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
                playlist={selectedPlaylist}
            />
        </Container>
    );
}

// Composant principal qui enveloppe dans Suspense
export default function PlaylistsPage() {
    return (
        <Suspense fallback={<Container>Chargement...</Container>}>
            <PlaylistsContent />
        </Suspense>
    );
} 