import os

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from flask import abort, Flask, jsonify, request
from pymongo import MongoClient

load_dotenv()
app = Flask(__name__)

# LOCALHOST MONGO - 100% ready
client = MongoClient("mongodb://localhost:27017/")
db = client.phia_interview
products = db.products

class Product:
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

    @staticmethod
    def from_dict(data):
        return Product(
            data["name"], data["price"], data["brand"], data["category"]
        )


# Root
@app.route("/")
def index() -> str:
    return "Hello, World!"

@app.route("/ping")
def ping():
    try:
        client.admin.command("ping")
        return jsonify({"status": "ok", "db": "connected"})
    except Exception as e:
        return jsonify({"status": "error", "db": "disconnected", "error": str(e)})



# === HEALTH CHECK ===
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db": "connected"})


# === FULL CRUD ===
@app.route("/products", methods=["POST"])
def create_product():
    data = request.get_json()
    if not data.get("name") or not data.get("price"):
        abort(400, "Missing name or price")
    product = Product.from_dict(data)
    result = products.insert_one(product.to_dict())
    doc = products.find_one({"_id": result.inserted_id})
    doc["_id"] = str(doc["_id"])
    return jsonify(doc), 201


@app.route("/products_redundant", methods=["POST"])
def create_product_redundant() -> tuple[str, int]:
    data = request.get_json()
    if not data.get("name") or not data.get("price"):
        abort(400, "Missing name or price")
    result = products
    doc = products.find_one({"_id": result.inserted_id})
    doc["_id"] = str(doc["_id"])
    return jsonify(doc), 201

@app.route("/productsredundant/<product_id>", methods=["GET"])
def get_product_redundant(product_id) -> str | None:
    try:
        product = products.find_one({"_id": ObjectId(product_id)})
        if not product:
            abort(404, "Product not found")
        product["_id"] = str(product["_id"])
        return jsonify(product)
    except InvalidId:
        abort(400, "Invalid product ID")


@app.route("/products/<product_id>", methods=["GET"])
def get_product(product_id):
    try:
        product = products.find_one({"_id": ObjectId(product_id)})
        if not product:
            abort(404, "Product not found")
        product["_id"] = str(product["_id"])
        return jsonify(product)
    except InvalidId:
        abort(400, "Invalid product ID")


@app.route("/products/<product_id>", methods=["PUT"])
def update_product(product_id):
    try:
        data = request.get_json()
        result = products.update_one({"_id": ObjectId(product_id)}, {"$set": data})
        if result.modified_count == 0:
            abort(404, "Product not found")
        return jsonify({"modified": True})
    except InvalidId:
        abort(400, "Invalid product ID")


@app.route("/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        result = products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            abort(404, "Product not found")
        return jsonify({"deleted": True})
    except InvalidId:
        abort(400, "Invalid product ID")


# === FILTERING + PAGINATION (PHIA READY) ===
@app.route("/products", methods=["GET"])
def list_products():
    query = {}
    if brand := request.args.get("brand"):
        query["brand"] = {"$regex": brand, "$options": "i"}
    if category := request.args.get("category"):
        query["category"] = category
    if min_price := request.args.get("min_price"):
        query["price"] = {"$gte": float(min_price)}
    if max_price := request.args.get("max_price"):
        query["price"] = query.get("price", {})
        query["price"]["$lte"] = float(max_price)

    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    skip = (page - 1) * limit

    results = list(products.find(query).skip(skip).limit(limit))
    for r in results:
        r["_id"] = str(r["_id"])

    return jsonify(
        {
            "products": results,
            "page": page,
            "limit": limit,
            "total": products.count_documents(query),
        }
    )


# === FASHION AI RECOMMENDATIONS ===
@app.route("/users/<user_id>/recommendations", methods=["GET"])
def get_recommendations(user_id):
    # Mock wardrobe-based recs
    pipeline = [
        {"$match": {"category": "tops"}},  # User preference
        {"$sample": {"size": 5}},
        {"$addFields": {"score": {"$rand": {}}}},
    ]
    recs = list(products.aggregate(pipeline))
    for r in recs:
        r["_id"] = str(r["_id"])
    return jsonify(recs)


# === BRAND ANALYTICS ===
@app.route("/analytics/brands", methods=["GET"])
def brand_analytics():
    pipeline = [
        {
            "$group": {
                "_id": "$brand",
                "avg_price": {"$avg": "$price"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"avg_price": -1}},
        {"$limit": 10},
    ]
    results = list(products.aggregate(pipeline))
    for r in results:
        r["brand"] = r.pop("_id")
    return jsonify(results)


# === ERROR HANDLERS ===
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": e.description}), 400


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": e.description}), 404


if __name__ == "__main__":
    print("🚀 http://localhost:8000 | http://127.0.0.1:8000")
    print("💾 MongoDB: localhost:27017/phia_interview")
    app.run(debug=True, port=8000, host="0.0.0.0")
