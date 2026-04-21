package com.gestion_transactions.backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.UserRepository;

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

    
    public User updateUser(Long id, User details) {
        User user = userRepository.findById(id).orElseThrow();
        user.setName(details.getName());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

}
