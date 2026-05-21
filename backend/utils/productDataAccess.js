const mongoose = require("mongoose");
const localProductModel = require("../models/Product");

let externalProductConnectionPromise = null;
let externalProductModel = null;

const getProductsMongoUri = () =>
  process.env.MWELNESS_PRODUCTS_MONGO_URI ||
  process.env.MWELLNESS_PRODUCTS_MONGO_URI ||
  process.env.MONGO_URI ||
  process.env.URI ||
  "";

const getExternalProductConnection = async () => {
  const mongoUri = getProductsMongoUri();

  if (!mongoUri) {
    return null;
  }

  if (!externalProductConnectionPromise) {
    const connection = mongoose.createConnection(mongoUri);
    externalProductConnectionPromise = connection.asPromise().then(() => connection);
  }

  return externalProductConnectionPromise;
};

const getProductReadModel = async () => {
  const productsMongoUri = getProductsMongoUri();
  const authMongoUri =
    process.env.METAFIT_WELLNESS_MONGO_URI ||
    process.env.MONGO_URI ||
    process.env.URI ||
    "";

  if (!productsMongoUri || productsMongoUri === authMongoUri) {
    return localProductModel;
  }

  if (externalProductModel) {
    return externalProductModel;
  }

  const connection = await getExternalProductConnection();

  if (!connection) {
    return localProductModel;
  }

  externalProductModel =
    connection.models.Product ||
    connection.model("Product", localProductModel.schema, "products");

  return externalProductModel;
};

const fetchProductsByIds = async (productIds = []) => {
  const uniqueIds = [...new Set(productIds.filter(Boolean).map(String))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const ProductReadModel = await getProductReadModel();
  const products = await ProductReadModel.find({
    _id: { $in: uniqueIds },
  }).lean();

  return new Map(products.map((product) => [String(product._id), product]));
};

module.exports = {
  fetchProductsByIds,
  getProductReadModel,
};
