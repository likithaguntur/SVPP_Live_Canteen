/* ===== Data & State Management ===== */
const menuData = [
    { id: 1, name: "Idli", price: 30, category: "Breakfast", img: "idli-sambar.jpg" },
    { id: 2, name: "Dosa", price: 50, category: "Breakfast", img: "dsa.jpg" },
    { id: 3, name: "chapathi", price: 45, category: "Breakfast", img: "chapati.jpg" },
    { id: 4, name: "poori", price: 35, category: "Breakfast", img: "poori.jpg" },
    { id: 5, name: "pongal", price: 40, category: "Breakfast", img: "pongal-ven-pongal.jpg" },
    { id: 6, name: "Veg thali", price: 80, category: "Lunch", img: "veg-thali.jpg" },
    { id: 7, name: "Veg biryani", price: 70, category: "Lunch", img: "vegbiryani.jpg" },
    { id: 8, name: "chicken biryani", price: 120, category: "Lunch", img: "biryani.jpg" },
    { id: 9, name: "paneer curry", price: 60, category: "Lunch", img: "pannercurry.jpg" },
    { id: 10, name: "gobi rice", price: 50, category: "Lunch", img: "gbi.jpg" },
    { id: 11, name: "mushroom biryani", price: 80, category: "Lunch", img: "mushroom-fried-rice-.jpg" },
    { id: 12, name: "chilli chicken", price: 99, category: "Lunch", img: "chi.jpg" },
    { id: 13, name: "parota", price: 40, category: "Dinner", img: "parta.jpg" },
    { id: 14, name: "masala dosa", price: 30, category: "Dinner", img: "Masala-Dosa.jpg" },
    { id: 15, name: "rice", price: 40, category: "Dinner", img: "rice.jpg" },
    { id: 16, name: "curd", price: 20, category: "Dinner", img: "Curd.jpg" },
    { id: 17, name: "Juice", price: 25, category: "snacks", img: "poznan-poland.jpg" },
    { id: 18, name: "Coffee", price: 20, category: "snacks", img: "coffee.jpg" },
    { id: 19, name: "tea", price: 15, category: "snacks", img: "tea.png" },
    { id: 20, name: "icecream", price: 40, category: "snacks", img: "icecream.jpg" },
    { id: 21, name: "chocolate", price: 80, category: "snacks", img: "chocolate.jpg" },
    { id: 22, name: "samosa", price: 20, category: "snacks", img: "samosa.jpg" },
    { id: 23, name: "panner role", price: 50, category: "snacks", img: "springrole.jpg" },
    { id: 24, name: "spring role", price: 50, category: "snacks", img: "sp2.jpg" },
    { id: 25, name: "maggie", price: 40, category: "snacks", img: "maggie.jpg" },
];

// State
let currentUser = "";               // username / rollno
let currentRole = "student";        // student / staff
let page = 0;
const itemsPerPage = 6;
let filters = { category: null };   // current category filter

// Persistent data
let discounts = JSON.parse(localStorage.getItem('discounts')) || {};
let sales = parseFloat(localStorage.getItem('sales')) || 0;
let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
let currentRating = 0;

/* ===== Helpers ===== */
const $ = id => document.getElementById(id);
function formatRupee(v) { return "₹" + (+v).toFixed(2); }
function nowString() { return new Date().toLocaleString(); }

/* ----- Wallet per student ----- */
function getWallet(username) {
    const wallets = JSON.parse(localStorage.getItem("wallets")) || {};
    if (!wallets[username]) wallets[username] = 1000; // default balance
    return wallets[username];
}
function setWallet(username, balance) {
    const wallets = JSON.parse(localStorage.getItem("wallets")) || {};
    wallets[username] = +balance;
    localStorage.setItem("wallets", JSON.stringify(wallets));
}

/* ----- Orders per student ----- */
function loadOrdersForUser(username) {
    const raw = localStorage.getItem('orders_' + username);
    return raw ? JSON.parse(raw) : [];
}
function saveOrdersForUser(username, orders) {
    localStorage.setItem('orders_' + username, JSON.stringify(orders));
}

/* ===== UI: show sections ===== */
function showSection(id) {
    ['login-page', 'student-page', 'staff-page'].forEach(pid => {
        const p = $(pid);
        if (p) p.classList.add('hidden');
    });
    const s = $(id);
    if (s) s.classList.remove('hidden');
}

/* ===== Menu Loading with paging & filter ===== */
function loadMenu(category = null) {
    // set filter if provided (keep null => keep current)
    filters.category = (typeof category === 'undefined') ? filters.category : category;
    page = 0; // reset to first page when category changed (better UX)
    renderMenuPage();
}

function renderMenuPage() {
    const menu = $("menu");
    if (!menu) return;
    menu.innerHTML = "";

    let filtered = menuData.filter(item => !filters.category || item.category === filters.category);
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    if (page >= totalPages) page = totalPages - 1;

    const start = page * itemsPerPage;
    const paged = filtered.slice(start, start + itemsPerPage);

    paged.forEach(item => {
        const pct = discounts[item.id] || 0;
        const finalPrice = +(item.price * (1 - pct / 100)).toFixed(2);
        const div = document.createElement("div");
        div.className = "menu-item";
        const discountHTML = pct > 0 ? `<p style="color:green;font-size:13px;">${pct}% off</p>` : "";
        div.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p><b>${formatRupee(finalPrice)}</b> <small>${item.category}</small></p>
            ${discountHTML}
            <div style="display:flex;gap:8px;margin-top:8px;justify-content:center;">
                <button onclick="placeOrder(${item.id})">Order</button>
                <button onclick="addOneToCartPreview(${item.id})" style="background:#6c757d">+1</button>
            </div>
        `;
        menu.appendChild(div);
    });

    // page info & prev/next enable/disable
    const filteredLen = filtered.length;
    const total = Math.max(1, Math.ceil(filteredLen / itemsPerPage));
    $("page-info").textContent = `Page ${page+1} / ${total}`;
    $("prev-btn").disabled = page === 0;
    $("next-btn").disabled = page === (total - 1);
}

/* Paging functions */
function nextPage() { page++; renderMenuPage(); }
function prevPage() { if (page > 0) page--; renderMenuPage(); }

/* ===== Orders ===== */
function addOneToCartPreview(id) { placeOrder(id); }

function placeOrder(id) {
    const item = menuData.find(m => m.id === id);
    if (!item) return;
    const pct = discounts[item.id] || 0;
    const finalPrice = +(item.price * (1 - pct / 100)).toFixed(2);

    // wallet for current user
    let walletBalance = getWallet(currentUser);
    if (walletBalance < finalPrice) {
        alert("❌ Not enough balance!");
        return;
    }

    walletBalance -= finalPrice;
    setWallet(currentUser, walletBalance);
    $("wallet-balance").textContent = walletBalance.toFixed(2);

    // load, push order, save per user
    let orders = loadOrdersForUser(currentUser);
    const order = { id: item.id, name: item.name, price: item.price, img: item.img, discount: pct, finalPrice: finalPrice, time: nowString() };
    orders.push(order);
    saveOrdersForUser(currentUser, orders);

    // update global sales (sum of all students' orders finalPrice)
    sales = (parseFloat(localStorage.getItem('sales')) || 0) + finalPrice;
    localStorage.setItem('sales', sales);

    updateOrders();
    updateReports();
    try { document.getElementById('audio-order').play(); } catch(e){/*ignore*/ }
}

function cancelOrder(index) {
    let orders = loadOrdersForUser(currentUser);
    if (index < 0 || index >= orders.length) return;
    const o = orders[index];

    // refund
    let walletBalance = getWallet(currentUser);
    walletBalance += o.finalPrice;
    setWallet(currentUser, walletBalance);
    $("wallet-balance").textContent = walletBalance.toFixed(2);

    // remove
    orders.splice(index, 1);
    saveOrdersForUser(currentUser, orders);

    // recompute sales (we keep global sales as stored; safest is recompute sum across all users)
    recomputeGlobalSales();

    updateOrders();
    updateReports();
}

function recomputeGlobalSales() {
    // sum finalPrice across all orders_* keys
    let total = 0;
    for (let k in localStorage) {
        if (k.startsWith('orders_')) {
            try {
                const arr = JSON.parse(localStorage.getItem(k)) || [];
                total += arr.reduce((a,b) => a + (b.finalPrice||0), 0);
            } catch(e) {}
        }
    }
    sales = total;
    localStorage.setItem('sales', sales);
}

/* ===== Orders Display ===== */
function updateOrders() {
    const studentList = $("order-list");
    const staffList = $("staff-order-list");
    if (studentList) studentList.innerHTML = "";
    if (staffList) staffList.innerHTML = "";

    const orders = loadOrdersForUser(currentUser);

    orders.forEach((o, idx) => {
        // === Student view ===
        if (studentList) {
            const li = document.createElement("li");
            li.innerHTML = `
                <div style="display:flex;gap:12px;align-items:center;">
                    <img src="${o.img}" alt="${o.name}" 
                         style="width:48px;height:48px;border-radius:6px;object-fit:cover;">
                    <div>
                        <div style="font-weight:600;">${o.name}</div>
                        <div style="font-size:13px;color:#555;">
                            ${ o.discount > 0 
                                ? `${formatRupee(o.price)} → ${o.discount}% → ${formatRupee(o.finalPrice)}` 
                                : `${formatRupee(o.finalPrice)}` }
                        </div>
                    </div>
                </div>
                <div>
                    <button onclick="cancelOrder(${idx})" 
                            style="background:#dc3545;color:#fff;padding:6px 10px;border:none;border-radius:6px;cursor:pointer;">
                        Cancel
                    </button>
                </div>
            `;
            studentList.appendChild(li);
        }

        // === Staff view (current user's orders) ===
        if (staffList) {
            const li2 = document.createElement("li");
            li2.innerHTML = `
                <div style="display:flex;gap:10px;align-items:center;">
                    <img src="${o.img}" alt="${o.name}" 
                         style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
                    <div>
                        <div style="font-weight:600;">${o.name}</div>
                        <div style="font-size:13px;color:#333;">${formatRupee(o.finalPrice)}</div>
                    </div>
                </div>
            `;
            staffList.appendChild(li2);
        }
    });

    // === Staff live orders view (all students) ===
    if (staffList) {
        for (let k in localStorage) {
            if (k.startsWith('orders_') && k !== 'orders_' + currentUser) {
                try {
                    const arr = JSON.parse(localStorage.getItem(k)) || [];
                    arr.forEach(o => {
                        const li2 = document.createElement("li");
                        li2.innerHTML = `
                            <div style="display:flex;gap:10px;align-items:center;">
                                <img src="${o.img}" alt="${o.name}" 
                                     style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
                                <div>
                                    <div style="font-weight:600;">${o.name} (${k.replace('orders_','')})</div>
                                    <div style="font-size:13px;color:#333;">${formatRupee(o.finalPrice)}</div>
                                </div>
                            </div>
                        `;
                        staffList.appendChild(li2);
                    });
                } catch(e){}
            }
        }
    }
}

/* ===== Discount Dropdowns (staff) ===== */
function loadDiscountDropdowns() {
    const itemSel = $("discount-item");
    if (itemSel) {
        itemSel.innerHTML = "";
        menuData.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.name;
            itemSel.appendChild(opt);
        });
    }
}

/* ===== Apply Discount ===== */
function applyDiscountFromUI(type) {
    if (currentRole !== 'staff') { alert("Only staff can apply discounts"); return; }
    if (type === 'item') {
        const id = parseInt($("discount-item").value);
        const val = parseFloat($("discount-value").value);
        if (isNaN(val) || val < 0 || val > 100) { alert("Enter valid discount 0-100"); return; }
        discounts[id] = val;
    } else if (type === 'category') {
        const category = $("discount-category").value;
        const val = parseFloat($("category-discount-value").value);
        if (isNaN(val) || val < 0 || val > 100) { alert("Enter valid discount 0-100"); return; }
        menuData.filter(item => item.category === category)
                .forEach(item => { discounts[item.id] = val; });
    }
    localStorage.setItem('discounts', JSON.stringify(discounts));
    alert("✅ Discount applied successfully!");
    // Refresh student view to show new prices immediately
    if ($("student-page") && !$("student-page").classList.contains('hidden')) {
        renderMenuPage();
    }
}

/* ===== Reports ===== */
function updateReports() {
    const totalSalesSpan = $("total-sales");
    const topItemSpan = $("top-item");
    if (totalSalesSpan) totalSalesSpan.textContent = sales.toFixed(2);
    // top item from all orders across users
    const counts = {};
    for (let k in localStorage) {
        if (k.startsWith('orders_')) {
            try {
                const arr = JSON.parse(localStorage.getItem(k)) || [];
                arr.forEach(o => counts[o.name] = (counts[o.name] || 0) + 1);
            } catch(e){}
        }
    }
    if (Object.keys(counts).length > 0) {
        const top = Object.keys(counts).reduce((a,b)=>counts[a]>counts[b]?a:b);
        if (topItemSpan) topItemSpan.textContent = top;
    } else {
        if (topItemSpan) topItemSpan.textContent = "-";
    }
}

/* ===== Print Bill (with Back button) ===== */
function printBill() {
    const orders = loadOrdersForUser(currentUser);
    if (orders.length === 0) { alert("No orders to print!"); return; }
    let billHTML = `
        <html><head><title>Canteen Bill</title>
        <style>
            body{font-family:Arial,sans-serif;padding:20px;color:#222;}
            .header{display:flex;align-items:center;gap:12px;margin-bottom:10px;}
            .logo{width:70px;height:70px;object-fit:cover;border-radius:8px;}
            .item{display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid #eee;}
            .item img{width:60px;height:60px;object-fit:cover;border-radius:8px;}
            .desc{flex:1;}
            .price{font-weight:700;}
            .totals{text-align:right;font-weight:700;font-size:16px;margin-top:12px;}
            .back-btn{padding:10px 16px;border-radius:8px;background:#28a745;color:white;border:none;cursor:pointer;margin-top:12px;}
        </style>
        </head><body>
        <div class="header">
            <img src="college logo.jpg" class="logo" alt="Logo">
            <div>
                <h2>SVPP Live Kitchen</h2>
                <div>${nowString()}</div>
                <div>Customer: ${currentUser}</div>
            </div>
        </div>
        <hr/>
    `;
    let total = 0;
    orders.forEach(o => {
        total += o.finalPrice;
        const discountLine = o.discount > 0
            ? `<div style="font-size:13px;color:#007bff;">${formatRupee(o.price)} → ${o.discount}% OFF → <span class="price">${formatRupee(o.finalPrice)}</span></div>`
            : `<div class="price">${formatRupee(o.finalPrice)}</div>`;
        billHTML += `
            <div class="item">
                <img src="${o.img}" alt="${o.name}">
                <div class="desc">
                    <div style="font-weight:600;">${o.name}</div>
                    ${discountLine}
                </div>
            </div>
        `;
    });
    billHTML += `
        <hr/>
        <div class="totals">Total: ${formatRupee(total)}</div>
        <div class="totals" style="margin-top:6px;">Remaining Wallet: ${formatRupee(getWallet(currentUser))}</div>
        <div style="text-align:center;">
            <button class="back-btn" onclick="window.close()">⬅ Back</button>
        </div>
        <script>
            setTimeout(()=>{ window.print(); }, 200);
        <\/script>
        </body></html>
    `;
    const w = window.open("", "_blank");
    w.document.write(billHTML);
    w.document.close();
}

/* ===== Reviews and Ratings ===== */
function loadReviewDropdown() {
    const sel = $("review-item");
    if (!sel) return;
    sel.innerHTML = "";
    menuData.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        sel.appendChild(opt);
    });
}

function submitReview() {
    const username = ( $("username")?.value || currentUser || "").trim();
    const itemID = $("review-item").value;
    const reviewText = $("review-text").value.trim();
    const item = menuData.find(m => m.id == itemID);
    if (!currentRating || !reviewText) { alert("Please provide a rating and a review."); return; }
    const review = { item: item.name, reviewer: username, rating: currentRating, text: reviewText, date: nowString() };
    reviews.push(review);
    localStorage.setItem("reviews", JSON.stringify(reviews));
    alert("✅ Review submitted successfully!");
    $("review-text").value = "";
    currentRating = 0;
    updateStarDisplay();
    displayReviews();
}

function updateStarDisplay() {
    const stars = $("rating-stars").querySelectorAll('i');
    if(!stars) return;
    stars.forEach(star => {
        if (star.dataset.rating <= currentRating) {
            star.classList.remove('far'); star.classList.add('fas');
        } else {
            star.classList.remove('fas'); star.classList.add('far');
        }
    });
}

function displayReviews() {
    const reviewsList = $("reviews-list");
    if (!reviewsList) return;
    reviewsList.innerHTML = "";
    if (reviews.length === 0) {
        reviewsList.innerHTML = "<p style='text-align:center;color:#888;'>No reviews submitted yet.</p>";
        return;
    }
    reviews.forEach(r => {
        const div = document.createElement("div");
        div.className = "review-item";
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= r.rating) { starsHTML += '<i class="fas fa-star"></i>'; }
            else { starsHTML += '<i class="far fa-star"></i>'; }
        }
        div.innerHTML = `
            <div class="review-header">
                <div class="review-author">${r.reviewer} on ${r.item}</div>
                <div class="review-rating">${starsHTML}</div>
            </div>
            <div class="review-content">${r.text}</div>
            <div class="review-date" style="font-size:12px;color:#aaa;">${r.date}</div>
        `;
        reviewsList.appendChild(div);
    });
}

/* ===== Login & Logout ===== */
function loginAsStudent(name) {
    currentUser = name;
    currentRole = 'student';
    const ui = $("user-info");
    if (ui) ui.innerHTML = `<img src="STUDENT.png" class="user-pic"> <span>${name} (Student)</span>`;
    $("wallet-balance").textContent = getWallet(currentUser).toFixed(2);
    loadMenu();
    loadReviewDropdown();
    updateOrders();
    updateReports();
    displayReviews();
    // stop login audio (if playing)
    try { document.getElementById('audio-login').pause(); } catch(e){}
    showSection('student-page');
}

function loginAsStaff(name) {
    currentUser = name || 'staff';
    currentRole = 'staff';
    const si = $("staff-info");
    if (si) si.innerHTML = `<img src="chef.jpg" class="user-pic"> <span>${currentUser} (Staff)</span>`;
    loadDiscountDropdowns();
    updateOrders();
    updateReports();
    displayReviews();
    try { document.getElementById('audio-login').pause(); } catch(e){}
    showSection('staff-page');
}

function logout() {
    try { document.getElementById('audio-login').play(); } catch(e){}
    // clear currentUser, reset page filter
    currentUser = "";
    currentRole = "student";
    filters.category = null;
    page = 0;
    showSection('login-page');
}

/* ===== Discount helpers for staff page ===== */
function loadDiscountDropdowns() {
    const itemSel = $("discount-item");
    if (itemSel) {
        itemSel.innerHTML = "";
        menuData.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id; opt.textContent = m.name;
            itemSel.appendChild(opt);
        });
    }
}

/* ===== Event Listeners ===== */
document.addEventListener("DOMContentLoaded", () => {
    // Attempt to autoplay background login audio (may be blocked by browser; user interaction usually required)
    try { document.getElementById('audio-login').play(); } catch(e){}

    const loginBtn = $("login-btn");
    if (loginBtn) {
        loginBtn.addEventListener("click", () => {
            const username = ($("username")?.value || "").trim();
            const role = $("role")?.value || "student";
            if (!username) { alert("Enter your name / roll no"); return; }
            if (role === 'student') {
                loginAsStudent(username);
            } else {
                loginAsStaff(username);
            }
        });
    }

    // Student page listeners
    const logoutStudentBtn = $("logout-student");
    if (logoutStudentBtn) logoutStudentBtn.addEventListener("click", logout);

    const printBillBtn = $("print-bill");
    if (printBillBtn) printBillBtn.addEventListener("click", printBill);

    const submitReviewBtn = $("submit-review-btn");
    if (submitReviewBtn) submitReviewBtn.addEventListener("click", submitReview);

    const ratingStars = $("rating-stars");
    if (ratingStars) {
        ratingStars.addEventListener("click", (e) => {
            if (e.target.classList.contains("fa-star")) {
                currentRating = e.target.dataset.rating;
                updateStarDisplay();
            }
        });
    }

    // Staff page listeners
    const logoutStaffBtn = $("logout-staff");
    if (logoutStaffBtn) logoutStaffBtn.addEventListener("click", logout);

    // initialize UI
    showSection('login-page');
    renderMenuPage();
    displayReviews();
});
