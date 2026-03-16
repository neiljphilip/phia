import os

from dotenv import load_dotenv




load_dotenv()
app = Flask(__name__)

## LOCALHOST MONGO
client = MongoClient("mongodb://localhost:27017/")
db = client.phia_interview
product = db.products


@app.route("/")
def index() -> str:
    return "Hello, World!"
