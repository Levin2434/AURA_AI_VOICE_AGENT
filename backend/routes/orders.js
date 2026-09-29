const express = require("express");

const router = express.Router();

const { getOrderDetails } = require("../data/orders");

router.get("/:orderId", (req, res) => {
  const orderId = req.params.orderId;

  const order = getOrderDetails(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: `Order ${orderId} was not found.`,
    });
  }

  res.json({
    success: true,
    order,
  });
});

module.exports = router;