# Generic Spring Boot Dockerfile
FROM eclipse-temurin:21-jdk-alpine
LABEL maintainer="Yesmine GRASSA <yasmineg432@gmail.com>"

# Install required packages for running Spring Boot applications
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml first for better caching
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Download dependencies (better caching)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src src

# Build application
RUN ./mvnw clean package -DskipTests

# Switch to non-root user
USER spring:spring

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "target/app.jar"]
