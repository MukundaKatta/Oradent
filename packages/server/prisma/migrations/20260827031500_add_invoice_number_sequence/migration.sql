-- Additive-only migration: a Postgres sequence backing invoice number
-- generation (services/invoiceNumbering.ts). Replaces a random 4-digit
-- suffix that collided in practice once a practice issued ~100+ invoices in
-- a month (Invoice.invoiceNumber is @unique, so a collision made invoice
-- creation fail outright). Does not touch any existing table or column.

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;
