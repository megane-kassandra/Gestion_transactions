package com.gestion_transactions.backend.service;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    // Méthode pour créer un compte pour un utilisateur
    public Account createAccount(Long userId, Double initialBalance) {
        // 1. On cherche l'utilisateur dans la base de données
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + userId));

        // 2. On crée le nouveau compte
        Account account = new Account();
        account.setUser(user);
        account.setBalance(initialBalance != null ? initialBalance : 0.0);
        
        // On génère un faux numéro de compte (8 caractères aléatoires)
        String accountNumber = "ACC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        account.setAccountNumber(accountNumber);

        // 3. On sauvegarde dans la base de données
        return accountRepository.save(account);
    }
}