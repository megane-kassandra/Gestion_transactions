package com.gestion_transactions.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock // On simule la base de données pour ne pas écrire dedans pendant le test
    private TransactionRepository transactionRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private TransactionService transactionService;

    @Test
    public void testWithdraw_SoldeInsuffisant_DoitEchouer() {
        // 1. Préparation (Arrange) : On simule un compte avec 50$
        Account fauxCompte = new Account();
        fauxCompte.setId(1L);
        Bank bank = new Bank();
        bank.setId(1L);
        bank.setWithdrawalFee(0.0);
        bank.setDepositFee(0.0);
        bank.setDailyWithdrawalLimit(10000.0);
        bank.setActive(true);
        fauxCompte.setBank(bank);
        fauxCompte.setBalance(50.0);

        User user = new User();
        user.setId(1L);
        fauxCompte.setUser(user);

        // Quand le service cherchera le compte 1, on lui renverra notre faux compte
        when(accountRepository.findById(1L)).thenReturn(Optional.of(fauxCompte));
        // Simuler qu'aucun retrait n'a été fait aujourd'hui
        when(transactionRepository.getTotalWithdrawalsToday(any(), any(), any())).thenReturn(0.0);

        // 2 & 3. Action et Vérification (Act & Assert) : On essaie de retirer 100$
        Exception exception = assertThrows(RuntimeException.class, () -> {
            transactionService.withdraw(1L, 100.0);
        });

        // On vérifie que le message d'erreur contient "Solde insuffisant"
        assertTrue(exception.getMessage().contains("Solde insuffisant"));
    }

    @Test
    public void testWithdraw_Succes() {
        // Arrange : Un compte avec 500$
        Account compte = new Account();
        compte.setId(1L);
        Bank bank = new Bank();
        bank.setId(1L);
        bank.setWithdrawalFee(0.0);
        bank.setDepositFee(0.0);
        bank.setDailyWithdrawalLimit(10000.0);
        bank.setActive(true);
        compte.setBank(bank);
        compte.setBalance(500.0);

        User user = new User();
        user.setId(1L);
        compte.setUser(user);

        when(accountRepository.findById(1L)).thenReturn(Optional.of(compte));
        // Simuler qu'aucun retrait n'a été fait aujourd'hui
        when(transactionRepository.getTotalWithdrawalsToday(any(), any(), any())).thenReturn(0.0);

        // Act : On retire 200$
        transactionService.withdraw(1L, 200.0);

        // Assert : Le solde doit être de 300$ et on vérifie qu'une transaction a été sauvegardée
        assertEquals(300.0, compte.getBalance());
        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    public void testDeposit_Succes() {
        // Arrange : Un compte avec 100$
        Account compte = new Account();
        compte.setId(2L);
        Bank bank = new Bank();
        bank.setId(2L);
        bank.setWithdrawalFee(0.0);
        bank.setDepositFee(0.0);
        bank.setActive(true);
        compte.setBank(bank);
        compte.setBalance(100.0);

        when(accountRepository.findById(2L)).thenReturn(Optional.of(compte));

        // Act : On dépose 150$
        transactionService.deposit(2L, 150.0, "Bob", "0700000000");

        // Assert : Le solde doit être de 250$
        assertEquals(250.0, compte.getBalance());
        verify(transactionRepository, times(1)).save(any());
    }

    @Test
    public void testWithdraw_LimiteQuotidienneDepassee_DoitEchouer() {
        // Arrange : Un compte avec solde suffisant mais limite quotidienne dépassée
        Account compte = new Account();
        compte.setId(1L);
        Bank bank = new Bank();
        bank.setId(1L);
        bank.setWithdrawalFee(0.0);
        bank.setDepositFee(0.0);
        bank.setDailyWithdrawalLimit(1000.0); // Limite de 1000€
        bank.setActive(true);
        compte.setBank(bank);
        compte.setBalance(2000.0);

        User user = new User();
        user.setId(1L);
        compte.setUser(user);

        when(accountRepository.findById(1L)).thenReturn(Optional.of(compte));
        // Simuler que l'utilisateur a déjà retiré 800€ aujourd'hui
        when(transactionRepository.getTotalWithdrawalsToday(eq(1L), eq(1L), any(LocalDateTime.class))).thenReturn(800.0);

        // Act & Assert : Tenter de retirer 300€ devrait échouer car 800 + 300 > 1000
        Exception exception = assertThrows(RuntimeException.class, () -> {
            transactionService.withdraw(1L, 300.0);
        });

        // Vérifier que le message d'erreur contient "Limite de retrait quotidienne dépassée"
        assertTrue(exception.getMessage().contains("Limite de retrait quotidienne dépassée"));
    }

    @Test
    public void testWithdraw_LimiteQuotidienneRespectee_DoitReussir() {
        // Arrange : Un compte avec solde suffisant et limite quotidienne respectée
        Account compte = new Account();
        compte.setId(1L);
        Bank bank = new Bank();
        bank.setId(1L);
        bank.setWithdrawalFee(0.0);
        bank.setDepositFee(0.0);
        bank.setDailyWithdrawalLimit(1000.0); // Limite de 1000€
        bank.setActive(true);
        compte.setBank(bank);
        compte.setBalance(2000.0);

        User user = new User();
        user.setId(1L);
        compte.setUser(user);

        when(accountRepository.findById(1L)).thenReturn(Optional.of(compte));
        // Simuler que l'utilisateur a déjà retiré 500€ aujourd'hui
        when(transactionRepository.getTotalWithdrawalsToday(eq(1L), eq(1L), any(LocalDateTime.class))).thenReturn(500.0);

        // Act : Retirer 400€ devrait réussir car 500 + 400 = 900 <= 1000
        transactionService.withdraw(1L, 400.0);

        // Assert : Le solde doit être mis à jour et une transaction sauvegardée
        assertEquals(1600.0, compte.getBalance()); // 2000 - 400
        verify(transactionRepository, times(1)).save(any());
    }

}