'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '../utils/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Header, Title, Button, ErrorMessage } from './styles/UserStyles';
import UserTable from './components/UserTable';
import Pagination from './components/Pagination';
import UserModal from './components/UserModal';
import * as api from './utils/api';

// Composant interne qui utilise useSearchParams
function UsersContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  // Récupérer la page depuis l'URL ou utiliser 1 par défaut
  const currentPage = parseInt(searchParams.get('page') || '1');

  const updatePageInUrl = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/users?${params.toString()}`);
  };
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    if (user) fetchUsers(currentPage);
  }, [user, loading, currentPage]);


  const fetchUsers = async (page = currentPage) => {
    try {
      const data = await api.fetchWithAuth(`/api/users?page=${page}&limit=${itemsPerPage}`);
      
      const formattedUsers = data.map(api.formatUserData);
      // console.log(data);      
      setUsers(formattedUsers);
      setTotalPages(1);
      setTotalUsers(data.length);
      setError('');
      //console.log(users);
      
    } catch (error) {
      setError(error.message);
      if (error.message === 'Non authentifié') router.push('/login');
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      await api.fetchWithAuth(`/api/users/delete/${id}`, { method: 'DELETE' });
      
      // Mettre à jour l'état local immédiatement
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      setError('');
      
      // Rafraîchir la liste pour la page actuelle
      fetchUsers(currentPage);
    } catch (error) {
      setError(error.message || "Erreur lors de la suppression de l'utilisateur");
      // Rafraîchir la liste même en cas d'erreur pour s'assurer de la cohérence
      fetchUsers(currentPage);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSubmit = async (userData) => {
    try {
      if (selectedUser) {
        // Mode édition
        const formattedData = {
          username: userData.username,
          email: userData.email,
          accountType: userData.accountType,
          role: userData.role,
        };
        const response = await api.fetchWithAuth(`/api/users/profile/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedData)
        });        

        if (response.email) { // on check l'email histoire de vérifier si l'objet n'est pas vide      
          setError('');
          handleModalClose();
          fetchUsers(currentPage);
        }
      } else {
        // Mode création
        const response = await api.fetchWithAuth('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });

        if (response.success) {
          setError('');
          handleModalClose();
          // Rediriger vers la première page pour voir le nouveau user
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
        <Title>Utilisateurs ({totalUsers})</Title>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <UserTable  
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Pagination 
        page={currentPage}
        totalPages={totalPages}
        onPageChange={updatePageInUrl}
      />

      <UserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        user={selectedUser}
      />
    </Container>
  );
}

// Composant principal qui enveloppe dans Suspense
export default function UsersPage() {
  return (
    <Suspense fallback={<Container>Chargement...</Container>}>
      <UsersContent />
    </Suspense>
  );
} 