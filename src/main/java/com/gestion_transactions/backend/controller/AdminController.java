package com.gestion_transactions.backend.controller;

import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.service.TransactionService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.gestion_transactions.backend.repository.TransactionRepository;

import java.util.List;

import org.springframework.http.ResponseEntity;



@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired private TransactionService transactionService;

    @GetMapping("/logs")
    public List<Transaction> getHistory() {
        return transactionService.getAllTransactions();
    }
}