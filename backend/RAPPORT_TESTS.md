# Rapport de tests backend

Date d'execution : 2026-06-11 14:36:59 WAT (+0100)

Commandes lancees :

```bash
./mvnw clean test
./mvnw surefire-report:report
```

## Resultat global

| Statut | Tests | Echecs | Erreurs | Ignores |
| --- | ---: | ---: | ---: | ---: |
| SUCCES | 17 | 0 | 0 | 0 |

Temps Maven du dernier run : 13:19 min

Note : le dernier run inclut le telechargement initial du plugin de rapport Surefire et de ses dependances. Le temps cumule des suites JUnit est de 4.478 s.

## Suites executees

| Suite | Tests | Echecs | Erreurs | Ignores | Duree |
| --- | ---: | ---: | ---: | ---: | ---: |
| `com.gestion_transactions.backend.BackendApplicationTests` | 1 | 0 | 0 | 0 | 0.133 s |
| `com.gestion_transactions.backend.service.AccountServiceTest` | 1 | 0 | 0 | 0 | 3.342 s |
| `com.gestion_transactions.backend.service.GestionTransactionsTests` | 6 | 0 | 0 | 0 | 0.118 s |
| `com.gestion_transactions.backend.service.TransactionServiceTest` | 7 | 0 | 0 | 0 | 0.854 s |
| `com.gestion_transactions.backend.service.UserServiceTest` | 2 | 0 | 0 | 0 | 0.031 s |

## Couverture JaCoCo

| Metrique | Couverture |
| --- | ---: |
| Instructions | 34.77 % |
| Branches | 28.43 % |
| Lignes | 35.40 % |
| Complexite | 12.03 % |
| Methodes | 14.63 % |

Couverture par package :

| Package | Instructions | Branches | Lignes |
| --- | ---: | ---: | ---: |
| `com.gestion_transactions.backend` | 37.50 % | 100.00 % | 33.33 % |
| `com.gestion_transactions.backend.config` | 0.00 % | 100.00 % | 0.00 % |
| `com.gestion_transactions.backend.controller` | 0.00 % | 0.00 % | 0.00 % |
| `com.gestion_transactions.backend.model` | 0.00 % | 0.00 % | 0.00 % |
| `com.gestion_transactions.backend.service` | 47.58 % | 32.22 % | 51.06 % |

## Rapports generes

- Rapport Surefire HTML : `target/reports/surefire.html`
- Rapports Surefire XML/TXT : `target/surefire-reports/`
- Rapport JaCoCo HTML : `target/site/jacoco/index.html`
- Donnees JaCoCo CSV/XML : `target/site/jacoco/jacoco.csv`, `target/site/jacoco/jacoco.xml`
