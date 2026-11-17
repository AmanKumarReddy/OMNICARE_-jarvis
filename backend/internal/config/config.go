package config

import (
	"os"
)

type Config struct {
	Port         string
	DBType       string // "postgres" or "sqlite"
	DBDSN        string
	JWTSecret    string
	Environment  string
	AllowOrigins string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbType := os.Getenv("DB_TYPE")
	if dbType == "" {
		// If DATABASE_URL is set, default to postgres; otherwise sqlite for seamless local execution
		if os.Getenv("DATABASE_URL") != "" {
			dbType = "postgres"
		} else {
			dbType = "sqlite"
		}
	}

	dbDSN := os.Getenv("DATABASE_URL")
	if dbDSN == "" {
		if dbType == "postgres" {
			dbDSN = "postgres://omnistock:omnistock_secret@localhost:5432/omnistock_db?sslmode=disable"
		} else {
			dbDSN = "omnistock.db"
		}
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "enterprise-production-grade-omnistock-jwt-secret-key-32bytes"
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:         port,
		DBType:       dbType,
		DBDSN:        dbDSN,
		JWTSecret:    jwtSecret,
		Environment:  env,
		AllowOrigins: "*",
	}
}
