require("dotenv").config()
const express = require('express');
const connectDb = require("./db/connect")
const Product = require("./modal/product")
const jwt = require('jsonwebtoken');
const app = express();
const port = 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET; 
// middleware
app.use(express.json())
// Middleware to verify the access token
const verifyAccessToken = (req, res, next) => {
    const token = req.headers.authorization;
console.log("this is protected token",token)
    if (!token) {
        return res.status(401).send('Access token is missing');
    }

    jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send('Invalid access token');
        }
        req.user = decoded;
        next();
    });
};


// Get product
app.get('/product', verifyAccessToken , async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortField = req.query.sortField || 'name'; 
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const searchQuery = req.query.search || '';
  console.log(sortField,sortOrder , searchQuery)
    try {
      
      const searchFilter = searchQuery ? { name: { $regex: new RegExp(searchQuery, 'i') } } : {};
  
      const totalProducts = await Product.countDocuments(searchFilter);
      const totalPages = Math.ceil(totalProducts / pageSize);
  
      const products = await Product.find(searchFilter)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize);
  
      res.json({
        products,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });

// add product
app.post('/productAdd', async (req, res) => {
    const { name, description, price, category, inStock} = req.body;
    try {
        await Product.create({ name, description, price, category, inStock });
        res.status(201).send('Product has been added');
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
    
      
});

// delete product
app.delete('/productDelete/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const productExist = await Product.findOne({ _id: productId });

        if (productExist) {
            await Product.findByIdAndDelete(productId);
            res.send('Product has been deleted');
        } else {
            res.status(404).send('Product for this ID not found');
        }
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});
// edit product
app.put('/productUpdate/:id', async (req, res) => {
    const productId = req.params.id;
    const updatedProduct = req.body;
    try {
        const productExist = await Product.findOne({ _id: productId });

        if (productExist) {
            await Product.findByIdAndUpdate(productId, updatedProduct);
        res.send('Product has been updated');
        } else {
            res.status(404).send('Product for this ID not found');
        }
       
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});


// listen


app.listen(port, () => {
    connectDb(MONGODB_URI)
    console.log(`Server is running on http://localhost:${port}`);
});
