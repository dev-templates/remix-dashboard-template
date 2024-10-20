.DEFAULT_GOAL := build-debug

.PHONY: build-debug
build-debug: build debug

.PHONY: build
build:
	@echo "building..."
	@docker build -t remix-app .

.PHONY: debug
run:
	@echo 'running...'
	@docker run -p 3000:3000 -e DATABASE_URL='file:./dev.db' -e SESSION_SECRET='rk5zIaNqDrqQIzQvh07v+oTjqUUqd2fbHbTmbbDEBDY=' --rm remix-app

.PHONY: save-image
save-image:
	@echo "保存镜像..."
	@docker save remix-app > remix-app.tar

.PHONY: transfer-image
transfer-image:
	@echo "传输镜像到远程服务器..."
	@scp remix-app.tar user@remote-server:/path/to/destination/

.PHONY: remote-run
remote-run:
	@echo "在远程服务器上运行镜像..."
	@ssh user@remote-server 'docker load < /path/to/destination/remix-app.tar && docker run -p 3000:3000 -e DATABASE_URL="file:./dev.db" -e SESSION_SECRET="rk5zIaNqDrqQIzQvh07v+oTjqUUqd2fbHbTmbbDEBDY=" --rm remix-app'

.PHONY: deploy
deploy: build save-image transfer-image remote-run
