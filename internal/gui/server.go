package gui

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"net"
	"net/http"

	frontendgui "github.com/charmbracelet/crush/frontend/gui"
	"github.com/charmbracelet/crush/internal/config"
	"github.com/charmbracelet/crush/internal/proto"
	"github.com/charmbracelet/crush/internal/pubsub"
)

type Server struct {
	controller *Controller
	http       *http.Server
	listener   net.Listener
}

func NewServer(controller *Controller) *Server {
	s := &Server{controller: controller}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", s.handleIndex)
	mux.Handle("GET /assets/", s.staticHandler())
	mux.HandleFunc("GET /api/bootstrap", s.handleBootstrap)
	mux.HandleFunc("POST /api/sessions", s.handleCreateSession)
	mux.HandleFunc("PATCH /api/sessions/{sid}", s.handleRenameSession)
	mux.HandleFunc("DELETE /api/sessions/{sid}", s.handleDeleteSession)
	mux.HandleFunc("GET /api/sessions/{sid}/messages", s.handleListMessages)
	mux.HandleFunc("POST /api/sessions/{sid}/messages", s.handleSendMessage)
	mux.HandleFunc("POST /api/sessions/{sid}/messages/{mid}/revoke", s.handleRevokeRound)
	mux.HandleFunc("POST /api/sessions/{sid}/fork", s.handleForkRound)
	mux.HandleFunc("POST /api/sessions/{sid}/cancel", s.handleCancel)
	mux.HandleFunc("GET /api/sessions/{sid}/queue", s.handleQueueInfo)
	mux.HandleFunc("POST /api/sessions/{sid}/queue/clear", s.handleClearQueue)
	mux.HandleFunc("POST /api/sessions/{sid}/summarize", s.handleSummarize)
	mux.HandleFunc("POST /api/permissions/allow", s.handleAllowPermission)
	mux.HandleFunc("POST /api/permissions/deny", s.handleDenyPermission)
	mux.HandleFunc("GET /api/settings/bootstrap", s.handleSettingsBootstrap)
	mux.HandleFunc("POST /api/settings/providers/test", s.handleTestProvider)
	mux.HandleFunc("PUT /api/settings/providers/{id}", s.handleSaveProvider)
	mux.HandleFunc("POST /api/settings/models", s.handleUpdatePreferredModel)
	mux.HandleFunc("POST /api/settings/compact", s.handleSetCompactMode)
	mux.HandleFunc("PUT /api/settings/mcp/{name}", s.handleSaveMCPServer)
	mux.HandleFunc("DELETE /api/settings/mcp/{name}", s.handleDeleteMCPServer)
	mux.HandleFunc("PUT /api/settings/skills", s.handleSaveSkills)
	mux.HandleFunc("POST /api/settings/providers/{id}/refresh-oauth", s.handleRefreshOAuth)
	mux.HandleFunc("GET /api/settings/providers/{id}/default-small-model", s.handleDefaultSmallModel)
	mux.HandleFunc("GET /api/events", s.handleEvents)
	s.http = &http.Server{Handler: mux}
	return s
}

func (s *Server) Start() (string, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", err
	}
	s.listener = ln
	go func() {
		_ = s.http.Serve(ln)
	}()
	return "http://" + ln.Addr().String() + "/", nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.http == nil {
		return nil
	}
	return s.http.Shutdown(ctx)
}

func (s *Server) handleIndex(w http.ResponseWriter, _ *http.Request) {
	index, err := frontendgui.Assets.ReadFile("dist/index.html")
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write(index)
}

func (s *Server) handleBootstrap(w http.ResponseWriter, r *http.Request) {
	bootstrap, err := s.controller.Bootstrap(r.Context())
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, bootstrap)
}

func (s *Server) handleCreateSession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	sess, err := s.controller.CreateSession(r.Context(), req.Title)
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, sess)
}

func (s *Server) handleRenameSession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	sess, err := s.controller.RenameSession(r.Context(), r.PathValue("sid"), req.Title)
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, sess)
}

func (s *Server) handleDeleteSession(w http.ResponseWriter, r *http.Request) {
	if err := s.controller.DeleteSession(r.Context(), r.PathValue("sid")); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleListMessages(w http.ResponseWriter, r *http.Request) {
	msgs, err := s.controller.ListMessages(r.Context(), r.PathValue("sid"))
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, msgs)
}

func (s *Server) handleSendMessage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Prompt string `json:"prompt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.SendMessage(r.Context(), r.PathValue("sid"), req.Prompt); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (s *Server) handleRevokeRound(w http.ResponseWriter, r *http.Request) {
	if err := s.controller.RevokeRound(r.Context(), r.PathValue("sid"), r.PathValue("mid")); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleForkRound(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RoundEndMessageID string `json:"round_end_message_id"`
		Title             string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	sess, err := s.controller.ForkRound(r.Context(), r.PathValue("sid"), req.RoundEndMessageID, req.Title)
	if err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	writeJSON(w, sess)
}

func (s *Server) handleCancel(w http.ResponseWriter, r *http.Request) {
	s.controller.Cancel(r.PathValue("sid"))
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleQueueInfo(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, s.controller.QueueInfo(r.PathValue("sid")))
}

func (s *Server) handleClearQueue(w http.ResponseWriter, r *http.Request) {
	s.controller.ClearQueue(r.PathValue("sid"))
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleSummarize(w http.ResponseWriter, r *http.Request) {
	if err := s.controller.SummarizeSession(r.Context(), r.PathValue("sid")); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (s *Server) handleAllowPermission(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Permission proto.PermissionRequest `json:"permission"`
		Persistent bool                    `json:"persistent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	s.controller.GrantPermission(req.Permission, req.Persistent)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleDenyPermission(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Permission proto.PermissionRequest `json:"permission"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	s.controller.DenyPermission(req.Permission)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleSettingsBootstrap(w http.ResponseWriter, r *http.Request) {
	settings, err := s.controller.SettingsBootstrap(r.Context())
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, settings)
}

func (s *Server) handleTestProvider(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Provider ProviderDraft `json:"provider"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	writeJSON(w, s.controller.TestProvider(r.Context(), req.Provider))
}

func (s *Server) handleSaveProvider(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope    string        `json:"scope"`
		Provider ProviderDraft `json:"provider"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	req.Provider.ID = firstNonEmpty(req.Provider.ID, r.PathValue("id"))
	provider, err := s.controller.SaveProvider(r.Context(), configScope(req.Scope), req.Provider)
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, provider)
}

func (s *Server) handleUpdatePreferredModel(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope     string               `json:"scope"`
		ModelType string               `json:"model_type"`
		Model     config.SelectedModel `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.UpdatePreferredModel(r.Context(), configScope(req.Scope), configSelectedModelType(req.ModelType), req.Model); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleSetCompactMode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope   string `json:"scope"`
		Enabled bool   `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.SetCompactMode(configScope(req.Scope), req.Enabled); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleSaveMCPServer(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope  string         `json:"scope"`
		Server MCPServerDraft `json:"server"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	server, err := s.controller.SaveMCPServer(r.Context(), configScope(req.Scope), r.PathValue("name"), req.Server)
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, server)
}

func (s *Server) handleDeleteMCPServer(w http.ResponseWriter, r *http.Request) {
	scope := configScope(r.URL.Query().Get("scope"))
	if err := s.controller.DeleteMCPServer(r.Context(), scope, r.PathValue("name")); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) handleSaveSkills(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope  string             `json:"scope"`
		Skills SkillSettingsDraft `json:"skills"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.SaveSkillSettings(r.Context(), configScope(req.Scope), req.Skills); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleRefreshOAuth(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Scope string `json:"scope"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.RefreshOAuthToken(r.Context(), configScope(req.Scope), r.PathValue("id")); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleDefaultSmallModel(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, s.controller.DefaultSmallModel(r.PathValue("id")))
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	events, err := s.controller.SubscribeEvents(r.Context())
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher := http.NewResponseController(w)
	for {
		select {
		case <-r.Context().Done():
			return
		case ev, ok := <-events:
			if !ok {
				return
			}
			if err := writeSSE(w, ev); err != nil {
				if errors.Is(err, net.ErrClosed) {
					return
				}
				return
			}
			if err := flusher.Flush(); err != nil {
				return
			}
		}
	}
}

func writeSSE(w http.ResponseWriter, payload pubsub.Payload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(w, "data: %s\n\n", data)
	return err
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, err error, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
}

func configScope(scope string) config.Scope {
	switch scope {
	case string(config.ScopeWorkspace):
		return config.ScopeWorkspace
	default:
		return config.ScopeGlobal
	}
}

func configSelectedModelType(modelType string) config.SelectedModelType {
	switch modelType {
	case string(config.SelectedModelTypeSmall):
		return config.SelectedModelTypeSmall
	default:
		return config.SelectedModelTypeLarge
	}
}

func (s *Server) staticHandler() http.Handler {
	sub, err := fs.Sub(frontendgui.Assets, "dist")
	if err != nil {
		panic(err)
	}
	return http.FileServerFS(sub)
}
