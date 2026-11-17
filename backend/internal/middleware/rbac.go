package middleware

import (
	"net/http"
)

// RequireRoles restricts access to requests matching specified roles
func RequireRoles(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserClaims(r.Context())
			if claims == nil {
				http.Error(w, `{"success":false,"error":"unauthorized"}`, http.StatusUnauthorized)
				return
			}

			// SUPER_ADMIN has full permissions across the entire platform
			if claims.Role == "SUPER_ADMIN" {
				next.ServeHTTP(w, r)
				return
			}

			for _, role := range allowedRoles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, `{"success":false,"error":"forbidden: insufficient permissions"}`, http.StatusForbidden)
		})
	}
}
