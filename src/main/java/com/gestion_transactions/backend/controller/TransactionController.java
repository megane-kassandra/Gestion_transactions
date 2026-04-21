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
    public void deposit(@RequestParam Long id, @RequestParam Double amount) {
        transactionService.deposit(id, amount);
    }

    @PostMapping("/withdraw")
    public void withdraw(@RequestParam Long id, @RequestParam Double amount) {
        transactionService.withdraw(id, amount);
    }
}