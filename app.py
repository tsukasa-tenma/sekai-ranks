from flask import Flask, render_template
from pymongo import MongoClient
import json
import os

awake = False

mongo_uri = os.environ.get("MONGODB_URI");
db_client = MongoClient(mongo_uri)
db = db_client["sekai-ranks"]

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def index():
    if awake:
        users = get_users()
        return render_template('index.html', data=users)
    else:
        global awake = True
        return "Waking up! Give me a second and then refresh!"

def get_all(collection):
    arr = []
    for item in db[collection].find({}):
        item.pop("_id")
        if collection == "players":
            item["id"] = str(item["id"])
        arr.append(item)
    return arr

# Get users
def get_users():
    users = get_all("users")
    return json.dumps(users)

if __name__ == '__main__':
   app.run(debug = True)
