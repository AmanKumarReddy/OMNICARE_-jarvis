package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler(userRepo *repository.UserRepository) *UserHandler {
	return &UserHandler{userRepo: userRepo}
}

func (h *UserHandler) HandleUsers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/users")
	path = strings.Trim(path, "/")

	if path == "" {
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		users, err := h.userRepo.ListByOrg(orgID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, users)
		return
	}

	parts := strings.Split(path, "/")
	id := parts[0]

	if len(parts) == 2 && parts[1] == "role" && r.Method == http.MethodPut {
		type roleReq struct {
			Role string `json:"role"`
		}
		var req roleReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid payload")
			return
		}
		if err := h.userRepo.UpdateRole(id, req.Role); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "user role updated successfully")
		return
	}

	JSONError(w, http.StatusNotFound, "not found")
}
