import psycopg2
import os

def retrieve(query):
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "postgres"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432")
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, description
        FROM products
        WHERE to_tsvector('english', name || ' ' || coalesce(description, ''))
              @@ plainto_tsquery(%s)
        LIMIT 5
    """, (query,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"id": r[0], "name": r[1], "content": r[2]} for r in rows]
