package com.gestion_transactions.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.HashSet;
import java.util.Set;

@Data
@EqualsAndHashCode(exclude = "users")
@ToString(exclude = "users")
@Schema(name = "Bank", description = "Représente une banque et ses paramètres (frais, limites)")
@Entity
@Table(name = "banks")
public class Bank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Identifiant unique de la banque", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Column(nullable = false)
    @Schema(description = "Nom de la banque", example = "Union Banque Cameroun")
    private String name;

    @Column(nullable = false, unique = true)
    @Schema(description = "Code unique de la banque", example = "UBC")
    private String code;

    @Column(nullable = false)
    @Schema(description = "Frais de dépôt (en %)", example = "0.1")
    private Double depositFee = 0.0;

    @Column(nullable = false)
    @Schema(description = "Frais de retrait (en %)", example = "0.15")
    private Double withdrawalFee = 0.0; // en pourcentage, ex: 1.5 = 1.5%

    @Column(nullable = true)
    @Schema(description = "Limite quotidienne de retrait", example = "5000000")
    private Double dailyWithdrawalLimit = 10000.0; // limite de retrait quotidienne par défaut

    @Column(nullable = false)
    @Schema(description = "Indique si la banque est active", example = "true")
    private Boolean active = true;

    @ManyToMany(mappedBy = "banks")
    @JsonIgnoreProperties("banks")
    private Set<User> users = new HashSet<>();
}