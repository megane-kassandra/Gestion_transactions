package com.gestion_transactions.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@EqualsAndHashCode(exclude = {"accounts", "banks"})
@ToString(exclude = {"accounts", "banks"})
@Schema(name = "User", description = "Représente un utilisateur du système")
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Identifiant unique", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Schema(description = "Nom complet de l'utilisateur", example = "Alice Dupont")
    private String name;

    @Schema(description = "Adresse e-mail", example = "alice@example.com")
    private String email;

    @Schema(description = "Numéro de téléphone", example = "+237690000000")
    private String phone;

    // balance supprimée : elle est portée par chaque Account
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    @Schema(hidden = true)
    private List<Account> accounts;    

        @ManyToMany
    @JoinTable(
            name = "user_banks",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "bank_id")
    )
    @JsonIgnoreProperties("users")
        @Schema(description = "Banques associées à l'utilisateur", hidden = true)
        private Set<Bank> banks = new HashSet<>();

    public void addBank(Bank bank) {
        this.banks.add(bank);
    }

    public void removeBank(Bank bank) {
        this.banks.remove(bank);
    }
}