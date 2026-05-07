package com.gestion_transactions.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.Bank;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.AccountRepository;
import com.gestion_transactions.backend.repository.BankRepository;
import com.gestion_transactions.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BankRepository bankRepository;

    @InjectMocks
    private AccountService accountService;

    @Test
    public void testCreateAccount_Succes() {
        // Arrange : On crée un faux utilisateur
        User user = new User();
        user.setId(1L);
        user.setName("Alice");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        
        Bank bank = new Bank();
        bank.setId(1L);
        bank.setName("Test Bank");
        bank.setCode("TESTBANK");
        bank.setDepositFee(0.0);
        bank.setWithdrawalFee(0.0);
        bank.setActive(true);
        when(bankRepository.findById(1L)).thenReturn(Optional.of(bank));

        // Simule la sauvegarde du compte en renvoyant le compte qu'on lui donne
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act : On crée un compte avec 5000 de solde initial
        Account account = accountService.createAccount(1L, 1L, 5000.0);

        // Assert : On vérifie que tout est correct
        assertNotNull(account);
        assertEquals(5000.0, account.getBalance());
        assertEquals(user, account.getUser());
        assertTrue(account.getAccountNumber().startsWith("ACC-")); // Vérifie la génération du numéro
    }
}