package com.gestion_transactions.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@EqualsAndHashCode(exclude = {"accounts", "banks"})
@ToString(exclude = {"accounts", "banks"})
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;

    // balance supprimée : elle est portée par chaque Account
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Account> accounts;    

    @ManyToMany
    @JoinTable(
            name = "user_banks",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "bank_id")
    )
    @JsonIgnoreProperties("users")
    private Set<Bank> banks = new HashSet<>();

    public void addBank(Bank bank) {
        this.banks.add(bank);
    }

    public void removeBank(Bank bank) {
        this.banks.remove(bank);
    }
}