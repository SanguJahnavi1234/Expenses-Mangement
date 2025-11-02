from flask import Flask, request, jsonify, render_template
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

app = Flask(__name__)

conn = psycopg2.connect(
    host="localhost",
    database="expenses",
    user="postgres",
    password="jahnavi",  
    port="5432"
)
cur = conn.cursor(cursor_factory=RealDictCursor)  

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/add-expense', methods=['POST'])
def add_expense():
    data = request.get_json()
    title = data.get('title')
    amount = data.get('amount')
    category = data.get('category')
    date = data.get('date', datetime.now().date())

    cur.execute("""
        INSERT INTO expenses (title, amount, category, date)
        VALUES (%s, %s, %s, %s)
    """, (title, amount, category, date))
    conn.commit()

    return jsonify({"status": "success", "message": "Expense added!"})

@app.route('/expenses', methods=['GET'])
def get_expenses():
    month = request.args.get('month', type=int)
    year = request.args.get('year', type=int)

    if month and year:
        cur.execute("""
            SELECT * FROM expenses
            WHERE EXTRACT(MONTH FROM date) = %s
            AND EXTRACT(YEAR FROM date) = %s
            ORDER BY date DESC
        """, (month, year))
    else:
        cur.execute("SELECT * FROM expenses ORDER BY date DESC")

    rows = cur.fetchall()
    return jsonify(rows)

@app.route('/delete-expense/<int:id>', methods=['DELETE'])
def delete_expense(id):
    cur.execute("DELETE FROM expenses WHERE id = %s", (id,))
    conn.commit()
    return jsonify({"status": "success", "message": f"Expense {id} deleted."})

if __name__ == '__main__':
    app.run(debug=True)




#cd "C:\Users\SANGU JAHNAVI\OneDrive\Desktop\Projects\Expense Manager"