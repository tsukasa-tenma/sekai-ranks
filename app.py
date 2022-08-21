from flask import Flask, render_template
from pymongo import MongoClient
import json
import os

mongo_uri = os.environ.get("MONGODB_URI");
db_client = MongoClient(mongo_uri)
db = db_client["sekai-ranks"]

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def index():
    users = get_users()
    return render_template('index.html', data=users)

def get_all(collection):
    arr = []
    for item in db[collection].find({}):
        to_remove = ["_id", "id", "sk", "sh"]
        for key in to_remove:
            if key in item:
                item.pop(key)
        arr.append(item)
    return arr

# Get users
def get_users():
    users = get_all("users")
    return json.dumps(users)

if __name__ == '__main__':
   app.run(debug = True)
