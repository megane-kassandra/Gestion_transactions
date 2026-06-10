# Étape 1 : Build de l'application avec Maven
# Utilisation d'une image Maven basée sur Eclipse Temurin pour éviter les erreurs
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Étape 2 : Exécution de l'application
# Utilisation de l'image Eclipse Temurin (légère et optimisée pour la production)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# On copie le .jar généré depuis l'étape de build
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]