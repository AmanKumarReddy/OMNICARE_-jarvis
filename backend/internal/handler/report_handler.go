package handler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type ReportHandler struct {
	reportRepo *repository.ReportRepository
}

func NewReportHandler(reportRepo *repository.ReportRepository) *ReportHandler {
	return &ReportHandler{reportRepo: reportRepo}
}

func (h *ReportHandler) HandleReports(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/reports")
	path = strings.Trim(path, "/")

	switch path {
	case "dashboard":
		summary, err := h.reportRepo.GetDashboardSummary(orgID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, summary)
	case "valuation":
		whID := r.URL.Query().Get("warehouse_id")
		rows, total, err := h.reportRepo.GetValuationReport(orgID, whID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSONWithMeta(w, http.StatusOK, rows, map[string]interface{}{
			"total_valuation": total,
			"item_count":      len(rows),
		})
	case "valuation/csv":
		whID := r.URL.Query().Get("warehouse_id")
		csvData, err := h.reportRepo.GenerateValuationCSV(orgID, whID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		fileName := fmt.Sprintf("inventory-valuation-%s.csv", time.Now().Format("2006-01-02"))
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(csvData))
	default:
		JSONError(w, http.StatusNotFound, "report not found")
	}
}
