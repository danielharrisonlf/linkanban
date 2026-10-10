package cli

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

const defaultAPIURL = "http://localhost:3333"

type cliError struct {
	Code     string
	Message  string
	ExitCode int
	Status   int
}

func (e *cliError) Error() string { return e.Message }

func usageError(message string) error { return &cliError{"usage_error", message, 2, 0} }

type storedConfig struct {
	APIURL string `json:"api_url,omitempty"`
	Token  string `json:"token,omitempty"`
}

type app struct {
	in       io.Reader
	out      io.Writer
	err      io.Writer
	client   *http.Client
	apiURL   string
	token    string
	jsonFlag bool
}

// Run is the executable entry point and also allows in-process command tests.
func Run(args []string, in io.Reader, out, errOut io.Writer) int {
	a := &app{in: in, out: out, err: errOut, client: &http.Client{Timeout: 30 * time.Second}}
	root := a.rootCommand()
	root.SetArgs(args)
	root.SetIn(in)
	root.SetOut(out)
	root.SetErr(io.Discard)
	cmd, err := root.ExecuteC()
	if err == nil {
		return 0
	}
	var ce *cliError
	if !errors.As(err, &ce) {
		ce = &cliError{"usage_error", "Uso inválido. Consulte --help.", 2, 0}
	}
	command := "linkanban"
	if cmd != nil {
		command = cmd.CommandPath()
	}
	_ = json.NewEncoder(errOut).Encode(map[string]any{
		"schema_version": "1", "data": nil,
		"error": map[string]any{"code": ce.Code, "message": ce.Message},
		"meta":  map[string]any{"command": command, "status": ce.Status},
	})
	return ce.ExitCode
}

func (a *app) rootCommand() *cobra.Command {
	root := &cobra.Command{Use: "linkanban", Short: "Opera o Linkanban por comandos e JSON", Version: "0.2.0", SilenceUsage: true, SilenceErrors: true}
	root.SetFlagErrorFunc(func(_ *cobra.Command, _ error) error { return usageError("Uso inválido. Consulte --help.") })
	root.PersistentFlags().StringVar(&a.apiURL, "api-url", "", "URL base da API (LINKANBAN_API_URL)")
	root.PersistentFlags().StringVar(&a.token, "token", "", "token Bearer (LINKANBAN_TOKEN)")
	root.PersistentFlags().BoolVar(&a.jsonFlag, "json", false, "saída JSON (padrão para comandos)")
	root.AddCommand(append([]*cobra.Command{a.configCommands(), a.authCommands()}, a.resourceCommands()...)...)
	return root
}

func (a *app) success(data any, command string, status int) error {
	return json.NewEncoder(a.out).Encode(map[string]any{
		"schema_version": "1", "data": data,
		"meta": map[string]any{"command": command, "status": status},
	})
}

func (a *app) configPath() (string, error) {
	if path := os.Getenv("LINKANBAN_CONFIG_PATH"); path != "" {
		return path, nil
	}
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", &cliError{"config_error", "Não foi possível localizar o diretório de configuração.", 2, 0}
	}
	return filepath.Join(dir, "linkanban", "config.json"), nil
}

func (a *app) readConfig() (storedConfig, string, error) {
	path, err := a.configPath()
	if err != nil {
		return storedConfig{}, "", err
	}
	contents, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return storedConfig{}, path, nil
	}
	if err != nil {
		return storedConfig{}, path, &cliError{"config_error", "Não foi possível ler a configuração local.", 2, 0}
	}
	var config storedConfig
	if json.Unmarshal(contents, &config) != nil {
		return storedConfig{}, path, &cliError{"config_error", "Configuração local inválida.", 2, 0}
	}
	return config, path, nil
}

func (a *app) saveConfig(config storedConfig, path string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return &cliError{"config_error", "Não foi possível criar o diretório de configuração.", 2, 0}
	}
	contents, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return &cliError{"config_error", "Não foi possível serializar a configuração.", 2, 0}
	}
	if err = os.WriteFile(path, append(contents, '\n'), 0600); err != nil {
		return &cliError{"config_error", "Não foi possível salvar a configuração.", 2, 0}
	}
	return nil
}

func (a *app) resolvedConfig(cmd *cobra.Command) (storedConfig, error) {
	config, _, err := a.readConfig()
	if err != nil {
		return config, err
	}
	if value := os.Getenv("LINKANBAN_API_URL"); value != "" {
		config.APIURL = value
	}
	if value := os.Getenv("LINKANBAN_TOKEN"); value != "" {
		config.Token = value
	}
	if cmd.Flags().Changed("api-url") {
		config.APIURL = a.apiURL
	}
	if cmd.Flags().Changed("token") {
		config.Token = a.token
	}
	if config.APIURL == "" {
		config.APIURL = defaultAPIURL
	}
	config.APIURL, err = normalizeAPIURL(config.APIURL)
	return config, err
}

func normalizeAPIURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") || u.User != nil {
		return "", &cliError{"config_error", "URL da API inválida; use http ou https.", 2, 0}
	}
	u.RawQuery, u.Fragment = "", ""
	u.Path = strings.TrimRight(u.Path, "/")
	if !strings.HasSuffix(u.Path, "/v1") {
		u.Path += "/v1"
	}
	return strings.TrimRight(u.String(), "/"), nil
}

func (a *app) request(cmd *cobra.Command, method, path string, query url.Values, body any, tokenOverride *string, headers http.Header) (json.RawMessage, int, error) {
	config, err := a.resolvedConfig(cmd)
	if err != nil {
		return nil, 0, err
	}
	if tokenOverride != nil {
		config.Token = *tokenOverride
	}
	base := config.APIURL
	if path == "health" {
		base = strings.TrimSuffix(base, "/v1")
	}
	u, err := url.Parse(base + "/" + strings.TrimLeft(path, "/"))
	if err != nil {
		return nil, 0, &cliError{"config_error", "URL da API inválida.", 2, 0}
	}
	if query != nil {
		u.RawQuery = query.Encode()
	}
	var payload io.Reader
	if body != nil {
		encoded, encodeErr := json.Marshal(body)
		if encodeErr != nil {
			return nil, 0, usageError("Dados JSON inválidos.")
		}
		payload = bytes.NewReader(encoded)
	}
	req, err := http.NewRequestWithContext(context.Background(), method, u.String(), payload)
	if err != nil {
		return nil, 0, usageError("Requisição inválida.")
	}
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if config.Token != "" {
		req.Header.Set("Authorization", "Bearer "+config.Token)
	}
	for key, values := range headers {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}
	resp, err := a.client.Do(req)
	if err != nil {
		return nil, 0, &cliError{"network_error", "Não foi possível conectar à API.", 4, 0}
	}
	defer resp.Body.Close()
	contents, err := io.ReadAll(io.LimitReader(resp.Body, 4*1024*1024+1))
	if err != nil || len(contents) > 4*1024*1024 {
		return nil, resp.StatusCode, &cliError{"api_error", "Resposta da API inválida ou grande demais.", 5, resp.StatusCode}
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		code := "api_error"
		exitCode := 5
		if resp.StatusCode == 401 || resp.StatusCode == 403 {
			code, exitCode = "authentication_error", 3
		}
		message := fmt.Sprintf("A API retornou HTTP %d.", resp.StatusCode)
		var apiFailure struct {
			Error  string `json:"error"`
			Codigo string `json:"codigo"`
		}
		if json.Unmarshal(contents, &apiFailure) == nil {
			if apiFailure.Error != "" {
				message = apiFailure.Error
				for _, secret := range []string{config.Token, os.Getenv("LINKANBAN_BOOTSTRAP_TOKEN"), headers.Get("x-linkanban-bootstrap-token")} {
					if secret != "" {
						message = strings.ReplaceAll(message, secret, "[redacted]")
					}
				}
				if len(message) > 500 {
					message = message[:500]
				}
			}
			if exitCode == 5 && safeAPICode(apiFailure.Codigo) {
				code = apiFailure.Codigo
			}
		}
		return nil, resp.StatusCode, &cliError{code, message, exitCode, resp.StatusCode}
	}
	if len(bytes.TrimSpace(contents)) == 0 {
		return json.RawMessage("null"), resp.StatusCode, nil
	}
	if !json.Valid(contents) {
		return nil, resp.StatusCode, &cliError{"api_error", "A API retornou JSON inválido.", 5, resp.StatusCode}
	}
	return contents, resp.StatusCode, nil
}

func safeAPICode(code string) bool {
	if code == "" || len(code) > 64 {
		return false
	}
	for _, char := range code {
		if (char < 'a' || char > 'z') && (char < '0' || char > '9') && char != '_' {
			return false
		}
	}
	return true
}

func (a *app) call(cmd *cobra.Command, method, path string, query url.Values, body any) error {
	data, status, err := a.request(cmd, method, path, query, body, nil, nil)
	if err != nil {
		return err
	}
	return a.success(data, cmd.CommandPath(), status)
}

func pathID(id string) (string, error) {
	if strings.TrimSpace(id) == "" || strings.ContainsAny(id, "/\\?#") {
		return "", usageError("ID inválido.")
	}
	return url.PathEscape(id), nil
}
