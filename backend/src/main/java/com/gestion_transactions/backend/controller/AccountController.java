package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getAccountsForUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(accountService.getAccountsByUser(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Créer un compte pour un utilisateur existant
    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createAccountForUser(
            @PathVariable Long userId,
            @RequestParam Long bankId,
            @RequestParam(required = false, defaultValue = "0.0") Double initialBalance) {

        try {
            Account newAccount = accountService.createAccount(userId, bankId, initialBalance);
            return ResponseEntity.ok(newAccount);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
