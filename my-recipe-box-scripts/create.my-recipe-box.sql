CREATE TYPE speed AS ENUM ('quick', 'medium', 'slow');

CREATE TABLE recipes (
	id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
	name TEXT NOT NULL,
	url TEXT NOT NULL,
	ingredients TEXT NOT NULL,
	instructions TEXT NOT NULL,
	notes TEXT,
	cooking_speed speed NOT NULL
);
