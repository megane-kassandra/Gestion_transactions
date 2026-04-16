package com.gestion_transactions.backend.model; // Remplacez par votre nom de package

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "users") // Optionnel : donne un nom spécifique à la table
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Double balance; // Le solde de l'utilisateur

    // Getters et Setters
}