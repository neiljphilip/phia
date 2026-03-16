import csv
import os
from os import name

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from flask import abort, Flask, jsonify, request
from pymongo import MongoClient

load_dotenv()
app = Flask(__name__)

# Initialize Mongo
client = MongoClient("mongodb://localhost:27017/")
db = client.phia_catalog
catalog = db.product_page


class Product:
    name: str
    price: float

    def __init__(self, name, price, brand, category):
        self.name = name
        self.price = price
        self.brand = brand
        self.category = category

    def to_dict(self):
        return {
            "name": self.name,
            "price": self.price,
            "brand": self.brand,
            "category": self.category,
        }

    def from_dict(data):
        return Product(data["name"], data["price"], data["brand"], data["category"])


def parse_csv(filepath):
    """Parse a CSV file with schema id,image,price,name,brand,num and insert products into MongoDB."""
    products = []
    with open(filepath, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            product = {
                "id": row["id"],
                "image": row["image"],
                "price": float(row["price"]),
                "name": row["name"],
                "brand": row["brand"],
                "num": int(row["num"]),
            }
            products.append(product)

    if products:
        result = catalog.insert_many(products)
        print(f"Inserted {len(result.inserted_ids)} products from {filepath}")
    return products


# Routes
# Root
@app.route("/")
def index() -> str:
    return "Hello, World!"


# Health Check
@app.route("/health", methods=["GET"])
def health() -> None:
    return jsonify({"status": "ok", "db": "connected"})


@app.route("/products", methods=["POST"])
def create_product() -> tuple:
    data = request.get_json()
    if not data["name"] or not data["price"]:
        abort(400, "Missing name or price")
    product = catalog.insert_one(data)
    doc = catalog.find_one({"_id": product.inserted_id})
    if not doc:
        abort(500, "Failed to create product")
    doc["_id"] = str(doc["_id"])
    return jsonify(doc), 201


@app.route("/products/<product_id>", methods=["GET"])
def get_product(product_id) -> None:
    try:
        product = catalog.find_one({"_id": ObjectId(product_id)})
        product["_id"] = str(product["_id"])
        if product:
            return jsonify(product), 200
        else:
            abort(404)
    except InvalidId:
        abort(400)


@app.route("/products/<product_id>", methods=["PUT"])
def update_product(product_id):
    data = request.get_json()
    if not data["name"] or not data["price"]:
        abort(400, "Missing name or price")
    try:
        product = catalog.update_one({"_id": ObjectId(product_id)}, {"$set": data})
        if product.matched_count == 0:
            abort(404, "No Product to Update")
        elif product.modified_count == 0:
            abort(304, "No Changes to Product")
        else:
            return jsonify("Updated"), 200
    except InvalidId:
        abort(400)


@app.route("/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        product = catalog.delete_one({"_id": ObjectId(product_id)})
        if product.deleted_count == 0:
            abort(404, "No Product to Delete")
        else:
            return jsonify("Deleted"), 200
    except InvalidId:
        abort(400)


@app.route("/products", methods=["GET"])
def filter_and_page_products():
    query = {}
    if category := request.args.get("category"):
        query["category"] = category
    if brand := request.args.get("brand"):
        query["brand"] = {"$regex": brand, "$options": "i"}
    if min_price := request.args.get("min_price"):
        query["price"] = {"$gte": float(min_price)}
    if max_price := request.args.get("max_price"):
        query["price"] = query.get("price", {})
        query["price"]["$lte"] = float(max_price)

    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    skip = (page - 1) * limit

    results = list(catalog.find(query).skip(skip).limit(limit))

    for r in results:
        r["_id"] = str(r["_id"])

    return (
        jsonify(
            {
                "products": results,
                "page": page,
                "limit": limit,
                "total": catalog.count_documents(query),
            }
        ),
        200,
    )


@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad Request"}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not Found"}), 404


if __name__ == "__main__":
    print("🚀 http://localhost:8000 | http://127.0.0.1:8000")
    print("💾 MongoDB: localhost:27017/phia_interview")
    app.run(debug=True, port=8000, host="0.0.0.0")
