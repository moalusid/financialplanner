-- Insert data into yearly_targets table
-- Some categories have consistent targets across all months, others vary

-- Consistent target categories
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Housing', 2500, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Utilities', 800, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Debt Payments', 1500, 1 FROM generate_series(1, 12) AS m;

-- Varying target categories
INSERT INTO yearly_targets (month, category, target, user_id) VALUES
(1, 'Groceries', 2000, 1),
(2, 'Groceries', 2100, 1),
(3, 'Groceries', 1900, 1),
(4, 'Groceries', 1950, 1),
(5, 'Groceries', 2050, 1),
(6, 'Groceries', 2000, 1),
(7, 'Groceries', 2100, 1),
(8, 'Groceries', 2150, 1),
(9, 'Groceries', 2200, 1),
(10, 'Groceries', 2000, 1),
(11, 'Groceries', 1900, 1),
(12, 'Groceries', 1950, 1),

(1, 'Transportation', 1200, 1),
(2, 'Transportation', 1100, 1),
(3, 'Transportation', 1150, 1),
(4, 'Transportation', 1300, 1),
(5, 'Transportation', 1250, 1),
(6, 'Transportation', 1200, 1),
(7, 'Transportation', 1350, 1),
(8, 'Transportation', 1400, 1),
(9, 'Transportation', 1300, 1),
(10, 'Transportation', 1250, 1),
(11, 'Transportation', 1150, 1),
(12, 'Transportation', 1200, 1),

(1, 'Dining Out', 900, 1),
(2, 'Dining Out', 1000, 1),
(3, 'Dining Out', 850, 1),
(4, 'Dining Out', 950, 1),
(5, 'Dining Out', 900, 1),
(6, 'Dining Out', 1000, 1),
(7, 'Dining Out', 1100, 1),
(8, 'Dining Out', 950, 1),
(9, 'Dining Out', 900, 1),
(10, 'Dining Out', 850, 1),
(11, 'Dining Out', 950, 1),
(12, 'Dining Out', 1000, 1),

-- Constant targets
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Savings', 2000, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Insurance', 600, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Entertainment', 750, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Health & Fitness', 500, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Shopping', 1000, 1 FROM generate_series(1, 12) AS m;
INSERT INTO yearly_targets (month, category, target, user_id)
SELECT m, 'Other', 300, 1 FROM generate_series(1, 12) AS m;
