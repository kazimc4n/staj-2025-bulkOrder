CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    age TEXT,
    created_at DATE DEFAULT CURRENT_DATE
);


CREATE TABLE item (
    id SERIAL PRIMARY KEY,
    item_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE
);


CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    stock_number INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES item(id)
);

insert into item (id, item_name, price, stock, created_at)
values  (1, 'T-Shirt', 500.00, 10, '2025-07-08'),
        (2, 'Book', 450.00, 2, '2025-07-07'),
        (3, 'Phone', 45000.00, 21, '2025-07-04');

insert into users (id, username, age, created_at)
values  (1, 'Kazım', '23', '2025-07-08');

insert into orders (id, user_id, item_id, stock_number)
values  (1, 1, 3, 3),
        (2, 1, 3, 3),
        (3, 1, 2, 3),
        (4, 1, 3, 1);