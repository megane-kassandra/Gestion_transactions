package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.http.ResponseEntity;

/* 

@RestController
@RequestMapping("/api/{id}/transactions")
public class TransactionController {

    @Autowired
    private UserService userService;


@PostMapping //("/{id}/deposit")
    public User deposit(@PathVariable Long id, @RequestParam Double amount) {
        return userService.deposit(id, amount);
    }

    @PostMapping //("/{id}/withdraw")
    public User withdraw(@PathVariable Long id, @RequestParam Double amount) {
        return userService.withdraw(id, amount);
    }

}

*/