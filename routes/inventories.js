var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let inventoryModel = require('../schemas/inventories');

function parseQuantity(value) {
    let quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return null;
    }
    return quantity;
}

router.get('/', async function (req, res) {
    let data = await inventoryModel
        .find({})
        .populate({
            path: 'product'
        });
    res.send(data);
});

router.get('/:id', async function (req, res) {
    try {
        let result = await inventoryModel
            .findById(req.params.id)
            .populate({
                path: 'product'
            });
        if (!result) {
            return res.status(404).send({
                message: 'ID NOT FOUND'
            });
        }
        res.send(result);
    } catch (error) {
        res.status(404).send({
            message: error.message
        });
    }
});

router.post('/add-stock', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = parseQuantity(req.body.quantity);

        if (!mongoose.Types.ObjectId.isValid(product) || quantity === null) {
            return res.status(400).send({
                message: 'product hoặc quantity không hợp lệ'
            });
        }

        let result = await inventoryModel.findOneAndUpdate(
            { product: product },
            { $inc: { stock: quantity } },
            { new: true }
        ).populate('product');

        if (!result) {
            return res.status(404).send({
                message: 'INVENTORY NOT FOUND'
            });
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/remove-stock', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = parseQuantity(req.body.quantity);

        if (!mongoose.Types.ObjectId.isValid(product) || quantity === null) {
            return res.status(400).send({
                message: 'product hoặc quantity không hợp lệ'
            });
        }

        let result = await inventoryModel.findOneAndUpdate(
            {
                product: product,
                stock: { $gte: quantity }
            },
            { $inc: { stock: -quantity } },
            { new: true }
        ).populate('product');

        if (!result) {
            return res.status(400).send({
                message: 'Không đủ stock hoặc inventory không tồn tại'
            });
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/reservation', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = parseQuantity(req.body.quantity);

        if (!mongoose.Types.ObjectId.isValid(product) || quantity === null) {
            return res.status(400).send({
                message: 'product hoặc quantity không hợp lệ'
            });
        }

        let result = await inventoryModel.findOneAndUpdate(
            {
                product: product,
                stock: { $gte: quantity }
            },
            {
                $inc: {
                    stock: -quantity,
                    reserved: quantity
                }
            },
            { new: true }
        ).populate('product');

        if (!result) {
            return res.status(400).send({
                message: 'Không đủ stock hoặc inventory không tồn tại'
            });
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

router.post('/sold', async function (req, res) {
    try {
        let product = req.body.product;
        let quantity = parseQuantity(req.body.quantity);

        if (!mongoose.Types.ObjectId.isValid(product) || quantity === null) {
            return res.status(400).send({
                message: 'product hoặc quantity không hợp lệ'
            });
        }

        let result = await inventoryModel.findOneAndUpdate(
            {
                product: product,
                reserved: { $gte: quantity }
            },
            {
                $inc: {
                    reserved: -quantity,
                    soldCount: quantity
                }
            },
            { new: true }
        ).populate('product');

        if (!result) {
            return res.status(400).send({
                message: 'Không đủ reserved hoặc inventory không tồn tại'
            });
        }

        res.send(result);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
});

module.exports = router;
