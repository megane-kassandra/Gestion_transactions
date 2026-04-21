package com.gestion_transactions.backend.service; // Remplacez par votre nom de package


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.TransactionRepository;
import java.util.List;
import java.time.LocalDateTime;


@Service
public class TransactionService {
    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;

    @Transactional
    public void deposit(Long accountId, Double amount) {
        Account acc = accountRepository.findById(accountId).orElseThrow();
        acc.setBalance(acc.getBalance() + amount);
        saveLog(acc, amount, "DEPOT");
    }

    @Transactional
    public void withdraw(Long accountId, Double amount) {
        Account acc = accountRepository.findById(accountId).orElseThrow();
        if(acc.getBalance() < amount) throw new RuntimeException("Solde insuffisant");
        acc.setBalance(acc.getBalance() - amount);
        saveLog(acc, amount, "RETRAIT");
    }

    private void saveLog(Account acc, Double amt, String type) {
        Transaction t = new Transaction();
        t.setAccount(acc); t.setAmount(amt); t.setType(type);
        t.setDate(LocalDateTime.now());
        transactionRepository.save(t);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}