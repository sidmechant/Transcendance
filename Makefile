FILE = ./docker compose.yml

up :
	docker compose  up   --build

clean :
	docker compose down
fclean :
	docker compose down
	docker volume ls --format "{{.Name}}" | xargs docker volume rm
	docker system prune -af
