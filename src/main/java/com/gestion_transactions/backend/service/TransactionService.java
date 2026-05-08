package com.gestion_transactions.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.TransactionRepository;

@Service
public class TransactionService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Transaction deposit(Long accountId, Double amount,
                               String depositorName, String depositorPhone) {

        if (amount <= 0) throw new RuntimeException("Le montant du dépôt doit être positif.");
        if (depositorName == null || depositorName.isBlank()) {
            throw new RuntimeException("Le nom du déposant est obligatoire.");
        }

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte introuvable avec l'ID: " + accountId));

        double feeRate = acc.getBank().getDepositFee() / 100.0;
        double fee = amount * feeRate;
        double netAmount = amount - fee;

        if (netAmount <= 0) {
            throw new RuntimeException("Le montant du dépôt doit être supérieur aux frais de dépôt.");
        }

        acc.setBalance(acc.getBalance() + netAmount);
        accountRepository.save(acc);

        Transaction t = new Transaction();
        t.setAccount(acc);
        t.setBank(acc.getBank());
        t.setType("DEPOT");
        t.setAmount(amount);
        t.setFee(fee);
        t.setNetAmount(netAmount);
        t.setDepositorName(depositorName);
        t.setDepositorPhone(depositorPhone);
        t.setDate(LocalDateTime.now());
        transactionRepository.save(t);

        // Notification temps réel vers l'admin
        messagingTemplate.convertAndSend("/topic/transactions", t);
        return t;
    }

    @Transactional
    public Transaction withdraw(Long accountId, Double amount) {

        if (amount <= 0) throw new RuntimeException("Le montant du retrait doit être positif.");

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte introuvable avec l'ID: " + accountId));

        // Vérification de la limite de retrait quotidienne
        LocalDateTime today = LocalDateTime.now();
        Double totalWithdrawnToday = transactionRepository.getTotalWithdrawalsToday(acc.getUser().getId(), acc.getBank().getId(), today);
        if (totalWithdrawnToday == null) {
            totalWithdrawnToday = 0.0;
        }

        if (totalWithdrawnToday + amount > acc.getBank().getDailyWithdrawalLimit()) {
            throw new RuntimeException(String.format(
                "Limite de retrait quotidienne dépassée. Déjà retiré aujourd'hui: %.2f FCFA. Limite autorisée: %.2f FCFA. Tentative de retrait: %.2f FCFA.",
                totalWithdrawnToday, acc.getBank().getDailyWithdrawalLimit(), amount
            ));
        }

        double feeRate = acc.getBank().getWithdrawalFee() / 100.0;
        double fee = amount * feeRate;
        double totalDeducted = amount + fee;

        if (acc.getBalance() < totalDeducted) {
            throw new RuntimeException(String.format(
                "Solde insuffisant. Requis: %.2f FCFA (montant: %.2f + frais: %.2f). Solde actuel: %.2f FCFA",
                totalDeducted, amount, fee, acc.getBalance()
            ));
        }

        acc.setBalance(acc.getBalance() - totalDeducted);
        accountRepository.save(acc);

        Transaction t = new Transaction();
        t.setAccount(acc);
        t.setBank(acc.getBank());
        t.setType("RETRAIT");
        t.setAmount(amount);
        t.setFee(fee);
        t.setNetAmount(amount); // l'utilisateur reçoit "amount", les frais sont en plus
        t.setDate(LocalDateTime.now());
        transactionRepository.save(t);

        // Notification temps réel vers l'admin
        messagingTemplate.convertAndSend("/topic/transactions", t);
        return t;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<Transaction> getTransactionsByUser(Long userId) {
        return transactionRepository.findByAccountUserId(userId);
    }

    public List<Transaction> getTransactionsByAccount(Long accountId) {
        return transactionRepository.findByAccountId(accountId);
    }

    public List<Transaction> getTransactionsByType(String type) {
        return transactionRepository.findByType(type.toUpperCase());
    }
}