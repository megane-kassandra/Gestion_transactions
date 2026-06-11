package com.gestion_transactions.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.gestion_transactions.backend.service.TransactionService;


@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @Autowired private TransactionService transactionService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getTransactionsForUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(transactionService.getTransactionsByUser(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(
            @RequestParam Long id,
            @RequestParam Double amount,
            @RequestParam String depositorName,
            @RequestParam String depositorPhone) {
        try {
            return ResponseEntity.ok(transactionService.deposit(id, amount, depositorName, depositorPhone));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestParam Long id,
            @RequestParam Double amount,
            @RequestParam String userName,
            @RequestParam String userPhone) {
        try {
            return ResponseEntity.ok(transactionService.withdraw(id, amount, userName, userPhone));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
