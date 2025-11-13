import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456',
  port: 5432,
});

const productImages = {
  'Laptop Pro 14': ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'],
  'Noise Cancelling Headphones': ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500'],
  'Ergo Chair': ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500', 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500'],
  'Wireless Mouse': ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'],
  'Yoga Mat': ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
  'Smart Watch': ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500'],
  'Coffee Maker': ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500'],
  'Running Shoes': ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500'],
  'Desk Lamp': ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500'],
  'Backpack': ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=500'],
  'Fiction Novel': ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'],
  'Cooking Book': ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=500'],
  '4K Smart TV 55"': ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', 'https://images.unsplash.com/photo-1593359863503-f598bb35c1c8?w=500'],
  'Mechanical Keyboard': ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500'],
  'Portable Bluetooth Speaker': ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'],
  'Protein Powder': ['https://images.unsplash.com/photo-1579722821273-0f6c7d4e2c2f?w=500'],
  'Organic Tea Set': ['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500'],
  'Dumbbell Set': ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500'],
  'Winter Jacket': ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'],
  'Leather Wallet': ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=500'],
  'Gardening Tool Set': ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500'],
  'Cookbook - Italian': ['https://images.unsplash.com/photo-1544025162-d76694265947?w=500'],
  'Mystery Novel': ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500']
};

async function updateAllProducts() {
  const client = await pool.connect();
  try {
    console.log('Fetching all products...');
    const result = await client.query('SELECT id, name FROM products');
    console.log(`Found ${result.rows.length} products\n`);

    for (const product of result.rows) {
      // Try to find matching images
      let images = productImages[product.name];

      // If no specific images, assign generic ones based on name
      if (!images) {
        if (product.name.toLowerCase().includes('laptop') || product.name.toLowerCase().includes('computer')) {
          images = ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'];
        } else if (product.name.toLowerCase().includes('headphone') || product.name.toLowerCase().includes('audio')) {
          images = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'];
        } else if (product.name.toLowerCase().includes('chair') || product.name.toLowerCase().includes('furniture')) {
          images = ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500'];
        } else if (product.name.toLowerCase().includes('book')) {
          images = ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'];
        } else if (product.name.toLowerCase().includes('watch') || product.name.toLowerCase().includes('clock')) {
          images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'];
        } else if (product.name.toLowerCase().includes('tv') || product.name.toLowerCase().includes('television')) {
          images = ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500'];
        } else if (product.name.toLowerCase().includes('mouse') || product.name.toLowerCase().includes('keyboard')) {
          images = ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=500'];
        } else if (product.name.toLowerCase().includes('speaker')) {
          images = ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500'];
        } else {
          // Generic product image
          images = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'];
        }
      }

      await client.query('UPDATE products SET images = $1 WHERE id = $2', [images, product.id]);
      console.log(`✓ Updated "${product.name}" with ${images.length} image(s)`);
    }

    console.log('\nAll products updated successfully!');

    // Show sample
    const sample = await client.query('SELECT name, images FROM products LIMIT 5');
    console.log('\nSample products:');
    sample.rows.forEach(row => {
      console.log(`- ${row.name}: ${row.images ? row.images.length + ' images' : 'no images'}`);
    });

  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateAllProducts();
