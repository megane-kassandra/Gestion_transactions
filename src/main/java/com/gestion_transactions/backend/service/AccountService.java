package com.gestion_transactions.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.BankRepository;
import com.gestion_transactions.backend.repository.UserRepository;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BankRepository bankRepository;

    public Account createAccount(Long userId, Long bankId, Double initialBalance) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + userId));

        Bank bank = bankRepository.findById(bankId)
                .orElseThrow(() -> new RuntimeException("Banque non trouvée avec l'ID: " + bankId));

        if (!bank.getActive()) {
            throw new RuntimeException("La banque '" + bank.getName() + "' est désactivée.");
        }

        Account account = new Account();
        account.setUser(user);
        account.setBank(bank);
        account.setBalance(initialBalance != null ? initialBalance : 0.0);
        account.setAccountNumber("ACC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        if (user.getBanks() == null) {
            user.setBanks(new java.util.HashSet<>());
        }
        user.getBanks().add(bank);
        userRepository.save(user);

        return accountRepository.save(account);
    }

    public List<Account> getAccountsByUser(Long userId) {
        return accountRepository.findByUserId(userId);
    }

    public List<Account> getAccountsByBank(Long bankId) {
        return accountRepository.findByBankId(bankId);
    }

    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compte non trouvé avec l'ID: " + id));
    }
}