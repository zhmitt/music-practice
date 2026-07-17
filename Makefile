SHELL := /bin/bash

.PHONY: help verify governance-check change-done daily phase sync sync-dry sync-feature post-check post-check-tests close hooks-install

help:
	@echo "Codex workflow commands"
	@echo ""
	@echo "make verify                 Run the canonical repository verification suite"
	@echo "make governance-check       Run negative governance and contract checks"
	@echo "make change-done CHANGE=id  Run the canonical completion gate"
	@echo "make daily                  Run phase + sync + post-check"
	@echo "make phase                  Detect current feature phase"
	@echo "make sync                   Rebuild task registry"
	@echo "make sync-dry               Preview task registry rebuild output"
	@echo "make sync-feature FEATURE=001  Rebuild registry for one feature"
	@echo "make post-check             Validate post-implementation gates"
	@echo "make post-check-tests       Validate gates and run tests"
	@echo "make close SUMMARY=\"...\"  Write session closure summary"
	@echo "make hooks-install          Install git hooks"

verify:
	@workflow/scripts/verify.sh

governance-check:
	@workflow/scripts/quality-gates-self-test.sh

change-done:
	@if [ -z "$(CHANGE)" ]; then echo "Usage: make change-done CHANGE=<change-id>"; exit 1; fi
	@workflow/scripts/change-done.sh --change "$(CHANGE)"

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
	@workflow/scripts/phase-status.sh $(if $(CHANGE),--change "$(CHANGE)",) --json

sync:
	@workflow/scripts/tasks-sync.sh $(if $(CHANGE),--change "$(CHANGE)",)

sync-dry:
	@workflow/scripts/tasks-sync.sh $(if $(CHANGE),--change "$(CHANGE)",) --dry-run

sync-feature:
	@if [ -z "$(FEATURE)" ]; then \
		echo "Usage: make sync-feature FEATURE=001"; \
		exit 1; \
	fi
	@workflow/scripts/tasks-sync.sh --change "$(FEATURE)"

post-check:
	@if [ -z "$(CHANGE)" ]; then echo "Usage: make post-check CHANGE=<change-id>"; exit 1; fi
	@workflow/scripts/post-impl-check.sh --change "$(CHANGE)"

post-check-tests:
	@if [ -z "$(CHANGE)" ]; then echo "Usage: make post-check-tests CHANGE=<change-id>"; exit 1; fi
	@workflow/scripts/verify.sh
	@workflow/scripts/post-impl-check.sh --change "$(CHANGE)"

close:
	@if [ -z "$(SUMMARY)" ]; then \
		echo "Usage: make close SUMMARY=\"what changed and next step\""; \
		exit 1; \
	fi
	@workflow/scripts/session-close.sh --summary "$(SUMMARY)"

hooks-install:
	@.git-hooks/install.sh
