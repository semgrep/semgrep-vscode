import sqlite3


def find_user(conn, email):
    cur = conn.cursor()
    # Tainted SQL: user input concatenated into a query string.
    cur.execute("SELECT * FROM users WHERE email = '%s'" % email)
    return cur.fetchall()
