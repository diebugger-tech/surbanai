.PHONY: help dev stop db-start db-stop db-init status

help: ## Zeigt diese Hilfe
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Startet den Vite Dev-Server (Port 5174)
	@echo "🚀 Starte KAiOSS..."
	trap 'kill %1' SIGINT; npm run dev & node scripts/todo-sync.js

todo-sync: ## Startet den TODO.md -> SurrealDB Sync manuell
	node scripts/todo-sync.js

stop: ## Stoppt den Dev-Server
	@echo "🛑 Stoppe KAiOSS..."
	@fuser -k 5174/tcp 2>/dev/null || true
	@echo "✅ Gestoppt"

db-start: ## Startet SurrealDB lokal
	@echo "🗄️ Starte SurrealDB..."
	surreal start --bind 127.0.0.1:8000 --user root --pass root surrealkv://./data &
	@echo "✅ SurrealDB läuft auf ws://localhost:8000"

db-stop: ## Stoppt SurrealDB
	@echo "🛑 Stoppe SurrealDB..."
	@pkill -f "surreal start" 2>/dev/null || true
	@echo "✅ Gestoppt"

db-init: ## Initialisiert Demo-Daten in SurrealDB
	@echo "📦 Lade Demo-Daten..."
	surreal sql --endpoint ws://localhost:8000 \
		--username root --password root \
		--namespace kaioss --database kaioss \
		--hide-welcome <<< "CREATE projekt:demo SET name='Demo Projekt', status='backlog', desc='Beispiel Projekt', tags=['#demo'], icon='📋', updated=time::now();"
	@echo "✅ Demo-Daten geladen"

status: ## Zeigt Status von SurrealDB und Dev-Server
	@echo "--- KAiOSS Status ---"
	@ss -tlnp | grep 5174 && echo "✅ Dev-Server: läuft (5174)" || echo "❌ Dev-Server: gestoppt"
	@ss -tlnp | grep 8000 && echo "✅ SurrealDB: läuft (8000)" || echo "❌ SurrealDB: gestoppt"

db-backup:
	@echo "Creating backup..."
	surreal export --conn http://localhost:8000 \
	  --user root --pass root \
	  --ns kaioss --db kaioss \
	  kaioss_backup_$(shell date +%Y%m%d_%H%M%S).surql
	@echo "Backup done."
