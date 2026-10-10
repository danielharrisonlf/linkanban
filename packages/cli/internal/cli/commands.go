package cli

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

type bodyField struct {
	flag, key string
	boolean   bool
}

func (a *app) resourceCommands() []*cobra.Command {
	candidates := &cobra.Command{Use: "candidaturas", Short: "Consulta e altera candidaturas"}
	candidates.AddCommand(a.candidateList())
	candidates.AddCommand(a.simple("get <id>", "Consulta uma candidatura", "GET", "/candidaturas", 1))
	candidateFields := []bodyField{
		{"vaga-nome", "vaga_nome", false}, {"empresa-id", "empresa_id", false},
		{"status", "status", false}, {"data-aplicacao", "data_aplicacao", false},
		{"descricao", "descricao", false}, {"link-vaga", "link_vaga", false},
		{"salario-estimado", "salario_estimado", false}, {"origem", "origem", false},
		{"observacoes", "observacoes", false}, {"motivo-recusa", "motivo_recusa", false},
	}
	candidates.AddCommand(a.bodyCommand("create", "Cria uma candidatura", "POST", "/candidaturas", 0, candidateFields, []string{"vaga_nome", "empresa_id"}))
	candidates.AddCommand(a.bodyCommand("update <id>", "Altera campos de uma candidatura", "PUT", "/candidaturas", 1, candidateFields, nil))
	restoreFields := append([]bodyField{{"id", "id", false}}, candidateFields...)
	candidates.AddCommand(a.bodyCommand("restore", "Restaura uma candidatura excluída", "POST", "/candidaturas/restaurar", 0, restoreFields, []string{"id", "vaga_nome", "empresa_id"}))
	candidates.AddCommand(a.fixedBody("status <id> <status>", "Muda a etapa", "PATCH", "/candidaturas", 2, func(args []string) map[string]any { return map[string]any{"status": args[1]} }, "/status"))
	candidates.AddCommand(a.fixedBody("archive <id>", "Arquiva uma candidatura", "PATCH", "/candidaturas", 1, func(_ []string) map[string]any { return map[string]any{"ativa": false} }, "/arquivar"))
	candidates.AddCommand(a.fixedBody("unarchive <id>", "Reativa uma candidatura", "PATCH", "/candidaturas", 1, func(_ []string) map[string]any { return map[string]any{"ativa": true} }, "/arquivar"))
	candidates.AddCommand(a.simple("delete <id>", "Exclui uma candidatura", "DELETE", "/candidaturas", 1))

	companies := &cobra.Command{Use: "empresas", Short: "Consulta e altera empresas"}
	companies.AddCommand(a.simple("list", "Lista empresas", "GET", "/empresas", 0))
	companyFields := []bodyField{
		{"nome", "nome", false}, {"tecnologias", "tecnologias", false},
		{"estado", "estado", false}, {"modelo-trabalho", "modelo_trabalho", false},
		{"site", "site", false}, {"observacoes", "observacoes", false},
	}
	companies.AddCommand(a.bodyCommand("create", "Cria uma empresa", "POST", "/empresas", 0, companyFields, []string{"nome"}))
	companies.AddCommand(a.bodyCommand("update <id>", "Atualiza uma empresa; nome é obrigatório", "PUT", "/empresas", 1, companyFields, []string{"nome"}))
	companies.AddCommand(a.simple("delete <id>", "Exclui uma empresa", "DELETE", "/empresas", 1))

	followups := &cobra.Command{Use: "followups", Short: "Consulta e altera follow-ups"}
	followups.AddCommand(a.simple("list", "Lista follow-ups", "GET", "/followups", 0))
	followups.AddCommand(a.bodyCommand("create", "Agenda um follow-up", "POST", "/followups", 0,
		[]bodyField{{"candidatura-id", "candidatura_id", false}, {"data-prevista", "data_prevista", false}, {"nota", "nota", false}},
		[]string{"candidatura_id", "data_prevista"}))
	followups.AddCommand(a.bodyCommand("update <id>", "Altera um follow-up", "PATCH", "/followups", 1,
		[]bodyField{{"feito", "feito", true}, {"data-prevista", "data_prevista", false}, {"nota", "nota", false}}, nil))
	followups.AddCommand(a.fixedBody("done <id>", "Marca o follow-up como feito", "PATCH", "/followups", 1, func(_ []string) map[string]any { return map[string]any{"feito": true} }, ""))
	followups.AddCommand(a.fixedBody("reopen <id>", "Reabre um follow-up", "PATCH", "/followups", 1, func(_ []string) map[string]any { return map[string]any{"feito": false} }, ""))
	followups.AddCommand(a.resultCommand())
	followups.AddCommand(a.simple("delete <id>", "Exclui um follow-up", "DELETE", "/followups", 1))

	return []*cobra.Command{
		candidates, companies, followups,
		a.simple("resumo", "Consulta o resumo do pipeline", "GET", "/resumo", 0),
		a.simple("dashboard", "Consulta o dashboard", "GET", "/dashboard", 0),
		a.simple("opcoes", "Consulta opções sugeridas", "GET", "/opcoes", 0),
		{Use: "health", Short: "Verifica a API", Args: cobra.NoArgs, RunE: func(cmd *cobra.Command, _ []string) error {
			return a.call(cmd, "GET", "health", nil, nil)
		}},
	}
}

func (a *app) candidateList() *cobra.Command {
	cmd := &cobra.Command{Use: "list", Short: "Lista candidaturas com filtros", Args: cobra.NoArgs}
	for _, name := range []string{"busca", "status", "ordenar"} {
		cmd.Flags().String(name, "", "filtro de listagem")
	}
	cmd.Flags().Bool("incluir-arquivadas", false, "inclui candidaturas arquivadas")
	cmd.Flags().Int("pagina", 0, "página (começa em 1)")
	cmd.Flags().Int("limite", 0, "quantidade por página")
	cmd.RunE = func(cmd *cobra.Command, _ []string) error {
		query := url.Values{}
		for _, name := range []string{"busca", "status", "ordenar"} {
			if cmd.Flags().Changed(name) {
				value, _ := cmd.Flags().GetString(name)
				query.Set(name, value)
			}
		}
		if cmd.Flags().Changed("incluir-arquivadas") {
			value, _ := cmd.Flags().GetBool("incluir-arquivadas")
			query.Set("incluirArquivadas", strconv.FormatBool(value))
		}
		for _, name := range []string{"pagina", "limite"} {
			if cmd.Flags().Changed(name) {
				value, _ := cmd.Flags().GetInt(name)
				if value < 1 {
					return usageError("Página e limite devem ser positivos.")
				}
				query.Set(name, strconv.Itoa(value))
			}
		}
		return a.call(cmd, "GET", "/candidaturas", query, nil)
	}
	return cmd
}

func (a *app) simple(use, short, method, route string, count int) *cobra.Command {
	cmd := &cobra.Command{Use: use, Short: short, Args: cobra.ExactArgs(count)}
	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		path := route
		if count == 1 {
			id, err := pathID(args[0])
			if err != nil {
				return err
			}
			path += "/" + id
		}
		return a.call(cmd, method, path, nil, nil)
	}
	return cmd
}

func (a *app) fixedBody(use, short, method, route string, count int, body func([]string) map[string]any, suffix string) *cobra.Command {
	cmd := &cobra.Command{Use: use, Short: short, Args: cobra.ExactArgs(count)}
	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		id, err := pathID(args[0])
		if err != nil {
			return err
		}
		return a.call(cmd, method, route+"/"+id+suffix, nil, body(args))
	}
	return cmd
}

func (a *app) bodyCommand(use, short, method, route string, count int, fields []bodyField, required []string) *cobra.Command {
	cmd := &cobra.Command{Use: use, Short: short, Args: cobra.ExactArgs(count)}
	cmd.Flags().String("data", "", "objeto JSON; use - para stdin ou @arquivo")
	for _, field := range fields {
		if field.boolean {
			cmd.Flags().Bool(field.flag, false, field.key)
		} else {
			cmd.Flags().String(field.flag, "", field.key)
		}
	}
	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		body, err := a.readBody(cmd)
		if err != nil {
			return err
		}
		for _, field := range fields {
			if !cmd.Flags().Changed(field.flag) {
				continue
			}
			if field.boolean {
				value, _ := cmd.Flags().GetBool(field.flag)
				body[field.key] = value
			} else {
				value, _ := cmd.Flags().GetString(field.flag)
				body[field.key] = value
			}
		}
		for _, name := range required {
			value, ok := body[name].(string)
			if !ok || strings.TrimSpace(value) == "" {
				return usageError("Campo obrigatório ausente: " + name + ".")
			}
		}
		if len(body) == 0 {
			return usageError("Informe dados por flags ou --data.")
		}
		path := route
		if count == 1 {
			id, err := pathID(args[0])
			if err != nil {
				return err
			}
			path += "/" + id
		}
		return a.call(cmd, method, path, nil, body)
	}
	return cmd
}

func (a *app) readBody(cmd *cobra.Command) (map[string]any, error) {
	result := map[string]any{}
	if !cmd.Flags().Changed("data") {
		return result, nil
	}
	raw, _ := cmd.Flags().GetString("data")
	var contents []byte
	var err error
	switch {
	case raw == "-":
		contents, err = io.ReadAll(io.LimitReader(a.in, 1024*1024+1))
	case strings.HasPrefix(raw, "@"):
		contents, err = os.ReadFile(strings.TrimPrefix(raw, "@"))
	default:
		contents = []byte(raw)
	}
	if err != nil || len(contents) > 1024*1024 {
		return nil, usageError("Não foi possível ler --data (limite de 1 MiB).")
	}
	if json.Unmarshal(contents, &result) != nil || result == nil {
		return nil, usageError("--data exige um objeto JSON válido.")
	}
	return result, nil
}

func (a *app) resultCommand() *cobra.Command {
	cmd := &cobra.Command{Use: "result <id> <resultado>", Short: "Registra o resultado de um follow-up", Args: cobra.ExactArgs(2)}
	cmd.Flags().String("nota", "", "nota do contato")
	cmd.Flags().String("reagendar-para", "", "nova data quando resultado é ADIARAM")
	cmd.Flags().String("data", "", "objeto JSON; use - para stdin ou @arquivo")
	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		id, err := pathID(args[0])
		if err != nil {
			return err
		}
		body, err := a.readBody(cmd)
		if err != nil {
			return err
		}
		body["resultado"] = args[1]
		for _, field := range []bodyField{{"nota", "nota", false}, {"reagendar-para", "reagendar_para", false}} {
			if cmd.Flags().Changed(field.flag) {
				value, _ := cmd.Flags().GetString(field.flag)
				body[field.key] = value
			}
		}
		return a.call(cmd, "POST", "/followups/"+id+"/resultado", nil, body)
	}
	return cmd
}

func (a *app) configCommands() *cobra.Command {
	config := &cobra.Command{Use: "config", Short: "Mostra ou altera a configuração", Args: cobra.NoArgs}
	config.RunE = func(cmd *cobra.Command, _ []string) error {
		resolved, err := a.resolvedConfig(cmd)
		if err != nil {
			return err
		}
		path, err := a.configPath()
		if err != nil {
			return err
		}
		return a.success(map[string]any{"api_url": resolved.APIURL, "token_configured": resolved.Token != "", "config_path": path}, cmd.CommandPath(), 0)
	}
	config.AddCommand(&cobra.Command{Use: "set <api-url|token> <value>", Short: "Salva URL ou token localmente", Args: cobra.ExactArgs(2), RunE: func(cmd *cobra.Command, args []string) error {
		stored, path, err := a.readConfig()
		if err != nil {
			return err
		}
		switch args[0] {
		case "api-url":
			stored.APIURL, err = normalizeAPIURL(args[1])
			if err != nil {
				return err
			}
		case "token":
			if strings.TrimSpace(args[1]) == "" {
				return usageError("Token vazio.")
			}
			stored.Token = args[1]
		default:
			return usageError("Use api-url ou token.")
		}
		if err := a.saveConfig(stored, path); err != nil {
			return err
		}
		return a.success(map[string]any{"configured": true, "config_path": path, "token_configured": stored.Token != ""}, cmd.CommandPath(), 0)
	}})
	config.AddCommand(&cobra.Command{Use: "unset <api-url|token>", Short: "Remove URL ou token local", Args: cobra.ExactArgs(1), RunE: func(cmd *cobra.Command, args []string) error {
		stored, path, err := a.readConfig()
		if err != nil {
			return err
		}
		switch args[0] {
		case "api-url":
			stored.APIURL = ""
		case "token":
			stored.Token = ""
		default:
			return usageError("Use api-url ou token.")
		}
		if err := a.saveConfig(stored, path); err != nil {
			return err
		}
		return a.success(map[string]any{"configured": true, "config_path": path, "token_configured": stored.Token != ""}, cmd.CommandPath(), 0)
	}})
	return config
}

func (a *app) authCommands() *cobra.Command {
	auth := &cobra.Command{Use: "auth", Short: "Configura a autenticação"}
	bootstrap := &cobra.Command{Use: "bootstrap", Short: "Obtém o primeiro token da API", Args: cobra.NoArgs}
	bootstrap.Flags().String("bootstrap-token", "", "segredo de bootstrap (prefira LINKANBAN_BOOTSTRAP_TOKEN)")
	bootstrap.Flags().String("email", "", "email do usuário inicial")
	bootstrap.Flags().String("nome", "", "nome do usuário inicial")
	bootstrap.RunE = func(cmd *cobra.Command, _ []string) error {
		config, path, err := a.readConfig()
		if err != nil {
			return err
		}
		resolved, err := a.resolvedConfig(cmd)
		if err != nil {
			return err
		}
		if resolved.Token != "" {
			config.Token = resolved.Token
			config.APIURL = resolved.APIURL
			if err := a.saveConfig(config, path); err != nil {
				return err
			}
			return a.success(map[string]any{"configured": true, "token_configured": true, "config_path": path}, cmd.CommandPath(), 0)
		}
		secret, _ := cmd.Flags().GetString("bootstrap-token")
		if secret == "" {
			secret = os.Getenv("LINKANBAN_BOOTSTRAP_TOKEN")
		}
		headers := http.Header{}
		if secret != "" {
			headers.Set("x-linkanban-bootstrap-token", secret)
		}
		body := map[string]any{}
		for _, name := range []string{"email", "nome"} {
			if cmd.Flags().Changed(name) {
				value, _ := cmd.Flags().GetString(name)
				body[name] = value
			}
		}
		empty := ""
		data, status, err := a.request(cmd, "POST", "/auth/bootstrap", nil, body, &empty, headers)
		if err != nil {
			return err
		}
		var result struct {
			Token string `json:"token"`
		}
		if json.Unmarshal(data, &result) != nil || result.Token == "" {
			return &cliError{"api_error", "Bootstrap não retornou um token.", 5, status}
		}
		config.APIURL, config.Token = resolved.APIURL, result.Token
		if err := a.saveConfig(config, path); err != nil {
			return err
		}
		return a.success(map[string]any{"configured": true, "token_configured": true, "config_path": path}, cmd.CommandPath(), status)
	}
	auth.AddCommand(bootstrap)
	return auth
}
