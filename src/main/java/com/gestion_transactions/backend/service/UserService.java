package com.gestion_transactions.backend.service;

import com.gestion_transactions.backend.model.User;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.gestion_transactions.backend.repository.UserRepository;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;



    public User createUser (User user){
        if (user.getBalance() == null) user.setBalance(0.0);
        return userRepository.save(user);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User deposit(Long id, Double amount) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setBalance(user.getBalance() + amount);
        return userRepository.save(user);
    }

    public User withdraw(Long id, Double amount) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getBalance() < amount) {
            throw new RuntimeException("Solde insuffisant !");
        }
        user.setBalance(user.getBalance() - amount);
        return userRepository.save(user);
    }
    

}
