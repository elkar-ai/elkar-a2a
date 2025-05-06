include .env

db-up:
	docker-compose up -V --build --force-recreate -d test-db

db-upgrade:
	DATABASE_URL=${DATABASE_URL} diesel migration run

db-downgrade:
	SQLALCHEMY_DATABASE_URI=${DATABASE_URL} diesel migration revert -a
