package cli

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInterfaceRoutes(t *testing.T) {
	cases := []struct {
		name         string
		args         []string
		method, path string
		body         string
	}{
		{"health", []string{"health"}, "GET", "/health", ""},
		{"resumo", []string{"resumo"}, "GET", "/v1/resumo", ""},
		{"dashboard", []string{"dashboard"}, "GET", "/v1/dashboard", ""},
		{"opcoes", []string{"opcoes"}, "GET", "/v1/opcoes", ""},
		{"candidaturas list", []string{"candidaturas", "list", "--busca", "dev", "--pagina", "2", "--limite", "20", "--incluir-arquivadas", "--json"}, "GET", "/v1/candidaturas?busca=dev&incluirArquivadas=true&limite=20&pagina=2", ""},
		{"candidaturas get", []string{"candidaturas", "get", "abc"}, "GET", "/v1/candidaturas/abc", ""},
		{"candidaturas create", []string{"candidaturas", "create", "--vaga-nome", "Dev", "--empresa-id", "co"}, "POST", "/v1/candidaturas", `{"vaga_nome":"Dev","empresa_id":"co"}`},
		{"candidaturas update", []string{"candidaturas", "update", "abc", "--data", `{"observacoes":null}`}, "PUT", "/v1/candidaturas/abc", `{"observacoes":null}`},
		{"candidaturas status", []string{"candidaturas", "status", "abc", "ENTREVISTA"}, "PATCH", "/v1/candidaturas/abc/status", `{"status":"ENTREVISTA"}`},
		{"candidaturas archive", []string{"candidaturas", "archive", "abc"}, "PATCH", "/v1/candidaturas/abc/arquivar", `{"ativa":false}`},
		{"candidaturas unarchive", []string{"candidaturas", "unarchive", "abc"}, "PATCH", "/v1/candidaturas/abc/arquivar", `{"ativa":true}`},
		{"candidaturas restore", []string{"candidaturas", "restore", "--id", "abc", "--vaga-nome", "Dev", "--empresa-id", "co"}, "POST", "/v1/candidaturas/restaurar", `{"id":"abc","vaga_nome":"Dev","empresa_id":"co"}`},
		{"candidaturas delete", []string{"candidaturas", "delete", "abc"}, "DELETE", "/v1/candidaturas/abc", ""},
		{"empresas list", []string{"empresas", "list"}, "GET", "/v1/empresas", ""},
		{"empresas create", []string{"empresas", "create", "--nome", "Acme"}, "POST", "/v1/empresas", `{"nome":"Acme"}`},
		{"empresas update", []string{"empresas", "update", "abc", "--nome", "Acme"}, "PUT", "/v1/empresas/abc", `{"nome":"Acme"}`},
		{"empresas delete", []string{"empresas", "delete", "abc"}, "DELETE", "/v1/empresas/abc", ""},
		{"followups list", []string{"followups", "list"}, "GET", "/v1/followups", ""},
		{"followups create", []string{"followups", "create", "--candidatura-id", "abc", "--data-prevista", "2026-09-30T12:00:00Z"}, "POST", "/v1/followups", `{"candidatura_id":"abc","data_prevista":"2026-09-30T12:00:00Z"}`},
		{"followups update", []string{"followups", "update", "abc", "--feito=false"}, "PATCH", "/v1/followups/abc", `{"feito":false}`},
		{"followups done", []string{"followups", "done", "abc"}, "PATCH", "/v1/followups/abc", `{"feito":true}`},
		{"followups reopen", []string{"followups", "reopen", "abc"}, "PATCH", "/v1/followups/abc", `{"feito":false}`},
		{"followups result", []string{"followups", "result", "abc", "ADIARAM", "--reagendar-para", "2026-10-01T12:00:00Z"}, "POST", "/v1/followups/abc/resultado", `{"resultado":"ADIARAM","reagendar_para":"2026-10-01T12:00:00Z"}`},
		{"followups delete", []string{"followups", "delete", "abc"}, "DELETE", "/v1/followups/abc", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var gotMethod, gotPath string
			var gotBody []byte
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				gotMethod, gotPath = r.Method, r.URL.RequestURI()
				gotBody, _ = io.ReadAll(r.Body)
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"ok":true}`))
			}))
			defer server.Close()
			t.Setenv("LINKANBAN_API_URL", server.URL)
			t.Setenv("LINKANBAN_CONFIG_PATH", filepath.Join(t.TempDir(), "config.json"))
			var out, errOut bytes.Buffer
			if code := Run(tc.args, strings.NewReader(""), &out, &errOut); code != 0 {
				t.Fatalf("exit %d: %s", code, errOut.String())
			}
			if gotMethod != tc.method || gotPath != tc.path {
				t.Errorf("request %s %s, want %s %s", gotMethod, gotPath, tc.method, tc.path)
			}
			if tc.body != "" {
				var got, want any
				if err := json.Unmarshal(gotBody, &got); err != nil {
					t.Fatal(err)
				}
				if err := json.Unmarshal([]byte(tc.body), &want); err != nil {
					t.Fatal(err)
				}
				actual, _ := json.Marshal(got)
				expected, _ := json.Marshal(want)
				if !bytes.Equal(actual, expected) {
					t.Errorf("body %s, want %s", actual, expected)
				}
			}
			var envelope struct {
				SchemaVersion string          `json:"schema_version"`
				Data          map[string]bool `json:"data"`
			}
			if err := json.Unmarshal(out.Bytes(), &envelope); err != nil || envelope.SchemaVersion != "1" || !envelope.Data["ok"] {
				t.Fatalf("bad envelope: %s, %v", out.String(), err)
			}
		})
	}
}

func TestTokenPrecedenceAndRedaction(t *testing.T) {
	var authorization string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorization = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`[]`))
	}))
	defer server.Close()
	path := filepath.Join(t.TempDir(), "config.json")
	t.Setenv("LINKANBAN_CONFIG_PATH", path)
	t.Setenv("LINKANBAN_API_URL", server.URL)
	t.Setenv("LINKANBAN_TOKEN", "environment-secret")
	var out, errOut bytes.Buffer
	if code := Run([]string{"config", "set", "token", "stored-secret"}, strings.NewReader(""), &out, &errOut); code != 0 {
		t.Fatalf("config set: %s", errOut.String())
	}
	if strings.Contains(out.String(), "stored-secret") {
		t.Fatal("config output leaked token")
	}
	out.Reset()
	errOut.Reset()
	if code := Run([]string{"--token", "flag-secret", "followups", "list"}, strings.NewReader(""), &out, &errOut); code != 0 {
		t.Fatalf("list: %s", errOut.String())
	}
	if authorization != "Bearer flag-secret" {
		t.Fatalf("authorization: %s", authorization)
	}
	out.Reset()
	errOut.Reset()
	if code := Run([]string{"--token=flag-secret", "unknown-command"}, strings.NewReader(""), &out, &errOut); code != 2 {
		t.Fatalf("exit %d: %s", code, errOut.String())
	}
	if strings.Contains(errOut.String(), "flag-secret") {
		t.Fatal("error leaked token")
	}
}

func TestHTTPFailureAndStdin(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "POST" {
			w.WriteHeader(http.StatusCreated)
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"id":"new"}`))
			return
		}
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer server.Close()
	t.Setenv("LINKANBAN_API_URL", server.URL)
	t.Setenv("LINKANBAN_CONFIG_PATH", filepath.Join(t.TempDir(), "config.json"))
	var out, errOut bytes.Buffer
	if code := Run([]string{"candidaturas", "create", "--data", "-"}, strings.NewReader(`{"vaga_nome":"Dev","empresa_id":"co"}`), &out, &errOut); code != 0 {
		t.Fatalf("stdin: %s", errOut.String())
	}
	out.Reset()
	errOut.Reset()
	if code := Run([]string{"empresas", "list"}, strings.NewReader(""), &out, &errOut); code != 3 {
		t.Fatalf("authentication exit %d: %s", code, errOut.String())
	}
	if out.Len() != 0 || !strings.Contains(errOut.String(), `"authentication_error"`) {
		t.Fatalf("bad streams: stdout=%s stderr=%s", out.String(), errOut.String())
	}
}

func TestBootstrapStoresTokenWithoutPrintingIt(t *testing.T) {
	secret := "bootstrap-secret"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/auth/bootstrap" || r.Header.Get("x-linkanban-bootstrap-token") != secret || r.Header.Get("Authorization") != "" {
			t.Errorf("bad bootstrap request: %s, headers=%v", r.URL.Path, r.Header)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"token":"issued-secret"}`))
	}))
	defer server.Close()
	path := filepath.Join(t.TempDir(), "config.json")
	t.Setenv("LINKANBAN_CONFIG_PATH", path)
	t.Setenv("LINKANBAN_API_URL", server.URL)
	t.Setenv("LINKANBAN_BOOTSTRAP_TOKEN", secret)
	t.Setenv("LINKANBAN_TOKEN", "")
	var out, errOut bytes.Buffer
	if code := Run([]string{"auth", "bootstrap", "--json"}, strings.NewReader(""), &out, &errOut); code != 0 {
		t.Fatalf("bootstrap exit %d: %s", code, errOut.String())
	}
	if strings.Contains(out.String(), "issued-secret") || strings.Contains(errOut.String(), secret) {
		t.Fatal("bootstrap leaked a secret")
	}
	contents, err := os.ReadFile(path)
	if err != nil || !strings.Contains(string(contents), "issued-secret") {
		t.Fatalf("token was not saved: %v", err)
	}
}

func TestAPIErrorKeepsDomainCodeAndRedactsToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		_, _ = w.Write([]byte(`{"error":"token secret-value em uso","codigo":"em_uso"}`))
	}))
	defer server.Close()
	t.Setenv("LINKANBAN_API_URL", server.URL)
	t.Setenv("LINKANBAN_CONFIG_PATH", filepath.Join(t.TempDir(), "config.json"))
	t.Setenv("LINKANBAN_TOKEN", "secret-value")
	var out, errOut bytes.Buffer
	if code := Run([]string{"empresas", "delete", "abc"}, strings.NewReader(""), &out, &errOut); code != 5 {
		t.Fatalf("exit %d: %s", code, errOut.String())
	}
	if out.Len() != 0 || strings.Contains(errOut.String(), "secret-value") || !strings.Contains(errOut.String(), `"em_uso"`) || !strings.Contains(errOut.String(), "[redacted]") {
		t.Fatalf("bad error envelope: stdout=%s stderr=%s", out.String(), errOut.String())
	}
}
