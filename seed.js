require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB, mongoose } = require('./src/db');
const Customer = require('./src/modules/customers/customers.model');
const Product = require('./src/modules/products/products.model');
const Order = require('./src/modules/orders/order.model');
const Complaint = require('./src/modules/complaints/complaint.model');
const { generateOrderId } = require('./src/modules/orders/order.utils');
const upload = require('./src/middlewares/upload');

// Sample customers data
const customers = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1-555-0101",
    address: "123 Main St, New York, NY 10001"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.j@example.com", 
    phone: "+1-555-0102",
    address: "456 Oak Ave, Los Angeles, CA 90210"
  },
  {
    name: "Michael Brown",
    email: "m.brown@example.com",
    phone: "+1-555-0103", 
    address: "789 Pine Rd, Chicago, IL 60601"
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1-555-0104",
    address: "321 Elm St, Houston, TX 77001"
  },
  {
    name: "David Wilson",
    email: "d.wilson@example.com",
    phone: "+1-555-0105",
    address: "654 Maple Dr, Phoenix, AZ 85001"
  }
];

// Sample products data (20 tech products)
const rawProducts = [
  {
    name: "4K Ultra HD Smart TV 55\"",
    description: "Ultra High Definition Smart TV with streaming capabilities and voice control",
    price: 699,
    category: "Electronics",
    tags: ["TV", "Smart Home"],
    imageFile: "TV.png",
    stock: 42
  },
  {
    name: "Wireless Surround Sound System",
    description: "Complete wireless surround sound system for immersive audio experience",
    price: 499,
    category: "Electronics",
    tags: ["Audio", "Home Theater", "TV"],
    imageFile: "Sound System.png",
    stock: 18
  },
  {
    name: "Noise-Canceling Headphones",
    description: "Premium noise-canceling headphones with superior sound quality",
    price: 149,
    category: "Electronics",
    tags: ["Audio", "Travel"],
    imageFile: "Headphones.png",
    stock: 120
  },
  {
    name: "Smart Speaker Mini",
    description: "Compact smart speaker with voice assistant and smart home controls",
    price: 39,
    category: "Electronics",
    tags: ["Audio", "Smart Home"],
    imageFile: "Speaker.png",
    stock: 0
  },
  {
    name: "Gaming Mouse RGB",
    description: "High-precision gaming mouse with customizable RGB lighting",
    price: 59,
    category: "Electronics",
    tags: ["Gaming", "Accessories"],
    imageFile: "Mouse.png",
    stock: 75
  },
  {
    name: "Mechanical Keyboard TKL",
    description: "Tenkeyless mechanical keyboard with tactile switches",
    price: 99,
    category: "Electronics",
    tags: ["Accessories", "Work"],
    imageFile: "Keyboard.png",
    stock: 35
  },
  {
    name: "27\" 144Hz IPS Monitor",
    description: "High refresh rate IPS monitor perfect for gaming and work",
    price: 279,
    category: "Electronics",
    tags: ["Work", "Gaming"],
    imageFile: "Monitor.png",
    stock: 21
  },
  {
    name: "USB-C Docking Station",
    description: "Multi-port docking station with power delivery and display output",
    price: 129,
    category: "Electronics",
    tags: ["Work", "Accessories"],
    imageFile: "USB-C.png",
    stock: 62
  },
  {
    name: "NVMe SSD 1TB",
    description: "High-speed NVMe solid state drive for fast data access",
    price: 109,
    category: "Electronics",
    tags: ["Storage", "PC", "Gaming"],
    imageFile: "NVMe.png",
    stock: 200
  },
  {
    name: "Portable SSD 2TB",
    description: "Ultra-portable external SSD with massive storage capacity",
    price: 179,
    category: "Electronics",
    tags: ["Storage", "Travel", "Accessories"],
    imageFile: "Storage.png",
    stock: 97
  },
  {
    name: "Smart LED Light Strip",
    description: "Color-changing LED light strip with smart home integration",
    price: 29,
    category: "Electronics",
    tags: ["Smart Home", "Lighting"],
    imageFile: "Light.png",
    stock: 300
  },
  {
    name: "Robot Vacuum Basic",
    description: "Automated robot vacuum for effortless floor cleaning",
    price: 199,
    category: "Electronics",
    tags: ["Smart Home", "Cleaning"],
    imageFile: "Vacum.png",
    stock: 13
  },
  {
    name: "Action Camera 4K",
    description: "Compact 4K action camera for adventure and sports recording",
    price: 249,
    category: "Electronics",
    tags: ["Camera", "Outdoor", "Travel"],
    imageFile: "Camera.png",
    stock: 41
  },
  {
    name: "Mirrorless Camera Lens 35mm",
    description: "Professional 35mm lens for mirrorless camera systems",
    price: 349,
    category: "Electronics",
    tags: ["Camera", "Lens", "Travel"],
    imageFile: "Lens.png",
    stock: 9
  },
  {
    name: "Wireless Charger Stand",
    description: "Fast wireless charging stand compatible with most smartphones",
    price: 24,
    category: "Electronics",
    tags: ["Mobile", "Accessories"],
    imageFile: "Wireless.png",
    stock: 140
  },
  {
    name: "Smartwatch Fitness",
    description: "Fitness-focused smartwatch with health monitoring features",
    price: 129,
    category: "Electronics",
    tags: ["Wearables", "Fitness", "Travel"],
    imageFile: "Watch.png",
    stock: 58
  },
  {
    name: "Bluetooth Tracker 4-Pack",
    description: "Set of 4 Bluetooth item trackers for finding lost objects",
    price: 49,
    category: "Electronics",
    tags: ["Mobile", "Travel"],
    imageFile: "Bluetooth.png",
    stock: 260
  },
  {
    name: "E-Reader 7\"",
    description: "Large screen e-reader with adjustable lighting and long battery life",
    price: 139,
    category: "Electronics",
    tags: ["Reading", "Mobile", "Smart Home"],
    imageFile: "Reader.png",
    stock: 44
  },
  {
    name: "Smart Thermostat",
    description: "Programmable smart thermostat with energy-saving features",
    price: 169,
    category: "Electronics",
    tags: ["Smart Home", "Energy"],
    imageFile: "Thermo.png",
    stock: 26
  },
  {
    name: "Wi-Fi 6 Router",
    description: "Next-generation Wi-Fi 6 router for fast and reliable internet",
    price: 159,
    category: "Electronics",
    tags: ["Networking", "Smart Home"],
    imageFile: "WIFI.png",
    stock: 70
  }
];

const seedUploadSubDir = upload.SEED_UPLOAD_SUBDIR;

const productSeedData = rawProducts.map(({ imageFile, ...product }) => ({
  ...product,
  imageUrl: upload.getPublicUrl(imageFile, seedUploadSubDir)
}));

const placeholderImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0W2p8AAAAASUVORK5CYII=';
const placeholderBuffer = Buffer.from(placeholderImageBase64, 'base64');

const daysAgo = (days) => new Date(Date.now() - Math.abs(days) * 24 * 60 * 60 * 1000);

function resolveSeedSourceDir() {
  const configuredPath = process.env.SEED_IMAGE_SOURCE_DIR;
  if (configuredPath) {
    const resolved = path.resolve(configuredPath);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
      return resolved;
    }
    console.warn(`⚠️ Seed image directory not found: ${resolved}`);
  }

  const fallback = path.join(__dirname, 'seed-img');
  if (fs.existsSync(fallback) && fs.statSync(fallback).isDirectory()) {
    return fallback;
  }

  console.warn('⚠️ No seed image directory available; placeholders will be used.');
  return null;
}

function buildSourceIndex(dir) {
  const index = new Map();
  try {
    const entries = fs.readdirSync(dir);
    entries.forEach((entry) => {
      const entryPath = path.join(dir, entry);
      try {
        if (fs.statSync(entryPath).isFile()) {
          index.set(entry.toLowerCase(), entry);
        }
      } catch (error) {
        console.warn(`⚠️ Unable to inspect seed image: ${entry}`, error.message);
      }
    });
  } catch (error) {
    console.warn(`⚠️ Failed to read seed image directory: ${dir}`, error.message);
  }
  return index;
}

function prepareSeedImages() {
  upload.ensureUploadDir(seedUploadSubDir);
  const sourceDir = resolveSeedSourceDir();
  const sourceIndex = sourceDir ? buildSourceIndex(sourceDir) : new Map();

  rawProducts.forEach(({ imageFile }) => {
    if (!imageFile) return;

    const destinationPath = upload.resolveUploadPath(seedUploadSubDir, imageFile);

    if (sourceDir) {
      const matchedName = sourceIndex.get(imageFile.toLowerCase());
      if (matchedName) {
        const sourcePath = path.join(sourceDir, matchedName);
        try {
          fs.copyFileSync(sourcePath, destinationPath);
          console.log(`🖼️ Copied seed image: ${matchedName}`);
          return;
        } catch (error) {
          console.warn(`⚠️ Failed to copy seed image ${matchedName}:`, error.message);
        }
      } else {
        console.warn(`⚠️ Seed image not found for ${imageFile}; using placeholder.`);
      }
    }

    if (!fs.existsSync(destinationPath)) {
      fs.writeFileSync(destinationPath, placeholderBuffer);
      console.log(`ℹ️ Created placeholder image: ${imageFile}`);
    }
  });
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    prepareSeedImages();
    
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-api';
    await connectDB(mongoUri);
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Complaint.deleteMany({});
    
    // Insert customers
    console.log('👥 Inserting customers...');
    const insertedCustomers = await Customer.insertMany(customers);
    console.log(`✅ Inserted ${insertedCustomers.length} customers`);
    
    // Insert products
    console.log('📦 Inserting products...');
    const insertedProducts = await Product.insertMany(productSeedData);
    console.log(`✅ Inserted ${insertedProducts.length} products`);
    
    // Create some sample orders
    console.log('🛒 Creating sample orders...');
    const sampleOrders = [
      {
        orderId: generateOrderId(),
        customerId: insertedCustomers[0]._id,
        items: [
          {
            productId: insertedProducts[0]._id, // 4K Ultra HD Smart TV
            name: insertedProducts[0].name,
            price: insertedProducts[0].price,
            quantity: 1
          },
          {
            productId: insertedProducts[4]._id, // Gaming Mouse RGB
            name: insertedProducts[4].name, 
            price: insertedProducts[4].price,
            quantity: 2
          }
        ],
        total: insertedProducts[0].price + (insertedProducts[4].price * 2),
        status: 'DELIVERED',
        carrier: 'DHL',
        estimatedDelivery: daysAgo(1)
      },
      {
        orderId: generateOrderId(),
        customerId: insertedCustomers[1]._id,
        items: [
          {
            productId: insertedProducts[2]._id, // Noise-Canceling Headphones
            name: insertedProducts[2].name,
            price: insertedProducts[2].price,
            quantity: 1
          }
        ],
        total: insertedProducts[2].price,
        status: 'DELIVERED',
        carrier: 'FedEx',
        estimatedDelivery: daysAgo(2)
      },
      {
        orderId: generateOrderId(),
        customerId: insertedCustomers[2]._id,
        items: [
          {
            productId: insertedProducts[6]._id, // 27" 144Hz IPS Monitor
            name: insertedProducts[6].name,
            price: insertedProducts[6].price,
            quantity: 1
          },
          {
            productId: insertedProducts[8]._id, // NVMe SSD 1TB
            name: insertedProducts[8].name,
            price: insertedProducts[8].price,
            quantity: 1
          }
        ],
        total: insertedProducts[6].price + insertedProducts[8].price,
        status: 'DELIVERED',
        carrier: 'FedEx',
        estimatedDelivery: daysAgo(3)
      },
      {
        orderId: generateOrderId(),
        customerId: insertedCustomers[3]._id,
        items: [
          {
            productId: insertedProducts[15]._id, // Smartwatch Fitness
            name: insertedProducts[15].name,
            price: insertedProducts[15].price,
            quantity: 1
          }
        ],
        total: insertedProducts[15].price,
        status: 'DELIVERED',
        carrier: 'UPS',
        estimatedDelivery: daysAgo(1)
      },
      {
        orderId: generateOrderId(),
        customerId: insertedCustomers[4]._id,
        items: [
          {
            productId: insertedProducts[10]._id, // Smart LED Light Strip
            name: insertedProducts[10].name,
            price: insertedProducts[10].price,
            quantity: 3
          },
          {
            productId: insertedProducts[14]._id, // Wireless Charger Stand
            name: insertedProducts[14].name,
            price: insertedProducts[14].price,
            quantity: 2
          }
        ],
        total: (insertedProducts[10].price * 3) + (insertedProducts[14].price * 2),
        status: 'DELIVERED',
        carrier: 'UPS',
        estimatedDelivery: daysAgo(4)
      }
    ];
    
    const insertedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ Inserted ${insertedOrders.length} orders`);
    
    // Update product stock based on orders
    for (const order of insertedOrders) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } }
        );
      }
    }
    
    console.log('✅ Updated product stock levels');
    
    // Seed complaints
    console.log('\n💬 Seeding complaints...');
    
    const sampleComplaints = [
      {
        userId: insertedCustomers[0]._id.toString(),
        orderId: insertedOrders[0].orderId,
        complaint: "The TV I ordered arrived with a cracked screen. Very disappointed with the packaging.",
        category: 'damaged_item',
        priority: 'high',
        status: 'in_progress',
        source: 'web',
        createdAt: daysAgo(5)
      },
      {
        userId: insertedCustomers[1]._id.toString(),
        orderId: insertedOrders[1].orderId,
        complaint: "I ordered noise-canceling headphones but the box was empty when I opened it!",
        category: 'wrong_item',
        priority: 'high',
        status: 'open',
        source: 'ai_assistant',
        createdAt: daysAgo(3)
      },
      {
        userId: insertedCustomers[2]._id.toString(),
        orderId: insertedOrders[2].orderId,
        complaint: "My order was supposed to arrive 5 days ago but still hasn't shipped. What's going on?",
        category: 'late_delivery',
        priority: 'medium',
        status: 'resolved',
        source: 'email',
        resolution: 'Order was expedited with express shipping at no extra cost. Customer received order next day.',
        resolvedAt: daysAgo(1),
        createdAt: daysAgo(4)
      },
      {
        userId: insertedCustomers[3]._id.toString(),
        orderId: insertedOrders[3].orderId,
        complaint: "The LED light strips I received are flickering constantly. Unusable!",
        category: 'damaged_item',
        priority: 'medium',
        status: 'resolved',
        source: 'phone',
        resolution: 'Replacement sent under warranty. Customer satisfied.',
        resolvedAt: daysAgo(2),
        createdAt: daysAgo(8)
      },
      {
        userId: insertedCustomers[4]._id.toString(),
        orderId: insertedOrders[4].orderId,
        complaint: "Customer service was extremely rude when I called about my order. Not acceptable.",
        category: 'poor_service',
        priority: 'urgent',
        status: 'resolved',
        source: 'phone',
        resolution: 'Apologized to customer, provided 20% discount on next order. Retrained staff member.',
        resolvedAt: daysAgo(3),
        createdAt: daysAgo(7)
      },
      {
        userId: insertedCustomers[0]._id.toString(),
        orderId: null,
        complaint: "I can't log into my account. Keep getting 'invalid credentials' error even with correct password.",
        category: 'general',
        priority: 'low',
        status: 'resolved',
        source: 'web',
        resolution: 'Password reset link sent. Customer able to log in successfully.',
        resolvedAt: daysAgo(1),
        createdAt: daysAgo(2)
      },
      {
        userId: insertedCustomers[1]._id.toString(),
        orderId: insertedOrders[1].orderId,
        complaint: "The headphones sound quality is terrible. Not worth $149!",
        category: 'general',
        priority: 'low',
        status: 'closed',
        source: 'ai_assistant',
        resolution: 'Explained premium features. Offered return if unsatisfied within 30 days.',
        resolvedAt: daysAgo(5),
        createdAt: daysAgo(6)
      },
      {
        userId: insertedCustomers[2]._id.toString(),
        orderId: null,
        complaint: "Why does shipping cost so much? Competitors offer free shipping on all orders.",
        category: 'general',
        priority: 'low',
        status: 'open',
        source: 'web',
        createdAt: daysAgo(1)
      },
      {
        userId: insertedCustomers[3]._id.toString(),
        orderId: null,
        complaint: "Website keeps crashing when I try to checkout. Very frustrating!",
        category: 'general',
        priority: 'medium',
        status: 'in_progress',
        source: 'web',
        createdAt: daysAgo(2)
      },
      {
        userId: insertedCustomers[4]._id.toString(),
        orderId: insertedOrders[4].orderId,
        complaint: "One of the wireless chargers was missing from my order. Only received 1 instead of 2.",
        category: 'wrong_item',
        priority: 'high',
        status: 'open',
        source: 'email',
        createdAt: daysAgo(1)
      }
    ];
    
    const insertedComplaints = await Complaint.insertMany(sampleComplaints);
    console.log(`✅ Inserted ${insertedComplaints.length} complaints`);
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Print summary
    console.log('\n📊 Database Summary:');
    console.log(`👥 Customers: ${await Customer.countDocuments()}`);
    console.log(`📦 Products: ${await Product.countDocuments()}`);
    console.log(`🛒 Orders: ${await Order.countDocuments()}`);
    console.log(`💬 Complaints: ${await Complaint.countDocuments()}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();