from flask import Flask, render_template, request, redirect, url_for
from pymongo import MongoClient, UpdateOne
import json
import os
import time
import json
import secrets

mongo_uri = os.environ.get("MONGODB_URI");
db_client = MongoClient(mongo_uri)
db = db_client["sekai-ranks"]

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def index():
    users = get_users()
    return render_template('index.html', data=users)

# Basic route for CAP (chart constant tier list)
@app.route("/cap")
def index_cap():
    print("Get constants!")
    constants = get_constants()
    return render_template('cap.html', data=constants)

# Route for editing your personal tier list
@app.route("/cap/edit")
def index_cap_edit():
    # Must have arguments passed in via a link: user id and key
    args = request.args
    print(args)
    # Ensure the user and key were passed in
    if not "user" in args:
        print("No user, redirect")
        return redirect(url_for('index_cap'))
    if not "key" in args:
        print("No key, redirect")
        return redirect(url_for('index_cap'))
    user_id = args.get("user")
    print(user_id)
    # Find a matching key of type "open"
    matching_key = db["keys"].find_one({"user": user_id, "key": args.get("key"), "keytype": "open"})
    print(matching_key)
    if matching_key is None:
        print("No matching key, redirect")
        return redirect(url_for('index_cap'))
    # Make sure the key hasn't expired yet
    if matching_key["expires"] < time.time():
        print("Expired matching key, redirect")
        return redirect(url_for('index_cap'))
    # User has been authenticated. Make a new key and send it to the user
    new_key = str(secrets.randbelow(10 ** 16))
    print(new_key)
    expires_at = time.time() + 36000 # 10 hours
    print(expires_at)
    # Get the user's ratings
    user_ratings = get_user_ratings(user_id)
    print(user_ratings)
    # Clear existing keys for that user
    # db["keys"].delete_many({"user": str(user_id)})
    # Make them a new key
    db["keys"].insert_one({"user": str(user_id), "key": new_key, "keytype": "edit", "expires": expires_at})
    # Send them the key and their user ratings
    user_data = {"user": str(user_id), "key": new_key, "ratings": get_user_ratings(user_id), "edit": True}
    user_data_str = json.dumps(user_data)
    print("User data string!!")
    print(user_data_str)
    return render_template('cap.html', data=user_data_str)

# Route for submitting tier list edits
@app.route("/cap/submit", methods=["POST"])
def cap_submit():
    # Submitted data
    data = request.json
    if not "user" in data:
        return edit_failed()
    if not "key" in data:
        return edit_failed()
    user_id = data["user"]
    key = data["key"]
    # Find a matching key of type "edit"
    matching_key = db["keys"].find_one({"user": user_id, "key": key, "keytype": "edit"})
    if matching_key is None:
        return edit_failed()
    # Make sure the key hasn't expired yet
    if matching_key["expires"] < time.time():
        return edit_failed()
    # Post chart rating edits
    operations = [UpdateOne({"user": user_id, "song": edit["song"], "diff": edit["diff"]}, {"$set": {"user": user_id, "song": edit["song"], "diff": edit["diff"], "cc": edit["cc"]}}, upsert=True) for edit in data["edits"]]
    result = db["ratings"].bulk_write(operations)
    db["ratings"].delete_many({"cc": None})
    return json.dumps({"success": True, "message": "Edit succeeded"})

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

# Get computed chart constants
def get_constants():
    constants = get_all("constants")
    return json.dumps({"constants": constants, "edit": False})

# Get user ratings
def get_user_ratings(user):
    arr = []
    user_ratings = db["ratings"].find({"user": user})
    for item in user_ratings:
        to_remove = ["_id", "id", "user"]
        for key in to_remove:
            if key in item:
                item.pop(key)
        arr.append(item)
    return arr

def edit_failed():
    return json.dumps({"success": False, "message": "Edit failed"})

if __name__ == '__main__':
   app.run(debug = True)
