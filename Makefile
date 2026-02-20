SHELL := /bin/bash

.PHONY: help daily phase sync sync-dry sync-feature post-check post-check-tests close hooks-install

help:
	@echo "Codex workflow commands"
	@echo ""
	@echo "make daily                  Run phase + sync + post-check"
	@echo "make phase                  Detect current feature phase"
	@echo "make sync                   Rebuild task registry"
	@echo "make sync-dry               Preview task registry rebuild output"
	@echo "make sync-feature FEATURE=001  Rebuild registry for one feature"
	@echo "make post-check             Validate post-implementation gates"
	@echo "make post-check-tests       Validate gates and run tests"
	@echo "make close SUMMARY=\"...\"  Write session closure summary"
	@echo "make hooks-install          Install git hooks"

daily:
	@echo "==> phase"
	@$(MAKE) --no-print-directory phase
	@echo ""
	@echo "==> sync"
	@$(MAKE) --no-print-directory sync
	@echo ""
	@echo "==> post-check"
	@$(MAKE) --no-print-directory post-check

phase:
	@codex/scripts/phase-detect.sh --json

sync:
	@codex/scripts/tasks-sync.sh

sync-dry:
	@codex/scripts/tasks-sync.sh --dry-run

sync-feature:
	@if [ -z "$(FEATURE)" ]; then \
		echo "Usage: make sync-feature FEATURE=001"; \
		exit 1; \
	fi
	@codex/scripts/tasks-sync.sh --feature "$(FEATURE)"

post-check:
	@codex/scripts/post-impl-check.sh

post-check-tests:
	@codex/scripts/post-impl-check.sh --run-tests

close:
	@if [ -z "$(SUMMARY)" ]; then \
		echo "Usage: make close SUMMARY=\"what changed and next step\""; \
		exit 1; \
	fi
	@codex/scripts/session-close.sh --summary "$(SUMMARY)"

hooks-install:
	@.git-hooks/install.sh
