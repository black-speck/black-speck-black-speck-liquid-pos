import { useState, useEffect, useRef } from "react";
import "./App.css";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";

const API = "https://fulfilling-growth-production-60f9.up.railway.app/api";

const SAMPLE_MONTHLY = [
  { month:"Jan",sales:32000 },{ month:"Feb",sales:47000 },{ month:"Mar",sales:38000 },
  { month:"Apr",sales:53000 },{ month:"May",sales:61000 },{ month:"Jun",sales:49000 },
  { month:"Jul",sales:72000 },{ month:"Aug",sales:58000 },{ month:"Sep",sales:66000 },
  { month:"Oct",sales:74000 },{ month:"Nov",sales:91000 },{ month:"Dec",sales:88000 },
];
const SAMPLE_ANNUAL = [
  { year:"2020",revenue:420000 },{ year:"2021",revenue:580000 },{ year:"2022",revenue:740000 },
  { year:"2023",revenue:890000 },{ year:"2024",revenue:1120000 },{ year:"2025",revenue:1340000 },
];
const ALL_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const safe = (val) => (isNaN(parseFloat(val)) ? 0 : parseFloat(val));
const fmt  = (val) => safe(val).toLocaleString();

function buildMonthlyData(realData) {
  const realMap = {};
  (realData || []).forEach(r => { realMap[r.month] = safe(r.sales); });
  return ALL_MONTHS.map((month, i) => ({
    month,
    "Real Sales":    realMap[month] || 0,
    "Sample/Target": SAMPLE_MONTHLY[i].sales,
  }));
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tt-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="tt-value" style={{ color: p.color }}>
            {p.name}: {safe(p.value).toLocaleString()} LKR
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const S = {
  pageWrap: { flex:1, padding:"24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"20px" },
  card:     { background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"14px", padding:"20px" },
  title:    { fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:"16px" },
  input:    { background:"var(--bg3)", border:"1px solid var(--border)", borderRadius:"8px", padding:"9px 12px", color:"var(--text)", fontFamily:"'DM Sans',sans-serif", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" },
  btnBlue:  { background:"linear-gradient(135deg,#38bdf8,#0ea5e9)", color:"#fff", border:"none", borderRadius:"8px", padding:"10px 20px", fontFamily:"'Syne',sans-serif", fontSize:"13px", fontWeight:700, cursor:"pointer" },
  btnGreen: { background:"linear-gradient(135deg,#34d399,#059669)", color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontFamily:"'Syne',sans-serif", fontSize:"12px", fontWeight:700, cursor:"pointer" },
  btnRed:   { background:"rgba(244,63,94,0.12)", border:"1px solid rgba(244,63,94,0.3)", color:"#f43f5e", borderRadius:"6px", padding:"6px 12px", fontSize:"11px", fontWeight:700, cursor:"pointer" },
  btnAmber: { background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", color:"#f59e0b", borderRadius:"6px", padding:"6px 12px", fontSize:"11px", fontWeight:700, cursor:"pointer" },
  table:    { width:"100%", borderCollapse:"collapse" },
  th:       { padding:"8px 14px", textAlign:"left", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--text-muted)", fontWeight:600, borderBottom:"1px solid var(--border)" },
  td:       { padding:"12px 14px", fontSize:"13px", borderBottom:"1px solid rgba(26,47,82,0.4)" },
};

const inp = {
  display:"block", width:"100%", boxSizing:"border-box",
  background:"var(--bg3,#0f1f3a)", border:"1px solid var(--border)",
  borderRadius:"8px", padding:"8px 12px", color:"var(--text)",
  fontFamily:"'DM Sans',sans-serif", fontSize:"13px", outline:"none",
};

// Text-only stat card — no emoji icons
function StatCard({ label, value, sub, accentColor }) {
  return (
    <div style={{ background:"var(--bg2)", border:"1px solid var(--border)", borderRadius:"14px", padding:"18px 20px", display:"flex", flexDirection:"column", gap:"6px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"3px", background: accentColor || "linear-gradient(90deg,#38bdf8,#0ea5e9)", borderRadius:"14px 14px 0 0" }} />
      <div style={{ fontSize:"10px", fontFamily:"'Syne',sans-serif", fontWeight:800, textTransform:"uppercase", letterSpacing:"1.2px", color:"var(--text-muted)", marginTop:"2px" }}>{label}</div>
      <div style={{ fontSize:"20px", fontFamily:"'Syne',sans-serif", fontWeight:800, color: "var(--text)", lineHeight:1.1, wordBreak:"break-all" }}>{value}</div>
      {sub && <div style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{sub}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"11px", fontWeight:800, textTransform:"uppercase", letterSpacing:"1.4px", color:"var(--text-muted)", borderBottom:"1px solid var(--border)", paddingBottom:"8px", marginBottom:"0px" }}>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  LOGIN PAGE
// ════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const USERS = [
    { username: "kliyonakb.117@gmail.com", password: "admin123",  role: "Admin",   location: "Main Branch" },
    { username: "cashier",                 password: "cash123",   role: "Cashier", location: "Outlet"      },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    setTimeout(() => {
      const match = USERS.find(u => u.username === username && u.password === password);
      if (match) { onLogin(match); }
      else { setError("Invalid username or password."); setLoading(false); }
    }, 600);
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg,#0a1628)", backgroundImage:"radial-gradient(ellipse at 20% 50%, rgba(56,189,248,0.06) 0%, transparent 60%)", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"0 20px" }}>
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ width:"64px", height:"64px", borderRadius:"18px", margin:"0 auto 16px", background:"linear-gradient(135deg,#38bdf8,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", boxShadow:"0 8px 32px rgba(56,189,248,0.3)" }}>📦</div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:800, color:"var(--text,#e2e8f0)", margin:"0 0 4px" }}>Kliyona KB Distributors</h1>
          <p style={{ fontSize:"13px", color:"var(--text-muted,#64748b)", margin:0 }}>Sign in to continue</p>
        </div>
        <div style={{ background:"var(--bg2,#0f1f3a)", border:"1px solid var(--border,#1a2f52)", borderRadius:"20px", padding:"32px", boxShadow:"0 24px 64px rgba(0,0,0,0.4)" }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom:"16px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--text-muted,#64748b)", marginBottom:"6px" }}>Username</div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"15px", opacity:0.5 }}>👤</span>
                <input type="text" placeholder="Enter username" value={username} required onChange={e=>{setUsername(e.target.value);setError("");}} style={{ ...inp, padding:"11px 12px 11px 38px", border:`1px solid ${error?"rgba(244,63,94,0.5)":"var(--border,#1a2f52)"}` }} />
              </div>
            </div>
            <div style={{ marginBottom:"24px" }}>
              <div style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", color:"var(--text-muted,#64748b)", marginBottom:"6px" }}>Password</div>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"15px", opacity:0.5 }}>🔒</span>
                <input type={showPass?"text":"password"} placeholder="Enter password" value={password} required onChange={e=>{setPassword(e.target.value);setError("");}} style={{ ...inp, padding:"11px 40px 11px 38px", border:`1px solid ${error?"rgba(244,63,94,0.5)":"var(--border,#1a2f52)"}` }} />
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", cursor:"pointer", fontSize:"14px", opacity:0.5, padding:"4px" }}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>
            {error && <div style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.3)", borderRadius:"8px", padding:"10px 14px", marginBottom:"16px", fontSize:"13px", color:"#f43f5e", fontWeight:600, textAlign:"center" }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{ width:"100%", padding:"13px", border:"none", borderRadius:"10px", background:loading?"rgba(56,189,248,0.4)":"linear-gradient(135deg,#38bdf8,#0ea5e9)", color:"#fff", fontFamily:"'Syne',sans-serif", fontSize:"14px", fontWeight:700, cursor:loading?"not-allowed":"pointer", boxShadow:"0 4px 20px rgba(56,189,248,0.25)" }}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>
        </div>
        <p style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:"var(--text-muted,#64748b)" }}>Kliyona KB Distributors © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage,  setActivePage]  = useState("pos");

  const [products,    setProducts]   = useState([]);
  const [cart,        setCart]       = useState([]);
  const [savedCart,   setSavedCart]  = useState([]);
  const [checkoutMsg, setCheckoutMsg]= useState("");
  const [cardQtys,    setCardQtys]   = useState({});
  const [shopName,    setShopName]   = useState("");
  const [bulkItems,   setBulkItems]  = useState([]);
  const [bulkQtys,    setBulkQtys]   = useState({});
  const [bulkPrices,  setBulkPrices] = useState({});
  const [discountPct, setDiscountPct]= useState("");
  const [rowName,     setRowName]    = useState("");
  const [rowPrice,    setRowPrice]   = useState("");
  const [rowCost,     setRowCost]    = useState("");
  const [rowQty,      setRowQty]     = useState("1");
  const [dashData,    setDashData]   = useState(null);
  const [dashLoading, setDashLoading]= useState(false);
  const [dashError,   setDashError]  = useState(null);
  const [lastUpdated, setLastUpdated]= useState("");
  const activePageRef = useRef(activePage);
  useEffect(() => { activePageRef.current = activePage; }, [activePage]);
  const [orders,        setOrders]       = useState([]);
  const [ordersLoading, setOrdersLoading]= useState(false);
  const [deletingId,    setDeletingId]   = useState(null);
  const [orderSearch,   setOrderSearch]  = useState("");
  const [orderFilter,   setOrderFilter]  = useState("all");
  const [ordersTab,     setOrdersTab]    = useState("list");
  const [selectedMonth, setSelectedMonth]= useState(new Date().getMonth());
  const [selectedYear,  setSelectedYear] = useState(new Date().getFullYear());
  const [prodLoading, setProdLoading]= useState(false);
  const [editingProd, setEditingProd]= useState(null);
  const [newProd,     setNewProd]    = useState({ name:"", price:"", cost:"" });
  const [prodMsg,     setProdMsg]    = useState("");

  const fetchProducts = async () => {
    setProdLoading(true);
    try { const res=await fetch(`${API}/products`); const data=await res.json(); setProducts(Array.isArray(data)?data:[]); }
    catch(err){console.error(err);} finally{setProdLoading(false);}
  };
  const fetchDashboard = async (silent=false) => {
    if(!silent) setDashLoading(true); setDashError(null);
    try { const res=await fetch(`${API}/dashboard`); const data=await res.json(); setDashData(data); setLastUpdated(new Date().toLocaleTimeString("en-LK")); }
    catch(err){setDashError("Cannot connect to server.");} finally{setDashLoading(false);}
  };
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try { const res=await fetch(`${API}/orders`); const data=await res.json(); setOrders(Array.isArray(data)?data:[]); }
    catch(err){console.error(err);} finally{setOrdersLoading(false);}
  };
  useEffect(()=>{fetchProducts();},[]);
  useEffect(()=>{ if(activePage==="dashboard") fetchDashboard(); if(activePage==="orders") fetchOrders(); },[activePage]);
  useEffect(()=>{ const t=setInterval(()=>{ if(activePageRef.current==="dashboard") fetchDashboard(true); },30000); return()=>clearInterval(t); },[]);

  // Monthly report calcs
  const monthlyOrders = orders.filter(o => { const d=new Date(o.created_at); return d.getMonth()===selectedMonth && d.getFullYear()===selectedYear; });
  const monthRevenue = monthlyOrders.reduce((s,o)=>s+safe(o.total),0);
  const monthCost    = monthlyOrders.reduce((s,o)=>s+safe(o.total_cost),0);
  const monthProfit  = monthlyOrders.reduce((s,o)=>s+safe(o.profit),0);
  const monthOrders  = monthlyOrders.length;
  const monthProductMap = {};
  monthlyOrders.forEach(order => {
    (order.items||[]).forEach(item => {
      const key = item.name.replace(/\s*\(.*?\)\s*/g,"").trim();
      if(!monthProductMap[key]) monthProductMap[key]={name:key,qty:0,revenue:0,cost:0,profit:0};
      const rev=safe(item.price)*safe(item.qty), cst=safe(item.cost)*safe(item.qty);
      monthProductMap[key].qty+=safe(item.qty); monthProductMap[key].revenue+=rev; monthProductMap[key].cost+=cst; monthProductMap[key].profit+=rev-cst;
    });
  });
  const monthProducts = Object.values(monthProductMap).sort((a,b)=>b.revenue-a.revenue);
  const daysInMonth = new Date(selectedYear,selectedMonth+1,0).getDate();
  const dailyData = Array.from({length:daysInMonth},(_,i)=>{
    const day=i+1, dayOrds=monthlyOrders.filter(o=>new Date(o.created_at).getDate()===day);
    return { day:`${day}`, Revenue:dayOrds.reduce((s,o)=>s+safe(o.total),0), Profit:dayOrds.reduce((s,o)=>s+safe(o.profit),0) };
  });
  const availableYears=[...new Set(orders.map(o=>new Date(o.created_at).getFullYear()))].sort((a,b)=>b-a);
  if(!availableYears.includes(selectedYear)) availableYears.unshift(selectedYear);

  const handleAddProduct = async (e) => {
    e.preventDefault(); if(!newProd.name||!newProd.price) return;
    try {
      const res=await fetch(`${API}/products`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newProd)});
      const data=await res.json();
      if(data.success){setProducts(prev=>[...prev,data.product]);setNewProd({name:"",price:"",cost:""});setProdMsg("Product added!");setTimeout(()=>setProdMsg(""),2000);}
      else setProdMsg("Failed: "+(data.error||""));
    } catch(err){setProdMsg("Server error");}
  };
  const handleUpdateProduct = async (e) => {
    e.preventDefault(); if(!editingProd) return;
    try {
      const res=await fetch(`${API}/products/${editingProd.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(editingProd)});
      const data=await res.json();
      if(data.success){setProducts(products.map(p=>p.id===editingProd.id?data.product:p));setEditingProd(null);setProdMsg("Updated!");setTimeout(()=>setProdMsg(""),2000);}
    } catch(err){setProdMsg("Failed");}
  };
  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Delete this product?")) return;
    try {
      const res=await fetch(`${API}/products/${id}`,{method:"DELETE"}); const data=await res.json();
      if(data.success){setProducts(products.filter(p=>p.id!==id));setProdMsg("Deleted");setTimeout(()=>setProdMsg(""),2000);}
    } catch(err){setProdMsg("Failed");}
  };

  const addBulkRow = () => {
    if (!rowName.trim()||!rowPrice||parseFloat(rowPrice)<0) return;
    const qty=Math.max(1,parseInt(rowQty)||1), price=parseFloat(rowPrice)||0;
    const matched=products.find(p=>p.name.toLowerCase()===rowName.trim().toLowerCase());
    const cost=rowCost!==""?parseFloat(rowCost)||0:matched?parseFloat(matched.cost)||0:0;
    setBulkItems(prev=>[...prev,{id:Date.now(),name:rowName.trim(),price,cost,qty}]);
    setRowName(""); setRowPrice(""); setRowCost(""); setRowQty("1");
  };
  const removeBulkRow = (id) => setBulkItems(prev=>prev.filter(i=>i.id!==id));

  const handleBulkSell = async () => {
    const disc=parseFloat(discountPct)||0;
    const tableItems=products.filter(p=>(bulkQtys[p.id]||0)>0).map(p=>({
      id:p.id, name:shopName.trim()?`${p.name} (${shopName.trim()})`:p.name,
      price:((bulkPrices[p.id]!==undefined?bulkPrices[p.id]:parseFloat(p.price))*(1-disc/100)),
      cost:parseFloat(p.cost)||0, qty:bulkQtys[p.id],
    }));
    const customItems=bulkItems.map(item=>({...item,name:shopName.trim()?`${item.name} (${shopName.trim()})`:item.name,price:item.price*(1-disc/100)}));
    const finalCart=[...tableItems,...customItems];
    if(finalCart.length===0) return;
    const total=finalCart.reduce((s,i)=>s+i.price*i.qty,0);
    try {
      const res=await fetch(`${API}/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart:finalCart,total})});
      const data=await res.json();
      if(data.success){setBulkItems([]);setBulkQtys({});setBulkPrices({});setShopName("");setDiscountPct("");setCheckoutMsg(`Order sold! ${finalCart.length} item${finalCart.length>1?"s":""} · ${total.toLocaleString()} LKR${disc>0?` (${disc}% off)`:""}`);setTimeout(()=>setCheckoutMsg(""),3500);fetchDashboard(true);}
    } catch(err){setCheckoutMsg("Failed — is server running?");setTimeout(()=>setCheckoutMsg(""),3000);}
  };

  const getCardQty=(id)=>cardQtys[id]??1;
  const setCardQty=(id,v)=>setCardQtys(prev=>({...prev,[id]:Math.max(1,parseInt(v)||1)}));
  const addToCartWithQty=(product)=>{
    const qty=getCardQty(product.id);
    setCart(prev=>{const ex=prev.find(i=>i.id===product.id);if(ex)return prev.map(i=>i.id===product.id?{...i,qty:i.qty+qty}:i);return[...prev,{...product,qty}];});
    setCardQtys(prev=>({...prev,[product.id]:1}));
  };

  const removeFromCart=(id)=>setCart(cart.filter(item=>item.id!==id));
  const total=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const totalCostCart=cart.reduce((s,i)=>s+(i.cost||0)*i.qty,0);
  const totalProfit=total-totalCostCart;

  const handleSell=async()=>{
    if(cart.length===0) return;
    try{const res=await fetch(`${API}/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart,total})});const data=await res.json();if(data.success){setCart([]);setCheckoutMsg("Sold! Order saved.");setTimeout(()=>setCheckoutMsg(""),2500);fetchDashboard(true);}}
    catch(err){setCheckoutMsg("Failed — is server running?");setTimeout(()=>setCheckoutMsg(""),3000);}
  };
  const handleAddToCart=()=>{
    if(cart.length===0) return;
    const merged=[...savedCart];
    cart.forEach(item=>{const ex=merged.find(s=>s.id===item.id);if(ex){ex.qty+=item.qty;}else{merged.push({...item});}});
    setSavedCart(merged);setCart([]);setCheckoutMsg("Items held!");setTimeout(()=>setCheckoutMsg(""),2500);
  };
  const handleCheckoutSaved=async()=>{
    if(savedCart.length===0) return;
    const savedTotal=savedCart.reduce((s,i)=>s+i.price*i.qty,0);
    try{const res=await fetch(`${API}/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart:savedCart,total:savedTotal})});const data=await res.json();if(data.success){setSavedCart([]);setCheckoutMsg("Held cart sold!");setTimeout(()=>setCheckoutMsg(""),2500);fetchDashboard(true);}}
    catch(err){setCheckoutMsg("Failed");}
  };
  const removeSavedItem=(id)=>setSavedCart(savedCart.filter(item=>item.id!==id));
  const savedTotal=savedCart.reduce((s,i)=>s+i.price*i.qty,0);

  const handleDeleteOrder=async(orderId)=>{
    if(!window.confirm(`Delete Order #${String(orderId).padStart(3,"0")}?`)) return;
    setDeletingId(orderId);
    try{const res=await fetch(`${API}/orders/${orderId}`,{method:"DELETE"});const data=await res.json();if(data.success){setOrders(orders.filter(o=>o.id!==orderId));fetchDashboard(true);}}
    catch(err){alert("Delete failed");}finally{setDeletingId(null);}
  };
  const todayStr=new Date().toLocaleDateString("en-LK");
  const filteredOrders=orders.filter(o=>{
    const ms=orderSearch===""||String(o.id).includes(orderSearch)||(o.items||[]).some(i=>i.name.toLowerCase().includes(orderSearch.toLowerCase()));
    const mf=orderFilter==="all"||(orderFilter==="today"&&new Date(o.created_at).toLocaleDateString("en-LK")===todayStr);
    return ms&&mf;
  });

  const monthlyChartData=buildMonthlyData(dashData?.monthlySales||[]);
  const annualChartData=!dashData?.annualSales?.length?SAMPLE_ANNUAL:dashData.annualSales;
  const d={
    todayRevenue:fmt(dashData?.todayRevenue),todayCost:fmt(dashData?.todayCost),
    todayProfit:fmt(dashData?.todayProfit),todayOrders:dashData?.todayOrders??0,
    totalRevenue:fmt(dashData?.totalRevenue),totalCost:fmt(dashData?.totalCost),
    totalProfit:fmt(dashData?.totalProfit),totalOrders:dashData?.totalOrders??0,
    totalItems:dashData?.totalItems??0,topProduct:dashData?.topProduct||null,
    profitPerProduct:dashData?.profitPerProduct||[],recentOrders:dashData?.recentOrders||[],
  };

  const disc=parseFloat(discountPct)||0;
  const tableProducts=products.filter(p=>(bulkQtys[p.id]||0)>0);
  const subtotalTable=tableProducts.reduce((s,p)=>{const price=bulkPrices[p.id]!==undefined?bulkPrices[p.id]:parseFloat(p.price);return s+price*(bulkQtys[p.id]||0);},0);
  const costTable=tableProducts.reduce((s,p)=>s+parseFloat(p.cost||0)*(bulkQtys[p.id]||0),0);
  const subtotalCustom=bulkItems.reduce((s,i)=>s+i.price*i.qty,0);
  const costCustom=bulkItems.reduce((s,i)=>s+i.cost*i.qty,0);
  const orderSubtotal=subtotalTable+subtotalCustom;
  const orderDiscountAmt=orderSubtotal*disc/100;
  const orderFinalTotal=orderSubtotal-orderDiscountAmt;
  const orderTotalCost=costTable+costCustom;
  const orderTotalProfit=orderFinalTotal-orderTotalCost;
  const hasOrderItems=Object.values(bulkQtys).some(q=>q>0)||bulkItems.length>0;

  if(!currentUser) return <LoginPage onLogin={setCurrentUser} />;
  const handleLogout=()=>{if(window.confirm("Log out?")) setCurrentUser(null);};

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Kliyona KB</h2>
        <ul>
          <li className={activePage==="pos"?"active":""} onClick={()=>setActivePage("pos")}>🛒 Point of Sale</li>
          <li className={activePage==="dashboard"?"active":""} onClick={()=>setActivePage("dashboard")}>📊 Dashboard</li>
          <li className={activePage==="products"?"active":""} onClick={()=>setActivePage("products")}>📦 Products</li>
          <li className={activePage==="orders"?"active":""} onClick={()=>setActivePage("orders")}>📋 Orders</li>
          <li>⚙️ Settings</li>
        </ul>
      </div>

      <div className="main">
        <div className="navbar">
          <h3>{activePage==="pos"&&"Point of Sale"}{activePage==="dashboard"&&"Dashboard"}{activePage==="products"&&"Products"}{activePage==="orders"&&"Orders"}</h3>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"13px",fontWeight:700,color:"var(--text)"}}>{currentUser.username}</div>
              <div style={{fontSize:"11px",color:"var(--text-muted)"}}>{currentUser.role} · {currentUser.location}</div>
            </div>
            <div style={{width:"34px",height:"34px",borderRadius:"50%",background:"linear-gradient(135deg,#38bdf8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px",fontWeight:700,color:"#fff",flexShrink:0}}>
              {currentUser.username[0].toUpperCase()}
            </div>
            <button className="logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* POS PAGE */}
        {activePage==="pos" && (
          <div className="content" style={{display:"flex",gap:"20px",alignItems:"flex-start",padding:"20px",overflow:"hidden"}}>
            <div className="manual-entry" style={{overflowY:"auto",maxHeight:"calc(100vh - 80px)",flex:"2 1 0",minWidth:0,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"14px",padding:"18px"}}>
              <h3 style={{marginBottom:"14px"}}>🛒 New Order</h3>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:"11px",color:"var(--text-muted)",marginBottom:3}}>Shop / Customer Name <span style={{opacity:0.5}}>(optional)</span></div>
                <input type="text" placeholder="e.g. Saman Shop, Galle" value={shopName} onChange={e=>setShopName(e.target.value)} style={inp} />
              </div>
              <div style={{marginBottom:12,background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.22)",borderRadius:"10px",padding:"10px 14px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <span style={{fontSize:"13px",fontWeight:700,color:"#f59e0b",whiteSpace:"nowrap"}}>🏷️ Discount</span>
                <div style={{position:"relative",width:110}}>
                  <input type="number" min="0" max="100" placeholder="0" value={discountPct}
                    onChange={e=>{const raw=e.target.value;if(raw===""){setDiscountPct("");return;}setDiscountPct(Math.min(100,Math.max(0,parseFloat(raw)||0)));}}
                    style={{...inp,paddingRight:"28px",fontWeight:700,fontSize:"14px",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.4)",background:"rgba(245,158,11,0.08)"}} />
                  <span style={{position:"absolute",right:"9px",top:"50%",transform:"translateY(-50%)",fontSize:"13px",color:"#f59e0b",fontWeight:700,pointerEvents:"none"}}>%</span>
                </div>
                {disc>0&&hasOrderItems&&<span style={{fontSize:"12px",color:"var(--text-muted)"}}>— saving <strong style={{color:"#f43f5e"}}>{orderDiscountAmt.toLocaleString()}</strong> LKR</span>}
                {disc>0&&<button onClick={()=>setDiscountPct("")} style={{marginLeft:"auto",background:"transparent",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:"12px",padding:"2px 8px",borderRadius:"4px"}}>✕ Clear</button>}
              </div>
              <div style={{border:"1px solid var(--border)",borderRadius:"10px",overflow:"hidden",marginBottom:10}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"rgba(56,189,248,0.06)"}}>
                      <th style={{padding:"8px 10px",textAlign:"left",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.6px",color:"var(--text-muted)",fontWeight:600,borderBottom:"1px solid var(--border)"}}>Product</th>
                      <th style={{padding:"8px 10px",textAlign:"center",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.6px",color:"var(--text-muted)",fontWeight:600,borderBottom:"1px solid var(--border)",width:"90px"}}>Unit Price</th>
                      <th style={{padding:"8px 10px",textAlign:"center",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.6px",color:"var(--text-muted)",fontWeight:600,borderBottom:"1px solid var(--border)",width:"100px"}}>Qty</th>
                      <th style={{padding:"8px 10px",textAlign:"right",fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.6px",color:"var(--text-muted)",fontWeight:600,borderBottom:"1px solid var(--border)",width:"110px"}}>Total {disc>0&&<span style={{color:"#f59e0b",fontSize:"10px"}}>(after disc.)</span>}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product=>{
                      const qty=bulkQtys[product.id]||0;
                      const unitPrice=bulkPrices[product.id]!==undefined?bulkPrices[product.id]:parseFloat(product.price);
                      const subtotalLine=unitPrice*qty, discountedLine=subtotalLine*(1-disc/100);
                      const isSelected=qty>0;
                      return (
                        <tr key={product.id} style={{borderBottom:"1px solid rgba(26,47,82,0.4)",background:isSelected?"rgba(56,189,248,0.05)":"transparent",transition:"background 0.15s"}}>
                          <td style={{padding:"9px 10px",fontSize:"13px",fontWeight:isSelected?700:400,color:isSelected?"var(--text)":"var(--text-muted)",cursor:"pointer"}} onClick={()=>setBulkQtys(prev=>({...prev,[product.id]:(prev[product.id]||0)+1}))}>
                            {isSelected&&<span style={{color:"#38bdf8",marginRight:5}}>●</span>}{product.name}
                            <div style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:400}}>{parseFloat(product.price).toLocaleString()} LKR</div>
                          </td>
                          <td style={{padding:"9px 10px",textAlign:"center"}}>
                            <input type="number" value={bulkPrices[product.id]!==undefined?bulkPrices[product.id]:parseFloat(product.price)} min="0" onChange={e=>setBulkPrices(prev=>({...prev,[product.id]:parseFloat(e.target.value)||0}))} style={{width:"72px",textAlign:"center",background:"var(--bg3,#0f1f3a)",border:"1px solid var(--border)",borderRadius:"6px",padding:"5px 6px",color:"var(--text)",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",outline:"none"}} />
                            {disc>0&&<div style={{fontSize:"10px",color:"#f59e0b",marginTop:2,textAlign:"center",fontWeight:700}}>→ {(unitPrice*(1-disc/100)).toLocaleString()} LKR</div>}
                          </td>
                          <td style={{padding:"6px 8px",textAlign:"center"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2}}>
                              <button onClick={()=>setBulkQtys(prev=>({...prev,[product.id]:Math.max(0,(prev[product.id]||0)-1)}))} style={{background:"rgba(255,255,255,0.06)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:"5px",width:"24px",height:"24px",cursor:"pointer",fontSize:"14px",fontWeight:700,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                              <input type="number" min="0" value={qty===0?"":qty} placeholder="0" onChange={e=>{const v=parseInt(e.target.value);setBulkQtys(prev=>({...prev,[product.id]:isNaN(v)?0:Math.max(0,v)}));}} style={{width:"42px",textAlign:"center",background:isSelected?"rgba(56,189,248,0.1)":"transparent",border:isSelected?"1px solid rgba(56,189,248,0.3)":"1px solid var(--border)",borderRadius:"5px",color:isSelected?"#38bdf8":"var(--text-muted)",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,outline:"none",padding:"3px 2px",transition:"all 0.15s"}} />
                              <button onClick={()=>setBulkQtys(prev=>({...prev,[product.id]:(prev[product.id]||0)+1}))} style={{background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.3)",color:"#38bdf8",borderRadius:"5px",width:"24px",height:"24px",cursor:"pointer",fontSize:"14px",fontWeight:700,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                            </div>
                          </td>
                          <td style={{padding:"9px 10px",textAlign:"right",fontSize:"12px",fontWeight:700}}>
                            {isSelected?(<div>{disc>0&&<div style={{fontSize:"11px",color:"var(--text-muted)",fontWeight:400,textDecoration:"line-through"}}>{subtotalLine.toLocaleString()}</div>}<div style={{color:disc>0?"#34d399":"#38bdf8"}}>{discountedLine.toLocaleString()} LKR</div></div>):<span style={{color:"var(--text-muted)"}}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                    {products.length===0&&<tr><td colSpan={4} style={{padding:"20px",textAlign:"center",color:"var(--text-muted)",fontSize:"12px"}}>No products — add them in Products page</td></tr>}
                  </tbody>
                </table>
              </div>
              <div style={{background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:"10px",padding:"10px",marginBottom:10}}>
                <div style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",color:"#f59e0b",marginBottom:8}}>Add Custom Item</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 60px auto",gap:6,alignItems:"end"}}>
                  <div><div style={{fontSize:"10px",color:"var(--text-muted)",marginBottom:2}}>Name</div><input type="text" placeholder="Product name" value={rowName} onChange={e=>setRowName(e.target.value)} style={inp} /></div>
                  <div><div style={{fontSize:"10px",color:"var(--text-muted)",marginBottom:2}}>Price</div><input type="number" placeholder="0" value={rowPrice} min="0" onChange={e=>setRowPrice(e.target.value)} style={inp} /></div>
                  <div><div style={{fontSize:"10px",color:"var(--text-muted)",marginBottom:2}}>Cost</div><input type="number" placeholder="0" value={rowCost} min="0" onChange={e=>setRowCost(e.target.value)} style={inp} /></div>
                  <div><div style={{fontSize:"10px",color:"var(--text-muted)",marginBottom:2}}>Qty</div><input type="number" placeholder="1" value={rowQty} min="1" onChange={e=>setRowQty(e.target.value)} style={inp} /></div>
                  <button onClick={addBulkRow} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:"8px",padding:"8px 12px",fontFamily:"'Syne',sans-serif",fontSize:"12px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Add</button>
                </div>
              </div>
              {bulkItems.length>0&&(
                <div style={{marginBottom:10}}>
                  {bulkItems.map(item=>{const lineSub=item.price*item.qty,lineDisc=lineSub*(1-disc/100);return(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(245,158,11,0.05)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"7px",marginBottom:4,fontSize:"12px"}}>
                      <span style={{fontWeight:600}}>{item.name} <span style={{color:"var(--text-muted)",fontWeight:400}}>x{item.qty} @ {item.price.toLocaleString()}</span></span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        {disc>0&&<span style={{color:"var(--text-muted)",textDecoration:"line-through",fontSize:"11px"}}>{lineSub.toLocaleString()}</span>}
                        <span style={{color:disc>0?"#34d399":"#38bdf8",fontWeight:700}}>{lineDisc.toLocaleString()} LKR</span>
                        <button onClick={()=>removeBulkRow(item.id)} style={{background:"rgba(244,63,94,0.12)",border:"none",color:"#f43f5e",borderRadius:"4px",padding:"2px 7px",cursor:"pointer",fontSize:"11px"}}>✕</button>
                      </div>
                    </div>
                  );})}
                </div>
              )}
              {hasOrderItems&&(
                <div style={{background:"rgba(52,211,153,0.05)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"10px",padding:"12px"}}>
                  {tableProducts.map(p=>{const price=bulkPrices[p.id]!==undefined?bulkPrices[p.id]:parseFloat(p.price),qty=bulkQtys[p.id]||0,lineSub=price*qty,lineDisc=lineSub*(1-disc/100);return(
                    <div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"3px 0",borderBottom:"1px solid rgba(52,211,153,0.08)"}}>
                      <span style={{color:"var(--text-muted)"}}>{p.name} x{qty}</span>
                      <span>{disc>0&&<span style={{color:"var(--text-muted)",textDecoration:"line-through",marginRight:6,fontSize:"11px"}}>{lineSub.toLocaleString()}</span>}<span style={{color:"#38bdf8",fontWeight:600}}>{lineDisc.toLocaleString()} LKR</span></span>
                    </div>
                  );})}
                  {bulkItems.map(item=>{const lineSub=item.price*item.qty,lineDisc=lineSub*(1-disc/100);return(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",fontSize:"12px",padding:"3px 0",borderBottom:"1px solid rgba(52,211,153,0.08)"}}>
                      <span style={{color:"var(--text-muted)"}}>{item.name} x{item.qty}</span>
                      <span>{disc>0&&<span style={{color:"var(--text-muted)",textDecoration:"line-through",marginRight:6,fontSize:"11px"}}>{lineSub.toLocaleString()}</span>}<span style={{color:"#f59e0b",fontWeight:600}}>{lineDisc.toLocaleString()} LKR</span></span>
                    </div>
                  );})}
                  <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(52,211,153,0.2)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:4}}><span style={{color:"var(--text-muted)"}}>Subtotal</span><span style={{color:"var(--text)",fontWeight:600}}>{orderSubtotal.toLocaleString()} LKR</span></div>
                    {disc>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:4,padding:"5px 8px",background:"rgba(245,158,11,0.08)",borderRadius:"6px",border:"1px solid rgba(245,158,11,0.2)"}}><span style={{color:"#f59e0b",fontWeight:700}}>Discount ({disc}%)</span><span style={{color:"#f43f5e",fontWeight:700}}>− {orderDiscountAmt.toLocaleString()} LKR</span></div>}
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:2}}><span style={{color:"var(--text-muted)"}}>Total Cost</span><span style={{color:"#f43f5e",fontWeight:600}}>{orderTotalCost.toLocaleString()} LKR</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"12px",marginBottom:6}}><span style={{color:"var(--text-muted)"}}>Total Profit</span><span style={{color:orderTotalProfit>=0?"#34d399":"#f43f5e",fontWeight:700}}>{orderTotalProfit.toLocaleString()} LKR</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:"15px",fontWeight:800,marginBottom:10,padding:"8px 0",borderTop:"1px solid rgba(52,211,153,0.25)"}}><span>Order Total</span><span style={{color:"#38bdf8"}}>{orderFinalTotal.toLocaleString()} LKR</span></div>
                    <button onClick={handleBulkSell} style={{width:"100%",background:"linear-gradient(135deg,#34d399,#059669)",color:"#fff",border:"none",borderRadius:"8px",padding:"12px",fontFamily:"'Syne',sans-serif",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
                      Sell Order {shopName?`→ ${shopName}`:""}{disc>0?` (${disc}% off)`:""}
                    </button>
                    <button onClick={()=>{setBulkQtys({});setBulkItems([]);setShopName("");setDiscountPct("");}} style={{width:"100%",background:"transparent",border:"1px solid var(--border)",color:"var(--text-muted)",borderRadius:"8px",padding:"8px",fontFamily:"'Syne',sans-serif",fontSize:"12px",cursor:"pointer",marginTop:6}}>Clear Order</button>
                  </div>
                </div>
              )}
              {checkoutMsg&&<p className="checkout-msg" style={{marginTop:10}}>{checkoutMsg}</p>}
            </div>

            <div className="products" style={{flex:"1.5 1 0",minWidth:0,overflowY:"auto",maxHeight:"calc(100vh - 80px)"}}>
              <h3>Quick Add</h3>
              <div className="product-grid">
                {products.length===0&&<div style={{gridColumn:"1/-1",color:"var(--text-muted)",fontSize:"13px",textAlign:"center",padding:"20px"}}>No products — add them in Products page</div>}
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <div style={{fontWeight:700,fontSize:"13px",lineHeight:1.3}}>{product.name}</div>
                    <div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"3px"}}>{parseFloat(product.price).toLocaleString()} LKR</div>
                  </div>
                ))}
              </div>
              {savedCart.length>0&&(
                <div className="held-cart">
                  <div className="held-cart-header"><span>🛒 Held Cart</span><span className="held-badge">{savedCart.length} item{savedCart.length>1?"s":""}</span></div>
                  {savedCart.map(item=>(<div key={item.id} className="held-item"><span>{item.name} x{item.qty}</span><span className="held-item-right">{(item.price*item.qty).toLocaleString()} LKR<button onClick={()=>removeSavedItem(item.id)}>✕</button></span></div>))}
                  <div className="held-total">Total: <strong>{savedTotal.toLocaleString()} LKR</strong></div>
                  <button className="btn-checkout-saved" onClick={handleCheckoutSaved}>Checkout Held Cart</button>
                </div>
              )}
            </div>

            <div className="cart" style={{flex:"1 1 0",minWidth:"220px",maxWidth:"300px",overflowY:"auto",maxHeight:"calc(100vh - 80px)"}}>
              <h3>Cart</h3>
              {cart.length===0&&<p>No items added</p>}
              {cart.map(item=>(<div key={item.id} className="cart-item"><span>{item.name} x {item.qty}</span><span>{(item.price*item.qty).toLocaleString()} LKR<button onClick={()=>removeFromCart(item.id)}>X</button></span></div>))}
              <hr />
              <div style={{fontSize:"13px",color:"var(--text-muted)",marginBottom:4}}>Cost: {totalCostCart.toLocaleString()} LKR</div>
              <div style={{fontSize:"13px",color:"#34d399",marginBottom:4}}>Profit: {totalProfit.toLocaleString()} LKR</div>
              <h4>Total: {total.toLocaleString()} LKR</h4>
              {checkoutMsg&&<p className="checkout-msg">{checkoutMsg}</p>}
              <div className="cart-actions">
                <button className="btn-sell" onClick={handleSell} disabled={cart.length===0}>💵 Sell</button>
                <button className="btn-hold" onClick={handleAddToCart} disabled={cart.length===0}>🛒 Hold</button>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS PAGE */}
        {activePage==="products"&&(
          <div style={S.pageWrap}>
            <div style={S.card}>
              <div style={S.title}>Add New Product</div>
              <form onSubmit={handleAddProduct}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:"10px",alignItems:"end"}}>
                  <div><div style={{fontSize:"11px",color:"var(--text-muted)",marginBottom:4}}>Product Name</div><input style={S.input} type="text" placeholder="e.g. Car Wash" value={newProd.name} onChange={e=>setNewProd({...newProd,name:e.target.value})} required /></div>
                  <div><div style={{fontSize:"11px",color:"var(--text-muted)",marginBottom:4}}>Selling Price (LKR)</div><input style={S.input} type="number" placeholder="e.g. 4500" value={newProd.price} min="1" onChange={e=>setNewProd({...newProd,price:e.target.value})} required /></div>
                  <div><div style={{fontSize:"11px",color:"var(--text-muted)",marginBottom:4}}>Cost Price (LKR)</div><input style={S.input} type="number" placeholder="e.g. 2500" value={newProd.cost} min="0" onChange={e=>setNewProd({...newProd,cost:e.target.value})} /></div>
                  <button type="submit" style={S.btnBlue}>Add Product</button>
                </div>
              </form>
              {prodMsg&&<p style={{marginTop:10,fontSize:"12px",color:"#34d399",fontWeight:600}}>{prodMsg}</p>}
            </div>
            <div style={S.card}>
              <div style={S.title}>All Products ({products.length})</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>#</th><th style={S.th}>Name</th><th style={S.th}>Selling Price</th><th style={S.th}>Cost Price</th><th style={S.th}>Profit/Unit</th><th style={S.th}>Margin</th><th style={S.th}>Actions</th></tr></thead>
                <tbody>
                  {products.map(p=>{
                    const pu=parseFloat(p.price)-parseFloat(p.cost),mg=parseFloat(p.price)>0?((pu/parseFloat(p.price))*100).toFixed(1):0;
                    return editingProd?.id===p.id?(
                      <tr key={p.id} style={{background:"rgba(56,189,248,0.05)"}}><td style={S.td} colSpan={7}>
                        <form onSubmit={handleUpdateProduct}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:"10px",alignItems:"end"}}>
                          <input style={S.input} type="text" value={editingProd.name} onChange={e=>setEditingProd({...editingProd,name:e.target.value})} required />
                          <input style={S.input} type="number" value={editingProd.price} min="1" onChange={e=>setEditingProd({...editingProd,price:e.target.value})} required />
                          <input style={S.input} type="number" value={editingProd.cost} min="0" onChange={e=>setEditingProd({...editingProd,cost:e.target.value})} />
                          <div style={{display:"flex",gap:8}}><button type="submit" style={S.btnGreen}>Save</button><button type="button" style={S.btnRed} onClick={()=>setEditingProd(null)}>Cancel</button></div>
                        </div></form>
                      </td></tr>
                    ):(
                      <tr key={p.id} className="recent-row">
                        <td style={{...S.td,color:"var(--text-muted)",fontFamily:"monospace"}}>{p.id}</td>
                        <td style={{...S.td,fontWeight:600}}>{p.name}</td>
                        <td style={{...S.td,color:"#38bdf8",fontWeight:700}}>{parseFloat(p.price).toLocaleString()} LKR</td>
                        <td style={{...S.td,color:"#f43f5e",fontWeight:600}}>{parseFloat(p.cost).toLocaleString()} LKR</td>
                        <td style={{...S.td,color:"#34d399",fontWeight:700}}>{pu.toLocaleString()} LKR</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:700,background:mg>=30?"rgba(52,211,153,0.12)":mg>=15?"rgba(245,158,11,0.12)":"rgba(244,63,94,0.12)",color:mg>=30?"#34d399":mg>=15?"#f59e0b":"#f43f5e",border:`1px solid ${mg>=30?"rgba(52,211,153,0.25)":mg>=15?"rgba(245,158,11,0.25)":"rgba(244,63,94,0.25)"}`}}>{mg}%</span></td>
                        <td style={{...S.td,display:"flex",gap:8}}><button style={S.btnAmber} onClick={()=>setEditingProd({...p})}>Edit</button><button style={S.btnRed} onClick={()=>handleDeleteProduct(p.id)}>Delete</button></td>
                      </tr>
                    );
                  })}
                  {products.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"var(--text-muted)"}}>No products yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ORDERS PAGE */}
        {activePage==="orders"&&(
          <div style={S.pageWrap}>
            <div style={{display:"flex",gap:0,background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"12px",padding:"4px",width:"fit-content"}}>
              {[{id:"list",label:"Order List"},{id:"monthly",label:"Monthly Report"}].map(tab=>(
                <button key={tab.id} onClick={()=>setOrdersTab(tab.id)} style={{background:ordersTab===tab.id?"linear-gradient(135deg,#38bdf8,#0ea5e9)":"transparent",color:ordersTab===tab.id?"#fff":"var(--text-muted)",border:"none",borderRadius:"8px",padding:"8px 18px",fontFamily:"'Syne',sans-serif",fontSize:"12px",fontWeight:700,cursor:"pointer",transition:"all 0.2s",letterSpacing:"0.3px"}}>
                  {tab.label}
                </button>
              ))}
            </div>

            {ordersTab==="list"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
                  <StatCard label="Total Orders"   value={orders.length} accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" />
                  <StatCard label="Today's Orders" value={orders.filter(o=>new Date(o.created_at).toLocaleDateString("en-LK")===todayStr).length} accentColor="linear-gradient(90deg,#818cf8,#6366f1)" />
                  <StatCard label="Today Revenue"  value={orders.filter(o=>new Date(o.created_at).toLocaleDateString("en-LK")===todayStr).reduce((s,o)=>s+parseFloat(o.total),0).toLocaleString()+" LKR"} accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" />
                  <StatCard label="Today Profit"   value={orders.filter(o=>new Date(o.created_at).toLocaleDateString("en-LK")===todayStr).reduce((s,o)=>s+parseFloat(o.profit||0),0).toLocaleString()+" LKR"} accentColor="linear-gradient(90deg,#34d399,#059669)" />
                </div>
                <div style={{...S.card,display:"flex",gap:"12px",alignItems:"center",padding:"14px 20px"}}>
                  <input style={{...S.input,maxWidth:"280px"}} type="text" placeholder="Search order # or product..." value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} />
                  <button style={orderFilter==="all"?S.btnBlue:S.btnAmber} onClick={()=>setOrderFilter("all")}>All Orders</button>
                  <button style={orderFilter==="today"?S.btnBlue:S.btnAmber} onClick={()=>setOrderFilter("today")}>Today Only</button>
                  <button style={{...S.btnGreen,marginLeft:"auto"}} onClick={fetchOrders}>Refresh</button>
                </div>
                <div style={S.card}>
                  <div style={S.title}>Orders ({filteredOrders.length})</div>
                  {ordersLoading?<p style={{color:"var(--text-muted)"}}>Loading...</p>:(
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Order #</th><th style={S.th}>Items</th><th style={S.th}>Date & Time</th><th style={S.th}>Revenue</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th><th style={S.th}>Action</th></tr></thead>
                      <tbody>
                        {filteredOrders.map(order=>(
                          <tr key={order.id} className="recent-row">
                            <td style={{...S.td,color:"var(--text-muted)",fontFamily:"monospace"}}>#{String(order.id).padStart(3,"0")}</td>
                            <td style={{...S.td,maxWidth:"200px",fontSize:"12px"}}>{(order.items||[]).map(it=>`${it.name} x${it.qty}`).join(", ")}</td>
                            <td style={{...S.td,color:"var(--text-muted)",fontSize:"12px"}}>{new Date(order.created_at).toLocaleString("en-LK",{dateStyle:"medium",timeStyle:"short"})}</td>
                            <td style={{...S.td,color:"#38bdf8",fontWeight:700}}>{safe(order.total).toLocaleString()} LKR</td>
                            <td style={{...S.td,color:"#f43f5e",fontWeight:600}}>{safe(order.total_cost).toLocaleString()} LKR</td>
                            <td style={{...S.td,color:"#34d399",fontWeight:700}}>{safe(order.profit).toLocaleString()} LKR</td>
                            <td style={S.td}><button style={{...S.btnRed,opacity:deletingId===order.id?0.5:1}} onClick={()=>handleDeleteOrder(order.id)} disabled={deletingId===order.id}>{deletingId===order.id?"...":"Delete"}</button></td>
                          </tr>
                        ))}
                        {filteredOrders.length===0&&<tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"var(--text-muted)"}}>No orders found</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {ordersTab==="monthly"&&(
              <>
                <div style={{...S.card,display:"flex",gap:"12px",alignItems:"center",padding:"14px 20px",flexWrap:"wrap"}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:"11px",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.8px",color:"var(--text-muted)"}}>Report Period</div>
                  <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))} style={{...inp,width:"auto",minWidth:"130px",cursor:"pointer"}}>
                    {MONTH_NAMES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                  </select>
                  <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))} style={{...inp,width:"auto",minWidth:"90px",cursor:"pointer"}}>
                    {availableYears.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                  <div style={{marginLeft:"auto",fontFamily:"'Syne',sans-serif",fontSize:"13px",fontWeight:700,color:"var(--text-muted)"}}>{MONTH_NAMES[selectedMonth]} {selectedYear}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px"}}>
                  <StatCard label="Total Orders"  value={monthOrders}                            accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" sub={`In ${MONTH_NAMES[selectedMonth]}`} />
                  <StatCard label="Total Revenue" value={monthRevenue.toLocaleString()+" LKR"}   accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" sub="Gross sales" />
                  <StatCard label="Total Cost"    value={monthCost.toLocaleString()+" LKR"}      accentColor="linear-gradient(90deg,#f43f5e,#e11d48)"  sub="All costs" />
                  <StatCard label="Net Profit"    value={monthProfit.toLocaleString()+" LKR"}    accentColor="linear-gradient(90deg,#34d399,#059669)"  sub={monthRevenue>0?`${((monthProfit/monthRevenue)*100).toFixed(1)}% margin`:"No sales"} />
                </div>
                <div style={S.card}>
                  <div style={{...S.title,marginBottom:12}}>Daily Revenue & Profit — {MONTH_NAMES[selectedMonth]} {selectedYear}</div>
                  {monthOrders===0?<p style={{color:"var(--text-muted)",textAlign:"center",padding:"30px 0",fontSize:"13px"}}>No orders in this month</p>:(
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dailyData} margin={{top:6,right:16,left:0,bottom:0}} barCategoryGap="25%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2f52" vertical={false} />
                        <XAxis dataKey="day" tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} interval={1} />
                        <YAxis tick={{fontSize:10,fill:"#64748b"}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="Revenue" fill="#38bdf8" radius={[3,3,0,0]} />
                        <Bar dataKey="Profit"  fill="#34d399" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div style={S.card}>
                  <div style={S.title}>Product Performance</div>
                  {monthProducts.length===0?<p style={{color:"var(--text-muted)",textAlign:"center",padding:"20px 0",fontSize:"13px"}}>No sales data for this month</p>:(
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>#</th><th style={S.th}>Product</th><th style={S.th}>Qty Sold</th><th style={S.th}>Revenue</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th><th style={S.th}>Margin</th></tr></thead>
                      <tbody>
                        {monthProducts.map((row,i)=>{
                          const margin=row.revenue>0?((row.profit/row.revenue)*100).toFixed(1):0;
                          return(
                            <tr key={i} className="recent-row">
                              <td style={{...S.td,color:"var(--text-muted)",fontFamily:"monospace",fontSize:"12px"}}>{i+1}</td>
                              <td style={{...S.td,fontWeight:700}}>{row.name}</td>
                              <td style={S.td}>{row.qty.toLocaleString()}</td>
                              <td style={{...S.td,color:"#38bdf8",fontWeight:700}}>{row.revenue.toLocaleString()} LKR</td>
                              <td style={{...S.td,color:"#f43f5e",fontWeight:600}}>{row.cost.toLocaleString()} LKR</td>
                              <td style={{...S.td,color:"#34d399",fontWeight:700}}>{row.profit.toLocaleString()} LKR</td>
                              <td style={S.td}><span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:700,background:margin>=30?"rgba(52,211,153,0.12)":margin>=15?"rgba(245,158,11,0.12)":"rgba(244,63,94,0.12)",color:margin>=30?"#34d399":margin>=15?"#f59e0b":"#f43f5e",border:`1px solid ${margin>=30?"rgba(52,211,153,0.25)":margin>=15?"rgba(245,158,11,0.25)":"rgba(244,63,94,0.25)"}`}}>{margin}%</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <div style={S.card}>
                  <div style={S.title}>All Orders — {MONTH_NAMES[selectedMonth]} {selectedYear} ({monthOrders})</div>
                  {monthOrders===0?<p style={{color:"var(--text-muted)",textAlign:"center",padding:"20px 0",fontSize:"13px"}}>No orders this month</p>:(
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Order #</th><th style={S.th}>Items</th><th style={S.th}>Date & Time</th><th style={S.th}>Revenue</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th></tr></thead>
                      <tbody>
                        {monthlyOrders.slice().reverse().map(order=>(
                          <tr key={order.id} className="recent-row">
                            <td style={{...S.td,color:"var(--text-muted)",fontFamily:"monospace"}}>#{String(order.id).padStart(3,"0")}</td>
                            <td style={{...S.td,maxWidth:"220px",fontSize:"12px"}}>{(order.items||[]).map(it=>`${it.name} x${it.qty}`).join(", ")}</td>
                            <td style={{...S.td,color:"var(--text-muted)",fontSize:"12px"}}>{new Date(order.created_at).toLocaleString("en-LK",{dateStyle:"medium",timeStyle:"short"})}</td>
                            <td style={{...S.td,color:"#38bdf8",fontWeight:700}}>{safe(order.total).toLocaleString()} LKR</td>
                            <td style={{...S.td,color:"#f43f5e",fontWeight:600}}>{safe(order.total_cost).toLocaleString()} LKR</td>
                            <td style={{...S.td,color:"#34d399",fontWeight:700}}>{safe(order.profit).toLocaleString()} LKR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* DASHBOARD PAGE */}
        {activePage==="dashboard"&&(
          <div className="dashboard">
            {dashLoading&&<div className="dash-empty"><p>Loading...</p></div>}
            {dashError&&<div className="dash-empty error"><p>{dashError}</p></div>}
            {!dashLoading&&!dashError&&(
              <>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"11px",fontWeight:800,textTransform:"uppercase",letterSpacing:"1.4px",color:"var(--text-muted)",borderBottom:"1px solid var(--border)",paddingBottom:"8px",marginBottom:"14px"}}>Today</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"20px"}}>
                  <StatCard label="Revenue"     value={`${d.todayRevenue} LKR`} sub={`${d.todayOrders} orders today`}   accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" />
                  <StatCard label="Cost"        value={`${d.todayCost} LKR`}    sub="Total spent today"                  accentColor="linear-gradient(90deg,#f43f5e,#e11d48)" />
                  <StatCard label="Profit"      value={`${d.todayProfit} LKR`}  sub="Revenue minus cost"                 accentColor="linear-gradient(90deg,#34d399,#059669)" />
                  <StatCard label="Top Product" value={d.topProduct?.name||"—"} sub={d.topProduct?`${d.topProduct.sold} sold`:"No sales yet"} accentColor="linear-gradient(90deg,#f59e0b,#d97706)" />
                </div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"11px",fontWeight:800,textTransform:"uppercase",letterSpacing:"1.4px",color:"var(--text-muted)",borderBottom:"1px solid var(--border)",paddingBottom:"8px",marginBottom:"14px"}}>All Time</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"20px"}}>
                  <StatCard label="Total Revenue" value={`${d.totalRevenue} LKR`} sub={`${d.totalOrders} total orders`} accentColor="linear-gradient(90deg,#38bdf8,#0ea5e9)" />
                  <StatCard label="Total Cost"    value={`${d.totalCost} LKR`}    sub="All time spending"                accentColor="linear-gradient(90deg,#f43f5e,#e11d48)" />
                  <StatCard label="Total Profit"  value={`${d.totalProfit} LKR`}  sub="All time net profit"              accentColor="linear-gradient(90deg,#34d399,#059669)" />
                  <StatCard label="Items Sold"    value={d.totalItems}            sub="Total units sold"                 accentColor="linear-gradient(90deg,#818cf8,#6366f1)" />
                </div>
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div><div className="chart-card-title">Monthly Sales</div><div className="chart-card-sub">{new Date().getFullYear()} · LKR</div></div>
                    <div className="chart-legend-row"><span className="legend-dot" style={{background:"#38bdf8"}}></span> Real <span className="legend-dot" style={{background:"#334155",marginLeft:12}}></span> Target</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyChartData} margin={{top:10,right:16,left:0,bottom:0}} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2f52" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize:12,fill:"#64748b"}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Sample/Target" fill="#1e3a5f" radius={[4,4,0,0]} />
                      <Bar dataKey="Real Sales" fill="#38bdf8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <div className="chart-card-header">
                    <div><div className="chart-card-title">Annual Revenue</div><div className="chart-card-sub">Year-over-year · LKR</div></div>
                    <div className="chart-legend-row"><span className="legend-dot" style={{background:"#34d399"}}></span> Revenue</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={annualChartData} margin={{top:10,right:16,left:0,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2f52" vertical={false} />
                      <XAxis dataKey="year" tick={{fontSize:12,fill:"#64748b"}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize:11,fill:"#64748b"}} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="revenue" name="Annual Revenue" stroke="#34d399" strokeWidth={3} dot={{r:6,fill:"#34d399",strokeWidth:2,stroke:"#0f1f3a"}} activeDot={{r:8}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="recent-table-card">
                  <div className="dash-chart-title">Profit Per Product</div>
                  {d.profitPerProduct.length===0?<p className="chart-empty">No data yet — complete some sales first</p>:(
                    <table className="recent-table">
                      <thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr></thead>
                      <tbody>
                        {d.profitPerProduct.map((row,i)=>{const rev=safe(row.total_revenue),cost=safe(row.total_cost),profit=safe(row.total_profit),margin=rev>0?((profit/rev)*100).toFixed(1):0;return(
                          <tr key={i} className="recent-row">
                            <td><strong>{row.name}</strong></td><td>{row.total_qty||0}</td>
                            <td className="tx-amount">{rev.toLocaleString()} LKR</td>
                            <td style={{color:"#f43f5e",fontWeight:600}}>{cost.toLocaleString()} LKR</td>
                            <td style={{color:"#34d399",fontWeight:700}}>{profit.toLocaleString()} LKR</td>
                            <td><span style={{display:"inline-block",padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:700,background:margin>=30?"rgba(52,211,153,0.12)":margin>=15?"rgba(245,158,11,0.12)":"rgba(244,63,94,0.12)",color:margin>=30?"#34d399":margin>=15?"#f59e0b":"#f43f5e",border:`1px solid ${margin>=30?"rgba(52,211,153,0.25)":margin>=15?"rgba(245,158,11,0.25)":"rgba(244,63,94,0.25)"}`}}>{margin}%</span></td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="recent-table-card">
                  <div className="dash-chart-title">Recent Transactions</div>
                  {d.recentOrders.length===0?<p className="chart-empty">No transactions yet</p>:(
                    <table className="recent-table">
                      <thead><tr><th>Order #</th><th>Items</th><th>Date & Time</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {d.recentOrders.map(order=>(
                          <tr key={order.id} className="recent-row">
                            <td className="tx-id">#{String(order.id).padStart(3,"0")}</td>
                            <td>{(order.items||[]).map(it=>`${it.name} x${it.qty}`).join(", ")}</td>
                            <td className="tx-date">{new Date(order.created_at).toLocaleString("en-LK",{dateStyle:"medium",timeStyle:"short"})}</td>
                            <td className="tx-amount">{safe(order.total).toLocaleString()} LKR</td>
                            <td style={{color:"#f43f5e",fontWeight:600}}>{safe(order.total_cost).toLocaleString()} LKR</td>
                            <td style={{color:"#34d399",fontWeight:700}}>{safe(order.profit).toLocaleString()} LKR</td>
                            <td><span className="status-badge paid">Paid</span></td>
                            <td><button onClick={()=>handleDeleteOrder(order.id)} disabled={deletingId===order.id} style={{background:"rgba(244,63,94,0.12)",border:"1px solid rgba(244,63,94,0.3)",color:"#f43f5e",padding:"4px 12px",borderRadius:"6px",fontSize:"11px",fontWeight:700,cursor:"pointer",opacity:deletingId===order.id?0.5:1,whiteSpace:"nowrap"}}>{deletingId===order.id?"...":"Delete"}</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="dash-refresh">
                  {lastUpdated&&<span style={{fontSize:"11px",color:"var(--text-muted)",marginRight:"12px"}}>Last updated: {lastUpdated}</span>}
                  <button onClick={()=>fetchDashboard(false)}>Refresh Data</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
