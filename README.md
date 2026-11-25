# Mama Auto Parts – Website Guide

**Project:** Mama Auto Parts – E-Commerce Platform for Automotive Bike Parts
**Team:** Sumit Aryal (79242031), Niraj Chaudhary (79242011), Prajwal Adhikari (79242012)
**BICTE 7th Semester, Makawanpur Multiple Campus, Hetauda**

Use this guide to set up the website, prepare for the presentation and answer the invigilator's questions.

- **Shop address:** Bhundrung, Manahari-3, Makawanpur
- **Delivery area:** Manahari and all 19 wards of Hetauda Sub-Metropolitan City

---

## 1. Before the presentation

### Copy and open
1. Copy the whole website folder (the one that contains `index.html`, `css` and `js`) to the presentation laptop. A pen drive is fine. Keep all the files and folders together.
2. Open the folder and double-click **`index.html`**. It opens in Chrome or Edge.
3. You don't need internet, XAMPP or any installation.

### Start with clean data
The site saves everything (orders, new products, accounts) in the browser on that laptop, so your practice orders will still be there on the day.

To start fresh: log in as admin → **Email log** (left menu) → **Reset data** → OK. This loads the original sample products, customers and orders again. Do it **once, just before you present**.

### Checklist for the day
- [ ] Practise the full demo at least twice on the presentation laptop, in the same browser you will use on the day.
- [ ] Reset the data (see above).
- [ ] Zoom the browser to 110–125% (`Ctrl` + `+`) if you are using a projector.
- [ ] Close other tabs and turn off notifications.
- [ ] Keep this README open in another window in case you forget a step.

---

## 2. Accounts and sample data

| Role | Email | Password |
|---|---|---|
| Administrator (shop owner) | `admin@mamaautoparts.test` | `admin123` |
| Customer | `ram@demo.test` | `ram123` |

The **Log in** page has two buttons on the right that fill these in. Click one, then press **Log in**.

Other sample customers (only needed if asked): `sita@demo.test` / `sita123`, `bikash@demo.test` / `bikash123`.

**Sample order for tracking:** order `MAP-1001` with phone `9845012345` (Ram Thapa's delivered order).

---

## 3. Delivery charges

Hetauda wards are grouped into 4 zones by road distance from **Bastipur (Ward 19)**, the first part of Hetauda on the highway from Manahari.

| Zone | Distance from Bastipur | Wards | Charge | Time |
|---|---|---|---|---|
| Local | Manahari | – | **Rs. 50** | Same day |
| Zone 1 | 0 – 7 km | 19, 3, 12, 11 | **Rs. 100** | Same day |
| Zone 2 | 7.1 – 12 km | 13, 10, 2, 4 | **Rs. 150** | Same day |
| Zone 3 | 12.1 – 18 km | 5, 9, 1, 6, 7, 8, 14 | **Rs. 200** | Same day |
| Zone 4 | Over 18 km | 15, 16, 17, 18 | **Rs. 250** | Same day or next morning |

Orders above Rs. 5,000 are delivered free. For deep Padampokhari West (Ward 12) addresses the shop may call about a small extra inner-road charge; the Delivery page says this.

<details>
<summary>Distance of every ward from Bastipur</summary>

| Ward | Area / landmark | Distance | Zone |
|---|---|---|---|
| 1 | Chaukidanda / Nakka | ~14.4 km | 3 |
| 2 | Sub-Metropolitan Office / Chowkitole | ~10.9 km | 2 |
| 3 | Basamadi / Lewat | ~3.7 km | 1 |
| 4 | Buddha Chowk / Hupra Chaur | ~11.0 km | 2 |
| 5 | Piple / Sano Pokhara | ~12.1 km | 3 |
| 6 | Chaughada / Gauritar corridor (estimate) | ~14.5 km | 3 |
| 7 | Nagaswoti | ~15.4 km | 3 |
| 8 | Kamane | ~15.6 km | 3 |
| 9 | Pashupatinagar / Industrial District | ~13.4 km | 3 |
| 10 | Bus Park / TCN / Rapti Road | ~9.9 km | 2 |
| 11 | Nawalpur | ~6.5 km | 1 |
| 12 | Padampokhari West (across Rapti) | ~5.3 km | 1 |
| 13 | Padampokhari | ~8.4 km | 2 |
| 14 | Mayurdhap | ~15.7 km | 3 |
| 15 | Ratomate / Churiyamai (estimate) | ~18.5 km | 4 |
| 16 | Hatiya / Chisapani | ~19.0 km | 4 |
| 17 | Hatiya / Rajdevi | ~20.9 km | 4 |
| 18 | Harnamadi / Phurkechaur | ~26.2 km | 4 |
| 19 | Bastipur / Basti / Jyotinagar | 0 – 3 km | 1 |

</details>

---

## 4. Demo script (about 10 minutes)

Follow the steps in order. Each step lists **what to click**, **what to say**, and the objective from the proposal it covers.

### Step 1 – Home page and design (Objective 1: custom, mobile-friendly theme)
**Do:**
- Open the home page and scroll down slowly: categories, bike brands, most bought, offers.
- Press `F12`, click the phone/tablet icon at the top of the panel, and choose a phone such as "iPhone 12". Show the menu button and how the page fits a phone. Press `F12` again to close it.

**Say:** "This is our own theme for the shop. It works on phones as well as computers, because most of our customers will use a mobile."

### Step 2 – Find parts for your bike (Objective 2: products by brand, model and part type)
**Do:**
- In **Find parts for your bike**, choose **Bajaj** → **Pulsar 150** → **Find parts**.
- Point out that every product says "✓ Fits your Pulsar 150" and that the yellow bar at the top remembers the bike.
- Click **Change** in the yellow bar to clear it.

**Say:** "The biggest problem for riders is buying a part that doesn't fit. Every product stores the bikes it fits, so customers only see compatible parts."

### Step 3 – Product page
**Do:**
- Open **Chain Sprocket Kit** (Chain & Sprocket menu).
- Show the price and sale price, stock status, **Compatible bikes**, **Specifications**, **Customer reviews** and **Related products**.
- Use **Will it fit my bike?**: choose Honda Shine 125 and click Check. It says it does not fit.
- Open **LED Indicator Set** (Electrical). It is out of stock, so the Add to cart button is disabled.

**Say:** "Each product shows which bikes it fits, the stock left, specifications and reviews from other riders."

### Step 4 – Search and filters (Objective 4)
**Do:**
- Type `brake pad` in the search bar and press Enter.
- Click **All Parts**. On the left, filter by **Bike brand: Yamaha**, a price range such as 500 to 2000, then **In stock only**.
- Change **Sort by** to "Price: low to high". Remove a filter with the × on its chip above the products.

**Say:** "Customers can search by part name, brand or bike model, and narrow the results with filters."

### Step 5 – Cart (Objective 3)
**Do:**
- Add **Chain Sprocket Kit** and **Engine Oil 20W-40** to the cart.
- Open the cart (top right). Change a quantity with + and −, and remove an item.
- Point out the message about how much more is needed for free delivery (above Rs. 5,000).

### Step 6 – Checkout and payment (Objective 3)
Do this as a **guest** (logged out) to show that guests can also buy.

**Do:**
1. Click **Proceed to checkout**.
2. Type a wrong phone number such as `12345` and click **Place order**. It is refused with a message (validation).
3. Fill in: Name `Hari Shrestha`, Mobile `9841234567`, Email `hari@demo.test`, Address `Rapti Road, Hetauda-10`, Note `Please call before coming`.
4. **City** starts on **Manahari**: the grey line says "Local delivery … Rs. 50". Change **City** to **Hetauda** and a **Ward** list appears. Pick **Ward 19** (Zone 1, Rs. 100), **Ward 10** (Zone 2, Rs. 150), **Ward 8** (Zone 3, Rs. 200) and **Ward 18** (Zone 4, Rs. 250). Each time the grey line shows the zone, distance and charge, and the summary updates. (Placing the order without a ward asks you to choose one.)
5. Choose **eSewa** and click **Place order**.
6. On the eSewa screen, point out the **SANDBOX / TEST MODE** label, then click **Confirm test payment**.

**Say:** "Our shop is in Manahari, so local delivery costs Rs. 50. For Hetauda we estimated the road distance of every ward from Bastipur and made four zones, so the farther the ward, the higher the charge. Customers can pay with eSewa, Khalti or cash on delivery. The payment step runs in sandbox mode, so no real money is used."

### Step 7 – Order confirmation, invoice and tracking (Objective 3)
**Do:**
- On the confirmation page, show the order ID, the **tracking timeline** (Order placed → Packed → On the way → Delivered), the delivery note and the payment status (Paid + transaction number).
- Click **View / print invoice**, then **Print invoice** to show the print layout. Cancel the print.
- In the footer, click **Track your order**. Enter the order ID from the confirmation and phone `9841234567` (or the sample order `MAP-1001` with `9845012345`).
- Try a wrong phone number: nothing is shown, so other people cannot see your order.

### Step 8 – Customer account (Objective 5: registration, login, account)
**Do:**
- Click **Login** → **Create an account**. Register with any name, an email such as `gita@demo.test`, a mobile `98XXXXXXXX` and password `gita123`. (Optionally show the "passwords do not match" error first.)
- In **My account**, show the tabs:
  - **My orders**: order history
  - **Wishlist**: open a product, click the heart ♡, then come back
  - **Profile & address**: change the address and save; change the password
  - **Notifications**: emails from the shop (welcome, order confirmation, status updates)
- Open a product, pick stars, write a review and submit. Then click **Log out**.

**Say:** "Registered customers get order history, saved addresses, a wishlist and email updates. Only logged-in customers can write reviews."

### Step 9 – Admin dashboard (Objective 6)
**Do:**
- Log in as **admin** (button on the login page).
- On the **Dashboard**, show total sales, this week's sales, orders to handle, customers, products, **Sales in the last 7 days**, **Low stock alerts**, **Top selling products** and **Sales by payment method**.
- Click **+10 stock** on one low-stock item.

**Say:** "The shop owner sees everything at a glance and gets an alert when stock runs low."

### Step 10 – Manage products (Objective 6)
**Do:**
- Go to **Products** and click **+ Add product**. Example: Name `Chain Cleaner Spray 500ml`, Category Oil & Filters, Brand `Motul`, SKU `OIL-MT-CC5`, Price `890`, Stock `3`, tick **Universal**, add a description. Save: the product appears in the list and in the shop.
- Change a product's stock directly in the table (type a number and press Tab).
- Click **Edit** on a product, change the price and save.
- **CSV import:** click **Sample CSV** to download a file, then **Import CSV** and choose that file. A message shows how many products were added.
- Tick **Low stock only** to filter the list.

### Step 11 – Manage orders and customers (Objective 6)
**Do:**
- Go to **Orders**. Use the status tabs (Pending, Processing…) and the search box. Point out the yellow ✎ delivery note under Hari's name.
- Move Hari's order forward: **Processing → Shipped → Delivered**. The dropdown only offers the next steps, and once an order is delivered it is locked.
- Open **Email log** to show the email created for each change.
- Cancel a **Pending** order. Its stock goes back, and an eSewa/Khalti payment is marked **Refunded**. (An order that is already shipped can no longer be cancelled.)
- Show **Customers** (orders and total spent per customer) and **Reviews** (delete a review).

**Say:** "Each time the status changes, the customer gets an email. Orders can only move forward, and they can be cancelled only before they are shipped."

### Step 12 – SEO and security (Objective 7 and security requirements)
**SEO, do:**
- Press `Ctrl + U` (view page source). Show the `<title>`, `meta description`, `keywords`, Open Graph (`og:`) tags and the `application/ld+json` structured data (shop address and area served).
- Each page has its own title in the browser tab (e.g. "Chain Sprocket Kit - Rolon | Mama Auto Parts").
- Show the files `sitemap.xml` and `robots.txt` in the folder.

**Security, do:**
- Log in with a wrong password: it is refused.
- Log in as a customer and add `#/admin` to the end of the address: **Access denied**.
- Write a review containing `<script>alert(1)</script>`. It shows as plain text and does not run (XSS protection).

**Say:** "Passwords are stored only as salted SHA-256 hashes, never as plain text, and everything users type is escaped before it is shown. Only the administrator can open the admin panel."

---

## 5. Questions the invigilator may ask

**What technologies did you use?**
> HTML5 for the pages, CSS3 for our own responsive theme, and JavaScript for all the features. Data is stored in JSON form using the browser's Web Storage. Passwords are hashed with SHA-256.

**Your proposal said WordPress. Why did you change?**
> During development we built the store as a single-page web application instead. It gave us full control over features like bike fitment and ward-based delivery charges, and it runs on any computer without installing a server. The data is organised like database tables, so it can be moved to MySQL or WooCommerce later. This is explained in Section 1.5 of our report.

**Where is the data stored?**
> In the browser's local storage, as JSON collections that work like database tables (products, users, orders and so on). Because of this, data is not shared between devices yet. Moving it to a server-side MySQL database is our first future recommendation.

**Is the payment real?**
> No. The eSewa/Khalti step runs in sandbox (test) mode and is clearly labelled, so no real money is taken. Connecting to the live merchant APIs is part of our future work.

**How did you decide the delivery charges?**
> We estimated the road distance from Bastipur (Ward 19, where the highway from Manahari enters Hetauda) to every ward and grouped the 19 wards into four zones: 0–7 km, 7–12 km, 12–18 km and over 18 km. Each zone has a fixed charge (Rs. 100, 150, 200, 250), so customers know the price before ordering. Manahari is local, at Rs. 50.

**Why only Manahari and Hetauda?**
> To keep delivery realistic for a small shop. The shop is in Manahari, so local delivery is cheapest, and Hetauda is the nearest city with the most riders. Same-day delivery is possible in both. More areas can be added by editing the delivery list.

**How do you know a part fits a bike?**
> Each product stores a list of compatible bike models (or "Universal"). The bike finder and the "Will it fit my bike?" check use that list.

**Why are there no real product photos?**
> Each product shows an illustration of its category for now. Adding real photos is listed in our future recommendations.

**How did you test the system?**
> With unit test cases for each module and system test cases for complete journeys (guest purchase, customer account, admin order processing, mobile layout). All the test cases in Chapter 5 of the report passed.

---

## 6. If something goes wrong

| Problem | Fix |
|---|---|
| Page looks plain, with no colours or layout | The `css` or `js` folder is missing. Copy the whole folder, not just `index.html`. |
| Old test orders are showing | Admin → Email log → **Reset data**. |
| Logged in as the wrong person | Click **Logout** at the top right, then log in again. |
| Page is stuck or blank | Press `F5` to reload. Your data is not lost. |
| Cart has old items | Open the cart and remove them, or reset the data. |
| Different browser shows different data | Each browser keeps its own data. Always use the same browser on the day. |

---

## 7. Files in this folder

```
index.html     the page, meta tags and structured data (SEO)
css/style.css  the shop design (works on phones and computers)
js/data.js     products, bike models, categories, delivery zones and wards, sample accounts and orders
js/app.js      all features: shop, cart, checkout, delivery, payments, accounts, admin panel
sitemap.xml    list of pages for search engines
robots.txt     tells search engines which pages to skip
README.md      this guide
```

### Changing data (optional)
- **Products, prices, stock:** use the admin panel, or edit `js/data.js`.
- **Delivery charges:** change the `fee` of each zone in the `zones` list in `js/data.js`. To move a ward to another zone, change the last number in its row in the `wards` list.
- **Free delivery limit:** edit `freeDeliveryAbove` in `js/data.js`.

After editing `js/data.js`, use **Reset data** in the admin panel so the changes show.
