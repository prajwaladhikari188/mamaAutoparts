/* Mama Auto Parts - store data (products, bikes, categories, delivery areas, sample accounts and orders).
   Everything here is loaded into the browser's storage the first time the site opens.
   "Reset data" in the admin panel (Email log) loads it again. */

window.MAP_DATA = {
  bikes: [
    { brand: "Bajaj", models: [
      { id: "pulsar150", name: "Pulsar 150" },
      { id: "ns200", name: "Pulsar NS200" },
      { id: "platina", name: "Platina 110" } ] },
    { brand: "Honda", models: [
      { id: "shine", name: "Shine 125" },
      { id: "unicorn", name: "Unicorn 160" },
      { id: "dio", name: "Dio" } ] },
    { brand: "Yamaha", models: [
      { id: "fz", name: "FZ-S V3" },
      { id: "r15", name: "R15 V4" },
      { id: "rayzr", name: "Ray ZR" } ] },
    { brand: "TVS", models: [
      { id: "apache160", name: "Apache RTR 160 4V" },
      { id: "ntorq", name: "Ntorq 125" } ] },
    { brand: "Hero", models: [
      { id: "splendor", name: "Splendor Plus" },
      { id: "xpulse", name: "Xpulse 200 4V" } ] },
    { brand: "Royal Enfield", models: [
      { id: "classic350", name: "Classic 350" } ] }
  ],

  categories: [
    { id: "brakes", name: "Brakes" },
    { id: "engine", name: "Engine Parts", short: "Engine" },
    { id: "transmission", name: "Chain & Transmission", short: "Chain & Sprocket" },
    { id: "electrical", name: "Electrical & Lighting", short: "Electrical" },
    { id: "oil", name: "Oil & Filters" },
    { id: "tyres", name: "Tyres & Wheels", short: "Tyres" },
    { id: "body", name: "Body Parts" },
    { id: "gear", name: "Riding Gear & Accessories", short: "Riding Gear" }
  ],

  // Delivery only in Manahari (where the shop is) and the 19 wards of Hetauda Sub-Metropolitan City.
  // Hetauda wards are grouped into 4 zones by road distance from Bastipur (Ward 19),
  // the first part of Hetauda on the highway from Manahari. Charges are in NPR.
  // Orders above freeDeliveryAbove are delivered free.
  zones: [
    { id: 0, name: "Local", range: "Manahari", fee: 50, time: "Same day" },
    { id: 1, name: "Zone 1", range: "0 - 7 km", fee: 100, time: "Same day", note: "Bastipur and the western corridor" },
    { id: 2, name: "Zone 2", range: "7.1 - 12 km", fee: 150, time: "Same day", note: "Central bazaar and main Padampokhari" },
    { id: 3, name: "Zone 3", range: "12.1 - 18 km", fee: 200, time: "Same day", note: "Outer urban, industrial and ring wards" },
    { id: 4, name: "Zone 4", range: "Over 18 km", fee: 250, time: "Same day or next morning", note: "Far south and eastern foothills" }
  ],
  // [id, ward, area / landmark, distance from Bastipur, zone]
  wards: [
    ["manahari", null, "Manahari (local delivery)", "", 0],
    ["h19", 19, "Bastipur / Basti / Jyotinagar", "0 - 3 km", 1],
    ["h3", 3, "Basamadi / Lewat", "~3.7 km", 1],
    ["h12", 12, "Padampokhari West (across Rapti)", "~5.3 km", 1],
    ["h11", 11, "Nawalpur", "~6.5 km", 1],
    ["h13", 13, "Padampokhari", "~8.4 km", 2],
    ["h10", 10, "Bus Park / TCN / Rapti Road", "~9.9 km", 2],
    ["h2", 2, "Sub-Metropolitan Office / Chowkitole", "~10.9 km", 2],
    ["h4", 4, "Buddha Chowk / Hupra Chaur", "~11.0 km", 2],
    ["h5", 5, "Piple / Sano Pokhara", "~12.1 km", 3],
    ["h9", 9, "Pashupatinagar / Industrial District", "~13.4 km", 3],
    ["h1", 1, "Chaukidanda / Nakka", "~14.4 km", 3],
    ["h6", 6, "Chaughada / Gauritar corridor", "~14.5 km", 3],
    ["h7", 7, "Nagaswoti", "~15.4 km", 3],
    ["h8", 8, "Kamane", "~15.6 km", 3],
    ["h14", 14, "Mayurdhap", "~15.7 km", 3],
    ["h15", 15, "Ratomate / Churiyamai", "~18.5 km", 4],
    ["h16", 16, "Hatiya / Chisapani", "~19.0 km", 4],
    ["h17", 17, "Hatiya / Rajdevi", "~20.9 km", 4],
    ["h18", 18, "Harnamadi / Phurkechaur", "~26.2 km", 4]
  ],
  delivery: [],
  freeDeliveryAbove: 5000,
  lowStockLimit: 5,

  products: [
    { id: "p01", name: "Front Brake Pad Set", cat: "brakes", brand: "Endurance", sku: "BRK-EN-101", price: 650, oldPrice: 750, stock: 24, fits: ["pulsar150", "ns200", "apache160", "fz"], sold: 58,
      desc: "Semi-metallic front disc brake pads with good bite and low dust. Comes as a pair, ready to fit.", specs: { Position: "Front", Type: "Semi-metallic", "Pack": "2 pads" } },
    { id: "p02", name: "Rear Brake Shoe Set", cat: "brakes", brand: "Endurance", sku: "BRK-EN-205", price: 420, stock: 40, fits: ["shine", "splendor", "platina", "unicorn", "dio", "rayzr", "ntorq"], sold: 91,
      desc: "Drum brake shoes for the rear wheel. Asbestos-free lining that lasts long in city riding.", specs: { Position: "Rear", Type: "Drum shoe", "Pack": "2 shoes" } },
    { id: "p03", name: "Front Disc Rotor 260mm", cat: "brakes", brand: "Bajaj Genuine", sku: "BRK-BJ-260", price: 2850, stock: 6, fits: ["pulsar150", "ns200"], sold: 9,
      desc: "Original 260mm front brake disc. Replace when the disc is worn below minimum thickness or warped.", specs: { Diameter: "260 mm", Position: "Front", Material: "Stainless steel" } },
    { id: "p04", name: "Adjustable Brake & Clutch Lever Pair", cat: "brakes", brand: "Mama Select", sku: "BRK-MS-410", price: 1450, stock: 9, fits: ["fz", "r15", "apache160", "ns200"], sold: 17,
      desc: "CNC aluminium levers with 6-step reach adjustment. Bolt-on fit, no modification needed.", specs: { Material: "CNC aluminium", Adjustment: "6 positions", Colour: "Black / Red" } },

    { id: "p05", name: "Spark Plug CPR8EA-9", cat: "engine", brand: "NGK", sku: "ENG-NGK-008", price: 450, stock: 60, fits: ["fz", "r15", "rayzr", "apache160", "ntorq", "dio", "shine", "unicorn"], sold: 132,
      desc: "Standard nickel spark plug. Recommended change every 8,000-10,000 km for smooth starting and mileage.", specs: { Type: "Nickel", Gap: "0.8-0.9 mm", Thread: "10 mm" } },
    { id: "p06", name: "Iridium Spark Plug", cat: "engine", brand: "NGK", sku: "ENG-NGK-IR2", price: 1250, stock: 15, fits: ["pulsar150", "ns200", "classic350"], sold: 34,
      desc: "Iridium tip plug for quicker starts and a stronger spark. Lasts about three times longer than a standard plug.", specs: { Type: "Iridium", Life: "~30,000 km" } },
    { id: "p07", name: "Piston Kit (Standard Size)", cat: "engine", brand: "Honda Genuine", sku: "ENG-HN-PK1", price: 3600, stock: 4, fits: ["shine"], sold: 6,
      desc: "Complete piston kit with rings, pin and clips for engine overhaul.", specs: { Size: "STD", Includes: "Piston, rings, pin, clips" } },
    { id: "p08", name: "Clutch Plate Set", cat: "engine", brand: "Bajaj Genuine", sku: "ENG-BJ-CP5", price: 1850, stock: 11, fits: ["pulsar150", "ns200"], sold: 22,
      desc: "Friction plate set. Fix clutch slipping and poor pickup.", specs: { Plates: "5 friction plates" } },

    { id: "p09", name: "Clutch Cable", cat: "transmission", brand: "Hero Genuine", sku: "TRN-HR-CC1", price: 380, stock: 30, fits: ["splendor", "xpulse"], sold: 45,
      desc: "Original clutch cable with smooth inner wire and correct length.", specs: { Type: "Clutch cable" } },
    { id: "p10", name: "Chain Sprocket Kit", cat: "transmission", brand: "Rolon", sku: "TRN-RL-150", price: 2650, oldPrice: 2900, stock: 14, fits: ["pulsar150"], sold: 39,
      desc: "Complete chain, front and rear sprocket set. Always replace all three together for a longer life.", specs: { Chain: "428H", Teeth: "14T / 42T", Links: "128" } },
    { id: "p11", name: "O-Ring Chain Sprocket Kit", cat: "transmission", brand: "Rolon", sku: "TRN-RL-ORX", price: 4950, stock: 3, fits: ["ns200", "apache160"], sold: 12,
      desc: "Sealed O-ring chain kit. Needs less lubrication and lasts longer than a normal chain.", specs: { Chain: "520 O-ring", Type: "Sealed" } },
    { id: "p12", name: "Chain Sprocket Kit (Commuter)", cat: "transmission", brand: "Rolon", sku: "TRN-RL-100", price: 2350, stock: 18, fits: ["splendor", "platina", "shine"], sold: 64,
      desc: "Everyday chain kit for 100-125cc commuter bikes.", specs: { Chain: "428", Teeth: "14T / 41T" } },
    { id: "p13", name: "CVT Drive Belt", cat: "transmission", brand: "Bando", sku: "TRN-BD-CVT", price: 1650, stock: 10, fits: ["dio", "rayzr", "ntorq"], sold: 19,
      desc: "Variator drive belt for scooters. Replace if you notice slipping or poor acceleration.", specs: { Type: "Kevlar-reinforced" } },

    { id: "p14", name: "Battery 12V 5Ah (Maintenance Free)", cat: "electrical", brand: "Exide", sku: "ELC-EX-5MF", price: 3450, stock: 12, fits: ["pulsar150", "unicorn", "apache160", "fz", "ns200"], sold: 28,
      desc: "Sealed maintenance-free battery. Comes charged and ready to fit. 24 months warranty.", specs: { Voltage: "12 V", Capacity: "5 Ah", Warranty: "24 months" } },
    { id: "p15", name: "Battery 12V 3Ah", cat: "electrical", brand: "Exide", sku: "ELC-EX-3MF", price: 2250, stock: 20, fits: ["shine", "splendor", "platina", "dio", "rayzr", "ntorq"], sold: 41,
      desc: "Battery for commuter bikes and scooters. 18 months warranty.", specs: { Voltage: "12 V", Capacity: "3 Ah", Warranty: "18 months" } },
    { id: "p16", name: "LED Headlight Bulb H4", cat: "electrical", brand: "Philips", sku: "ELC-PH-H4L", price: 1850, stock: 25, fits: ["universal"], sold: 73,
      desc: "Bright white LED headlight bulb with high and low beam. Fits any bike with an H4 holder.", specs: { Fitting: "H4", Colour: "6000K white" } },
    { id: "p17", name: "LED Indicator Set (4 pcs)", cat: "electrical", brand: "Mama Select", sku: "ELC-MS-IND", price: 950, stock: 0, fits: ["universal"], sold: 26,
      desc: "Compact LED indicators with universal mounting. Use a flasher relay for the correct blink rate.", specs: { Pack: "4 pieces", Voltage: "12 V" } },

    { id: "p18", name: "Engine Oil 20W-40 (1 L)", cat: "oil", brand: "Motul 3100", sku: "OIL-MT-2040", price: 1050, stock: 50, fits: ["universal"], sold: 156,
      desc: "Semi-synthetic 4-stroke engine oil, suitable for most commuter and sports bikes.", specs: { Grade: "20W-40", Volume: "1 litre", Type: "Semi-synthetic" } },
    { id: "p19", name: "Engine Oil 10W-30 Synthetic (1 L)", cat: "oil", brand: "Castrol Power1", sku: "OIL-CS-1030", price: 1350, stock: 35, fits: ["universal"], sold: 88,
      desc: "Fully synthetic oil for better protection at high RPM.", specs: { Grade: "10W-30", Volume: "1 litre", Type: "Fully synthetic" } },
    { id: "p20", name: "Air Filter", cat: "oil", brand: "Yamaha Genuine", sku: "OIL-YM-AF1", price: 550, stock: 8, fits: ["fz"], sold: 21,
      desc: "Original paper air filter. Change every 10,000 km or sooner in dusty roads.", specs: { Type: "Paper element" } },
    { id: "p21", name: "Oil Filter", cat: "oil", brand: "Bajaj Genuine", sku: "OIL-BJ-OF1", price: 280, stock: 26, fits: ["pulsar150", "ns200"], sold: 47,
      desc: "Replace with every oil change.", specs: { Type: "Paper cartridge" } },
    { id: "p22", name: "Air Filter", cat: "oil", brand: "Royal Enfield Genuine", sku: "OIL-RE-AF3", price: 950, stock: 2, fits: ["classic350"], sold: 8,
      desc: "Original air filter element for Classic 350 (J-series engine).", specs: { Type: "Paper element" } },

    { id: "p23", name: "Rear Tyre 100/90-17 Tubeless", cat: "tyres", brand: "MRF Nylogrip Zapper", sku: "TYR-MRF-100", price: 4650, stock: 7, fits: ["pulsar150", "unicorn", "apache160"], sold: 15,
      desc: "Tubeless rear tyre with good wet grip for city and highway.", specs: { Size: "100/90-17", Type: "Tubeless", Position: "Rear" } },
    { id: "p24", name: "Front Tyre 90/90-17 Tubeless", cat: "tyres", brand: "CEAT Zoom", sku: "TYR-CT-090", price: 3650, stock: 9, fits: ["pulsar150", "fz", "apache160"], sold: 13,
      desc: "Tubeless front tyre with a sporty tread pattern.", specs: { Size: "90/90-17", Type: "Tubeless", Position: "Front" } },
    { id: "p25", name: "Scooter Tyre 90/100-10", cat: "tyres", brand: "TVS Eurogrip", sku: "TYR-TV-S10", price: 2950, stock: 13, fits: ["dio", "ntorq", "rayzr"], sold: 18,
      desc: "Tubeless scooter tyre, fits front or rear.", specs: { Size: "90/100-10", Type: "Tubeless" } },

    { id: "p26", name: "Rear View Mirror Set", cat: "body", brand: "Mama Select", sku: "BDY-MS-MIR", price: 650, stock: 22, fits: ["universal"], sold: 52,
      desc: "Pair of mirrors with 10mm thread. Adapter included for left-hand thread bikes.", specs: { Thread: "10 mm", Pack: "Pair" } },
    { id: "p27", name: "Front Mudguard", cat: "body", brand: "Honda Genuine", sku: "BDY-HN-FMG", price: 1250, stock: 5, fits: ["shine"], sold: 7,
      desc: "Original front mudguard, unpainted black.", specs: { Colour: "Black" } },
    { id: "p28", name: "Waterproof Seat Cover", cat: "body", brand: "Mama Select", sku: "BDY-MS-SCV", price: 750, stock: 30, fits: ["universal"], sold: 61,
      desc: "Elastic waterproof seat cover. Keeps the seat dry in the monsoon.", specs: { Material: "PU leather", Fit: "Universal elastic" } },
    { id: "p29", name: "Crash Guard", cat: "body", brand: "Mama Select", sku: "BDY-MS-CRG", price: 3200, stock: 4, fits: ["classic350", "xpulse"], sold: 10,
      desc: "Heavy-duty steel crash guard with powder coating.", specs: { Material: "Mild steel, powder coated" } },

    { id: "p30", name: "Full Face Helmet (DOT)", cat: "gear", brand: "Steelbird", sku: "GER-SB-FF1", price: 4500, oldPrice: 4999, stock: 10, fits: ["universal"], sold: 37,
      desc: "DOT certified full face helmet with clear visor and removable washable lining.", specs: { Certification: "DOT", Sizes: "M / L / XL" } },
    { id: "p31", name: "Riding Gloves", cat: "gear", brand: "Rynox", sku: "GER-RX-GLV", price: 2400, stock: 15, fits: ["universal"], sold: 29,
      desc: "Breathable riding gloves with knuckle protection and touchscreen fingertips.", specs: { Sizes: "M / L / XL" } },
    { id: "p32", name: "Mobile Holder with USB Charger", cat: "gear", brand: "Mama Select", sku: "GER-MS-MOB", price: 1450, stock: 18, fits: ["universal"], sold: 44,
      desc: "Handlebar phone holder with a waterproof USB charging port.", specs: { Output: "5V 2A USB", Mount: "Handlebar" } }
  ],

  users: [
    { id: "u1", name: "Shop Admin", email: "admin@mamaautoparts.test", password: "admin123", role: "admin", phone: "9800000000", area: "manahari", address: "Bhundrung, Manahari-3" },
    { id: "u2", name: "Ram Thapa", email: "ram@demo.test", password: "ram123", role: "customer", phone: "9845012345", area: "manahari", address: "Manahari-5, near the bazaar" },
    { id: "u3", name: "Sita Gurung", email: "sita@demo.test", password: "sita123", role: "customer", phone: "9812345678", area: "h10", address: "Hetauda-10, near the Bus Park" },
    { id: "u4", name: "Bikash Rai", email: "bikash@demo.test", password: "bikash123", role: "customer", phone: "9801122334", area: "h15", address: "Hetauda-15, Ratomate" }
  ],

  reviews: [
    { pid: "p10", user: "u2", rating: 5, text: "Fitted on my Pulsar 150 without any problem. Chain noise is gone. Cheaper than what I paid last time at the shop." },
    { pid: "p10", user: "u4", rating: 4, text: "Good quality kit. It was delivered the same evening." },
    { pid: "p18", user: "u3", rating: 5, text: "Genuine Motul, sealed bottle. Will order again." },
    { pid: "p05", user: "u2", rating: 4, text: "Bike starts easily in the morning now." },
    { pid: "p30", user: "u4", rating: 5, text: "Comfortable helmet, visor is very clear." },
    { pid: "p14", user: "u3", rating: 3, text: "Battery is fine but the box was a bit damaged." }
  ],

  // past orders so the admin dashboard has something to show: [user, daysAgo, items[[pid, qty]], area, payment, status]
  orders: [
    ["u2", 9, [["p10", 1], ["p21", 1]], "manahari", "esewa", "Delivered"],
    ["u3", 8, [["p18", 2]], "h10", "cod", "Delivered"],
    ["u4", 7, [["p30", 1], ["p31", 1]], "h15", "khalti", "Delivered"],
    ["u2", 6, [["p05", 1], ["p18", 1]], "manahari", "cod", "Delivered"],
    ["u3", 5, [["p14", 1]], "h10", "esewa", "Delivered"],
    ["u4", 4, [["p11", 1]], "h15", "khalti", "Shipped"],
    ["u2", 3, [["p28", 1], ["p26", 1]], "h3", "cod", "Shipped"],
    ["u3", 2, [["p02", 2], ["p15", 1]], "h10", "esewa", "Processing"],
    ["u4", 1, [["p16", 1]], "h15", "cod", "Processing"],
    ["u2", 0, [["p01", 1], ["p19", 1]], "manahari", "khalti", "Pending"]
  ]
};

// Turn the ward table into the delivery list the app uses.
window.MAP_DATA.delivery = window.MAP_DATA.wards.map(function (w) {
  var z = window.MAP_DATA.zones[w[4]];
  return {
    id: w[0], ward: w[1], place: w[2], km: w[3], zone: z.id,
    name: w[1] ? "Hetauda-" + w[1] + " (" + w[2] + ")" : w[2],
    fee: z.fee, time: z.time
  };
});
