const express = require("express");
const cors    = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ═══════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════

app.post("/api/orders", async (req, res) => {
  const { cart, total } = req.body;
  if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty" });
  const totalCost = cart.reduce((sum, item) => sum + ((item.cost || 0) * item.qty), 0);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      "INSERT INTO orders (total, total_cost) VALUES ($1,$2) RETURNING id",
      [total, totalCost]
    );
    const orderId = r.rows[0].id;
    for (const item of cart) {
      await client.query(
        "INSERT INTO order_items (order_id,name,price,qty,cost) VALUES ($1,$2,$3,$4,$5)",
        [orderId, item.name, item.price, item.qty, item.cost || 0]
      );
    }
    await client.query("COMMIT");
    console.log("Order #" + orderId + " saved | Revenue:" + total + " Cost:" + totalCost);
    res.json({ success: true, orderId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Order failed" });
  } finally {
    client.release();
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("DELETE FROM orders WHERE id=$1 RETURNING id", [id]);
    await client.query("COMMIT");
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    console.log("Order #" + id + " deleted");
    res.json({ success: true, deletedId: id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Delete failed" });
  } finally {
    client.release();
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await pool.query(`
      SELECT o.id, o.total, o.total_cost, o.total - o.total_cost AS profit, o.created_at,
        json_agg(json_build_object('name',oi.name,'qty',oi.qty,'price',oi.price,'cost',oi.cost)) AS items
      FROM orders o JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id ORDER BY o.created_at DESC
    `);
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

// ═══════════════════════════════════════════════════════════
//  PRODUCTS (stored in DB)
// ═══════════════════════════════════════════════════════════

// Create products table if not exists
pool.query(`
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    cost  NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).then(() => console.log("Products table ready")).catch(e => console.error("Products table error:", e.message));

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, price, cost } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price required" });
  try {
    const result = await pool.query(
      "INSERT INTO products (name, price, cost) VALUES ($1,$2,$3) RETURNING *",
      [name, parseFloat(price), parseFloat(cost) || 0]
    );
    console.log("Product added:", name);
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to add product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, price, cost } = req.body;
  if (!name || !price) return res.status(400).json({ error: "Name and price required" });
  try {
    const result = await pool.query(
      "UPDATE products SET name=$1, price=$2, cost=$3, updated_at=NOW() WHERE id=$4 RETURNING *",
      [name, parseFloat(price), parseFloat(cost) || 0, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found" });
    console.log("Product #" + id + " updated");
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Not found" });
    console.log("Product #" + id + " deleted");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════

app.get("/api/dashboard", async (req, res) => {
  try {
    const allTime = await pool.query(
      "SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(total_cost),0) AS cost, COALESCE(SUM(total-total_cost),0) AS profit FROM orders"
    );

    const todayQ = await pool.query(
      "SELECT COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue, COALESCE(SUM(total_cost),0) AS cost, COALESCE(SUM(total-total_cost),0) AS profit FROM orders WHERE (created_at + INTERVAL '5 hours 30 minutes')::date = (NOW() + INTERVAL '5 hours 30 minutes')::date"
    );

    console.log("TODAY:", todayQ.rows[0]);

    const items = await pool.query("SELECT COALESCE(SUM(qty),0) AS total FROM order_items");
    const top   = await pool.query("SELECT name, SUM(qty) AS sold FROM order_items GROUP BY name ORDER BY sold DESC LIMIT 1");

    const perProduct = await pool.query(
      "SELECT name, SUM(qty) AS qty, SUM(price*qty) AS revenue, SUM(cost*qty) AS cost, SUM((price-cost)*qty) AS profit FROM order_items GROUP BY name ORDER BY profit DESC"
    );

    const monthly = await pool.query(
      "SELECT TO_CHAR(created_at + INTERVAL '5 hours 30 minutes','Mon') AS month, SUM(total) AS sales, SUM(total_cost) AS cost, SUM(total-total_cost) AS profit FROM orders WHERE EXTRACT(YEAR FROM created_at + INTERVAL '5 hours 30 minutes') = EXTRACT(YEAR FROM NOW() + INTERVAL '5 hours 30 minutes') GROUP BY TO_CHAR(created_at + INTERVAL '5 hours 30 minutes','Mon'), DATE_TRUNC('month', created_at + INTERVAL '5 hours 30 minutes') ORDER BY DATE_TRUNC('month', created_at + INTERVAL '5 hours 30 minutes')"
    );

    const annual = await pool.query(
      "SELECT TO_CHAR(created_at + INTERVAL '5 hours 30 minutes','YYYY') AS year, SUM(total) AS revenue, SUM(total-total_cost) AS profit FROM orders GROUP BY TO_CHAR(created_at + INTERVAL '5 hours 30 minutes','YYYY') ORDER BY year"
    );

    const recent = await pool.query(
      "SELECT o.id, o.total, o.total_cost, o.total-o.total_cost AS profit, o.created_at, json_agg(json_build_object('name',oi.name,'qty',oi.qty,'price',oi.price,'cost',oi.cost)) AS items FROM orders o JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 10"
    );

    res.json({
      totalRevenue:  parseFloat(allTime.rows[0].revenue) || 0,
      totalCost:     parseFloat(allTime.rows[0].cost)    || 0,
      totalProfit:   parseFloat(allTime.rows[0].profit)  || 0,
      totalOrders:   parseInt(allTime.rows[0].orders)    || 0,
      totalItems:    parseInt(items.rows[0].total)       || 0,
      todayRevenue:  parseFloat(todayQ.rows[0].revenue)  || 0,
      todayCost:     parseFloat(todayQ.rows[0].cost)     || 0,
      todayProfit:   parseFloat(todayQ.rows[0].profit)   || 0,
      todayOrders:   parseInt(todayQ.rows[0].orders)     || 0,
      topProduct:    top.rows[0] || null,
      profitPerProduct: perProduct.rows.map(r => ({
        name: r.name,
        total_qty:     parseInt(r.qty)       || 0,
        total_revenue: parseFloat(r.revenue) || 0,
        total_cost:    parseFloat(r.cost)    || 0,
        total_profit:  parseFloat(r.profit)  || 0,
      })),
      monthlySales: monthly.rows.map(r => ({ month:r.month, sales:parseFloat(r.sales)||0, cost:parseFloat(r.cost)||0, profit:parseFloat(r.profit)||0 })),
      annualSales:  annual.rows.map(r  => ({ year:r.year, revenue:parseFloat(r.revenue)||0, profit:parseFloat(r.profit)||0 })),
      recentOrders: recent.rows,
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
});

const path = require("path"); app.use(express.static(path.join(__dirname, "../build"))); app.use((req, res) => { res.sendFile(path.join(__dirname, "../build", "index.html")); });
app.listen(PORT, () => console.log("Server running on port " + PORT));

