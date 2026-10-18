/**
 * Repricing script for FC Mobile (game_slug = 'fc-mobile')
 *
 * Requirements:
 * - Budget B = 6,000,000
 * - Squad size N = 6 (4 starters + 2 bench)
 * - P_min = 70,000
 * - At most 2 players with overall_rating >= 90 per squad:
 *     1) 3*P90 + (N-3)*P_min > B => 3*1,950,000 + 3*70,000 = 6,060,000 > 6,000,000
 *     2) 2*P90_max + (N-2)*P_min <= B => 2*2,450,000 + 4*70,000 = 5,180,000 <= 6,000,000
 *     3) Monotonic prices with clear gap below 90 (rating 89 ceiling = 1,150,000; rating 90 floor = 1,950,000; gap = 800,000)
 */

const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../src/features/shared/server/supabaseAdmin');

// Old prices before reprice (for audit & rollback backup)
const OLD_PRICES = {
  'Victor Osimhen': 2500000,
  'Ademola Lookman': 1850000,
  'Alex Iwobi': 1600000,
  'Samuel Chukwueze': 1400000,
  'Victor Boniface': 1200000,
  'Wilfred Ndidi': 900000,
  'Calvin Bassey': 720000,
  'Moses Simon': 580000,
  'Kelechi Iheanacho': 520000,
  'Ola Aina': 420000,
  'Stanley Nwabali': 250000,
  'Raphael Onyedika': 120000,
};

// Target new prices adhering strictly to the mathematical constraints
const NEW_PRICES = {
  'Victor Osimhen': 2450000,    // Rating 94 (P90_max in current squad)
  'Ademola Lookman': 2100000,   // Rating 91
  'Alex Iwobi': 1950000,        // Rating 90 (P90 floor)
  'Samuel Chukwueze': 1060000,  // Rating 88
  'Victor Boniface': 900000,    // Rating 86
  'Wilfred Ndidi': 660000,      // Rating 84
  'Calvin Bassey': 520000,      // Rating 81
  'Moses Simon': 400000,        // Rating 78
  'Kelechi Iheanacho': 330000,  // Rating 76
  'Ola Aina': 240000,           // Rating 73
  'Stanley Nwabali': 140000,    // Rating 68
  'Raphael Onyedika': 70000,    // Rating 58 (P_min)
};

async function run() {
  console.log('=== FC Mobile Fantasy League Repricing & Rule Enforcement ===');

  // Step 1: Query FC Mobile athletes
  const { data: athletes, error: fetchErr } = await supabaseAdmin
    .from('athletes')
    .select('*')
    .eq('game_slug', 'fc-mobile')
    .order('overall_rating', { ascending: false });

  if (fetchErr) {
    console.error('Error fetching athletes:', fetchErr);
    process.exit(1);
  }

  const athleteList = athletes || [];
  console.log(`Found ${athleteList.length} athletes with game_slug = 'fc-mobile'.`);

  // Step 2: Create backup
  const backupDir = path.join(__dirname, '..', 'supabase', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = athleteList.map((a) => ({
    id: a.id,
    name: a.name,
    ign: a.ign,
    game_slug: a.game_slug,
    overall_rating: a.overall_rating,
    old_fantasy_price: OLD_PRICES[a.name] ?? a.fantasy_price,
    backed_up_at: new Date().toISOString(),
  }));

  const backupFile = path.join(backupDir, 'fc_mobile_fantasy_prices_backup.json');
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`Backup saved to ${backupFile}`);

  // Step 3: Apply new prices
  console.log('\nApplying new prices...');
  const priceChanges = [];

  for (const a of athleteList) {
    const newPrice = NEW_PRICES[a.name] ?? a.fantasy_price;
    const oldPrice = OLD_PRICES[a.name] ?? a.fantasy_price;

    await supabaseAdmin
      .from('athletes')
      .update({ fantasy_price: newPrice })
      .eq('id', a.id);

    priceChanges.push({
      id: a.id,
      name: a.name,
      rating: a.overall_rating,
      oldPrice,
      newPrice,
    });
  }

  // Step 4: Update FC Mobile fantasy settings (B = 6,000,000)
  await supabaseAdmin.from('fantasy_settings').upsert([
    {
      key: 'fc_mobile_budget',
      value: 6000000,
      updated_at: new Date().toISOString(),
    },
  ]);

  console.log('FC Mobile fantasy squad budget set to 6,000,000 in fantasy_settings.');

  // Print comparison table
  console.log('\nRepricing Summary:');
  console.table(
    priceChanges.map((p) => ({
      Name: p.name,
      Rating: p.rating,
      'Old Price (NGN)': p.oldPrice.toLocaleString('en-NG'),
      'New Price (NGN)': p.newPrice.toLocaleString('en-NG'),
      Change: `${p.newPrice > p.oldPrice ? '+' : ''}${(p.newPrice - p.oldPrice).toLocaleString('en-NG')}`,
    }))
  );

  // Validate mathematical proofs
  const B = 6000000;
  const N = 6;
  const P_min = 70000;
  const P90 = 1950000; // Alex Iwobi (rating 90)
  const P90_max = 2450000; // Victor Osimhen (rating 94)

  const ineq1 = 3 * P90 + (N - 3) * P_min;
  const ineq2 = 2 * P90_max + (N - 2) * P_min;

  console.log('\nMathematical Verification:');
  console.log(`Inequality 1 (3*P90 + 3*P_min > B):`);
  console.log(`  3 * ${P90.toLocaleString()} + 3 * ${P_min.toLocaleString()} = ${ineq1.toLocaleString()} > ${B.toLocaleString()} [${ineq1 > B ? 'VALID - Exceeds budget by ' + (ineq1 - B).toLocaleString() : 'FAILED'}]`);

  console.log(`\nInequality 2 (2*P90_max + 4*P_min <= B):`);
  console.log(`  2 * ${P90_max.toLocaleString()} + 4 * ${P_min.toLocaleString()} = ${ineq2.toLocaleString()} <= ${B.toLocaleString()} [${ineq2 <= B ? 'VALID - Budget left: ' + (B - ineq2).toLocaleString() : 'FAILED'}]`);

  console.log('\nReprice completed successfully.');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
