import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456',
  port: 5432,
});

// Comprehensive image mappings by category and product type
const categoryImages = {
  Electronics: {
    laptop: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800'
    ],
    computer: [
      'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
      'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800'
    ],
    headphone: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
      'https://images.unsplash.com/photo-1545127398-14699f92334b?w=800'
    ],
    mouse: [
      'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800',
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800'
    ],
    keyboard: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'
    ],
    watch: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800'
    ],
    phone: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
      'https://images.unsplash.com/photo-1592286927505-4fd30144e293?w=800'
    ],
    tablet: [
      'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800',
      'https://images.unsplash.com/photo-1585790050230-5dd28404f27e?w=800'
    ],
    camera: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800'
    ],
    speaker: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800'
    ],
    tv: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
      'https://images.unsplash.com/photo-1593359863503-f598bb35c1c8?w=800'
    ],
    monitor: [
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
      'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800'
    ]
  },
  Fashion: {
    shoes: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'
    ],
    shirt: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'
    ],
    jacket: [
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'
    ],
    jeans: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
      'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800'
    ],
    dress: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'
    ],
    backpack: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800'
    ],
    wallet: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
      'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800'
    ],
    sunglasses: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800'
    ],
    hat: [
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800',
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'
    ]
  },
  'Home & Garden': {
    chair: [
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800',
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800',
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800'
    ],
    table: [
      'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800',
      'https://images.unsplash.com/photo-1543489822-c49534f3271f?w=800'
    ],
    lamp: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800'
    ],
    sofa: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800'
    ],
    bed: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
    ],
    coffee: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'
    ],
    kitchen: [
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'
    ],
    garden: [
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800'
    ],
    plant: [
      'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800',
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800'
    ],
    curtain: [
      'https://images.unsplash.com/photo-1520222984843-df35ebc0f24d?w=800',
      'https://images.unsplash.com/photo-1599619965122-c0f0c806eb8f?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800'
    ]
  },
  Books: {
    fiction: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'
    ],
    novel: [
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800',
      'https://images.unsplash.com/photo-1550399504-8953e1a1efb4?w=800'
    ],
    cooking: [
      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'
    ],
    cookbook: [
      'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800',
      'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800'
    ],
    biography: [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800'
    ],
    textbook: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
      'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800'
    ]
  },
  Sports: {
    yoga: [
      'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'
    ],
    dumbbell: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800'
    ],
    gym: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
    ],
    ball: [
      'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800'
    ],
    bicycle: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800',
      'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=800'
    ],
    tennis: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800'
    ],
    swimming: [
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
      'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800'
    ],
    running: [
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
      'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
    ]
  },
  Beauty: {
    skincare: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800',
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800'
    ],
    makeup: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800'
    ],
    perfume: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59df9?w=800'
    ],
    lipstick: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800',
      'https://images.unsplash.com/photo-1583241800698-c368cd3e5f47?w=800'
    ],
    shampoo: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800',
      'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=800'
    ],
    cream: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800',
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800'
    ],
    serum: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800'
    ],
    default: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800',
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800'
    ]
  }
};

function findBestImages(productName, category) {
  const name = productName.toLowerCase();
  const categoryMap = categoryImages[category] || {};

  // Try to find specific product type match
  for (const [key, images] of Object.entries(categoryMap)) {
    if (name.includes(key)) {
      return images.slice(0, 2); // Return up to 2 images
    }
  }

  // Fall back to category default
  if (categoryMap.default) {
    return categoryMap.default.slice(0, 2);
  }

  // Ultimate fallback - generic product image
  return ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];
}

async function updateProductImages() {
  const client = await pool.connect();
  try {
    console.log('🔍 Fetching all products from database...\n');

    const result = await client.query('SELECT id, name, category, images FROM products ORDER BY category, name');
    console.log(`📦 Found ${result.rows.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of result.rows) {
      const currentImages = product.images || [];
      const newImages = findBestImages(product.name, product.category);

      // Check if images are different
      const imagesChanged = JSON.stringify(currentImages) !== JSON.stringify(newImages);

      if (imagesChanged) {
        await client.query(
          'UPDATE products SET images = $1 WHERE id = $2',
          [newImages, product.id]
        );

        console.log(`✅ [${product.category}] ${product.name}`);
        console.log(`   └─ Updated with ${newImages.length} image(s)`);
        updatedCount++;
      } else {
        console.log(`⏭️  [${product.category}] ${product.name} (no change needed)`);
        skippedCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ Update Complete!`);
    console.log(`   • Updated: ${updatedCount} products`);
    console.log(`   • Skipped: ${skippedCount} products (already correct)`);
    console.log(`   • Total: ${result.rows.length} products`);
    console.log(`${'='.repeat(60)}\n`);

    // Show sample of updated products
    console.log('📸 Sample of updated products:\n');
    const sample = await client.query(
      'SELECT name, category, images FROM products ORDER BY category, name LIMIT 10'
    );

    sample.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. [${row.category}] ${row.name}`);
      console.log(`   Images: ${row.images.length} - ${row.images[0].substring(0, 60)}...`);
    });

  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateProductImages();
