package com.gestion_transactions.backend.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Transaction;
import com.gestion_transactions.backend.model.User;
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
        if (depositorPhone == null || depositorPhone.isBlank()) {
            throw new RuntimeException("Le numéro de téléphone du déposant est obligatoire.");
        }

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte introuvable avec l'ID: " + accountId));

        validateUserInformation(acc.getUser(), depositorName, depositorPhone, "dépôt");

        double minDeposit = acc.getBank().getMinimumDepositAmount() != null
                ? acc.getBank().getMinimumDepositAmount() : 0.0;
        if (amount < minDeposit) {
            throw new RuntimeException(String.format(
                    "Le montant du dépôt doit être au moins %.2f FCFA pour la banque %s.",
                    minDeposit, acc.getBank().getName()));
        }

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
    public Transaction withdraw(Long accountId, Double amount, String userName, String userPhone) {

        if (amount <= 0) throw new RuntimeException("Le montant du retrait doit être positif.");
        if (userName == null || userName.isBlank()) {
            throw new RuntimeException("Le nom de l'utilisateur est obligatoire pour le retrait.");
        }
        if (userPhone == null || userPhone.isBlank()) {
            throw new RuntimeException("Le numéro de téléphone de l'utilisateur est obligatoire pour le retrait.");
        }

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Compte introuvable avec l'ID: " + accountId));

        validateUserInformation(acc.getUser(), userName, userPhone, "retrait");

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

    private void validateUserInformation(User user, String name, String phone, String operation) {
        if (user == null) {
            throw new RuntimeException("Aucun utilisateur associé au compte pour vérifier les informations.");
        }

        String normalizedExpectedName = normalizeText(user.getName());
        String normalizedExpectedPhone = normalizePhone(user.getPhone());
        String normalizedName = normalizeText(name);
        String normalizedPhone = normalizePhone(phone);

        if (!normalizedExpectedName.equals(normalizedName) || !normalizedExpectedPhone.equals(normalizedPhone)) {
            throw new RuntimeException(String.format(
                    "Les informations fournies ne correspondent pas aux informations enregistrées pour l'utilisateur du compte lors du %s.",
                    operation));
        }
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.trim().replaceAll("\\s+", " ").toLowerCase();
    }

    private String normalizePhone(String phone) {
        if (phone == null) {
            return "";
        }
        return phone.replaceAll("\\D", "");
    }
}
