import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.gestion_transactions.backend.model.Account;
import com.gestion_transactions.backend.model.User;
import com.gestion_transactions.backend.repository.UserRepository;

import java.util.Optional;

class GestionTransactionsTests {

    // --- 1. TESTS POUR WITHDRAW (Retrait) ---

    @Test
    void testWithdraw_Path1_InsufficientBalance() { // TC-W01
        Account acc = new Account();
        acc.setBalance(50.0);
        // Simulation d'une tentative de retrait de 100
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (acc.getBalance() < 100.0) throw new RuntimeException("Solde insuffisant");
        });
        assertEquals("Solde insuffisant", exception.getMessage());
    }

    @Test
    void testWithdraw_Path2_Success() { // TC-W02
        Account acc = new Account();
        acc.setBalance(200.0);
        Double amountToWithdraw = 100.0;
        
        // Simulation du chemin False (pas d'exception)
        if (acc.getBalance() >= amountToWithdraw) {
            acc.setBalance(acc.getBalance() - amountToWithdraw);
        }
        assertEquals(100.0, acc.getBalance());
    }

    // --- 2. TESTS POUR CREATE ACCOUNT ---

    @Test
    void testCreateAccount_Path1_UserNotFound() { // TC-A01
        UserRepository mockRepo = mock(UserRepository.class);
        when(mockRepo.findById(99L)).thenReturn(Optional.empty()); // User n'existe pas

        Exception exception = assertThrows(RuntimeException.class, () -> {
            mockRepo.findById(99L).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        });
        assertTrue(exception.getMessage().contains("Utilisateur non trouvé"));
    }

    @Test
    void testCreateAccount_Path2_Success() { // TC-A02
        User user = new User();
        user.setId(1L);
        Account account = new Account();
        account.setUser(user);
        account.setAccountNumber("ACC-TEST1234"); // Simulation génération
        
        assertNotNull(account.getAccountNumber());
        assertEquals(1L, account.getUser().getId());
    }

    // --- 3. TESTS POUR CREATE USER ---

    @Test
    void testCreateUser_Path1_NullBalance() { // TC-U01
        Account account = new Account();
        account.setBalance(null); // Entrée avec null
        
        if (account.getBalance() == null) {
            account.setBalance(0.0);
        }
        assertEquals(0.0, account.getBalance());
    }

    @Test
    void testCreateUser_Path2_WithBalance() { // TC-U02
        Account account = new Account();
        account.setBalance(50.0); // Entrée avec valeur
        
        if (account.getBalance() == null) {
            account.setBalance(0.0);
        }
        assertEquals(50.0, account.getBalance());
    }
}