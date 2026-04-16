package com.gestion_transactions.backend.service; // Remplacez par votre nom de package


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.UserRepository;

@Service
public class TransactionService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User deposit(Long userId, Double amount) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        user.setBalance(user.getBalance() + amount);
        return userRepository.save(user);
    }

    @Transactional
    public User withdraw(Long userId, Double amount) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (user.getBalance() < amount) {
            throw new RuntimeException("Solde insuffisant !");
        }

        user.setBalance(user.getBalance() - amount);
        return userRepository.save(user);
    }
}