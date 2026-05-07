package com.gestion_transactions.backend.service;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BankService bankService;

    public User createUser(User user) {
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Un utilisateur avec l'email '" + user.getEmail() + "' existe déjà.");
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
    }

    public User updateUser(Long id, User details) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
        user.setName(details.getName());
        user.setEmail(details.getEmail());
        user.setPhone(details.getPhone());
        return userRepository.save(user);
    }

    public User addBankToUser(Long userId, Long bankId) {
        User user = getUserById(userId);
        Bank bank = bankService.getBankById(bankId);
        if (!bank.getActive()) {
            throw new RuntimeException("Impossible d'ajouter une banque désactivée.");
        }
        user.getBanks().add(bank);
        return userRepository.save(user);
    }

    public User removeBankFromUser(Long userId, Long bankId) {
        User user = getUserById(userId);
        Bank bank = bankService.getBankById(bankId);
        user.getBanks().remove(bank);
        return userRepository.save(user);
    }

    public Set<Bank> getBanksForUser(Long userId) {
        User user = getUserById(userId);
        return user.getBanks();
    }

    public void deleteUser(Long id) {
        userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));
        userRepository.deleteById(id);
    }
}