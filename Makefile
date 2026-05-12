.PHONY: up down logs clean restart build

## Start the full stack
up:
	docker compose up -d --build
	@echo ""
	@echo "✅  NextBike is starting up!"
	@echo ""
	@echo "  Frontend  → http://localhost:3000"
	@echo "  Backend   → http://localhost:3001"
	@echo "  Kafka UI  → http://localhost:8080"
	@echo ""

## Stop all containers
down:
	docker compose down

## Tail logs for all services
logs:
	docker compose logs -f

## Tail only backend logs
logs-backend:
	docker compose logs -f backend

## Tail only frontend logs
logs-frontend:
	docker compose logs -f frontend

## Tail only Kafka logs
logs-kafka:
	docker compose logs -f kafka

## Rebuild all images
build:
	docker compose build --no-cache

## Restart a single service: make restart svc=backend
restart:
	docker compose restart $(svc)

## Remove all containers, volumes, and images
clean:
	docker compose down -v --rmi all

## Show container status
status:
	docker compose ps
