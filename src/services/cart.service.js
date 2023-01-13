const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  return new Promise((resolve, reject) => {
    Cart.findOne({ email: user.email }, (err, success) => {
      if (err) {
        reject(new ApiError(httpStatus.NOT_FOUND, "User does not have a cart"));
      }
      if (!success)
        reject(new ApiError(httpStatus.NOT_FOUND, "User does not have a cart"));
      resolve(success);
    });
  });
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  const getCart = await Cart.findOne({ email: user.email });
  const getProduct = await Product.findById(productId);

  if (!getProduct)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );

  if (!getCart) {
    const createCart = {
      email: user.email,
      cartItems: [{ product: getProduct, quantity: quantity }],
    };
    return new Promise((resolve, reject) => {
      Cart.create(createCart, (err, success) => {
        if (err) reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR));
        resolve(success);
      });
    });
  }

  getCart.cartItems.forEach((element) => {
    if (element.product.id === productId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product already in cart. Use the cart sidebar to update or remove product from cart"
      );
    }
  });

  return new Promise((resolve, reject) => {
    getCart.cartItems = [
      ...getCart.cartItems,
      { product: getProduct, quantity: quantity },
    ];
    getCart.save((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const getCart = await Cart.findOne({ email: user.email });
  const getProduct = await Product.findById(productId);

  if (!getCart || getCart.cartItems.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  if (!getProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  const index = getCart.cartItems.findIndex((element) => {
    return JSON.stringify(element.product) === JSON.stringify(getProduct);
  });

  if (index < 0)
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");

  return new Promise((resolve, reject) => {
    getCart.cartItems[index].quantity = quantity;
    getCart.save((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const getCart = await Cart.findOne({ email: user.email });
  const getProduct = await Product.findById(productId);

  if (!getCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  if (getCart.cartItems.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  const index = getCart.cartItems.findIndex((element) => {
    return JSON.stringify(element.product) === JSON.stringify(getProduct);
  });

  if (index < 0 && getProduct)
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");

  return new Promise((resolve, reject) => {
    getCart.cartItems.splice(index, 1);
    getCart.save((err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {

  const cart = await Cart.findOne({email: user.email});

  if(!cart) {
    throw new ApiError(httpStatus.NOT_FOUND);
  }

  if(cart.cartItems.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }


  if(!user.hasSetNonDefaultAddress()) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }

  if(user.address === config.default_address) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }

  let sum = 0;
  cart.cartItems.forEach((elem) => {
    sum = sum + (elem.product.cost * elem.quantity);
  });

  if(sum > user.walletMoney) {
    throw new ApiError(httpStatus.BAD_REQUEST);
  }
  
  user.walletMoney = user.walletMoney - sum;
  cart.cartItems = [];
  await cart.save();
  await user.save();
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
