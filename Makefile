.DEFAULT_GOAL := all
all: build debug

.PHONY: build
build:
	@echo "building..."
	@docker build -t remix-app .

.PHONY: debug
run:
	@echo 'running...'
	@docker run -p 3000:3000 -e DATABASE_URL='file:./dev.db' -e SESSION_SECRET='rk5zIaNqDrqQIzQvh07v+oTjqUUqd2fbHbTmbbDEBDY=' --rm remix-app