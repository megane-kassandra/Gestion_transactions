package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.service.TransactionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.http.ResponseEntity;
import com.gestion_transactions.backend.repository.TransactionRepository;


@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @Autowired private TransactionService transactionService;

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
    public ResponseEntity<?> withdraw(@RequestParam Long id, @RequestParam Double amount) {
        try {
            return ResponseEntity.ok(transactionService.withdraw(id, amount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}