package com.gestion_transactions.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gestion_transactions.backend.model.User;

@Repository // Indique que c'est le composant d'accès aux données
public interface UserRepository extends JpaRepository<User, Long> {
    // Rien à écrire ici, JpaRepository fait tout le travail !
}