package com.gestion_transactions.backend.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type; // "DEPOT" ou "RETRAIT"

    @Column(nullable = false)
    private Double amount; // montant brut demandé

    @Column(nullable = false)
    private Double fee; // frais appliqués

    @Column(nullable = false)
    private Double netAmount; // montant net (reçu ou déduit réellement)

    private String depositorName;  // rempli uniquement pour un DEPOT
    private String depositorPhone; // rempli uniquement pour un DEPOT

    @Column(nullable = false)
    private LocalDateTime date;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne
    @JoinColumn(name = "bank_id", nullable = false)
    private Bank bank;
}