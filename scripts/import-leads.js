import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

const API = process.env.API_URL || 'http://localhost:3000';
const TOKEN = process.env.API_TOKEN || '';
const CSV_PATH = process.argv[2] || 'leads.csv';

if (!TOKEN) {
  console.error('ERROR: API_TOKEN env variable required');
  console.error('Usage: API_TOKEN=your-jwt-token node scripts/import-leads.js leads.csv');
  process.exit(1);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function importLead(lead) {
  try {
    const res = await fetch(`${API}/api/leads/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        businessId: 'auto',
        source: 'manual',
        leadData: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email || undefined,
          product: lead.product || undefined,
          city: lead.city || undefined,
          supplier: lead.supplier || undefined,
          requirement: lead.requirement || undefined,
          company: lead.company || undefined,
        },
      }),
    });
    const data = await res.json();
    return { ok: data.success, error: data.error || null };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csvPath = path.resolve(CSV_PATH);
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    console.error('CSV has no data rows');
    process.exit(1);
  }

  const headers = parseCSVLine(lines[0]);
  const total = lines.length - 1;
  let success = 0;
  let failed = 0;

  console.log(`Importing ${total} leads from ${CSV_PATH}...\n`);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      const key = h.toLowerCase().replace(/[^a-z0-9]/g, '_');
      row[key] = cols[idx] || '';
    });

    const lead = {
      name: row.customer_name || '',
      phone: row.mobile_no_ || row.mobile_no || '',
      email: row.email || '',
      product: row.query_product_name || '',
      city: row.address || '',
      supplier: row.column_7 || '',
    };

    if (!lead.phone) {
      failed++;
      console.log(`  [SKIP] Row ${i}: No phone number`);
      continue;
    }

    const result = await importLead(lead);
    if (result.ok) {
      success++;
      process.stdout.write(`  [OK] ${success + failed}/${total}: ${lead.name} (${lead.phone})\n`);
    } else {
      failed++;
      process.stdout.write(`  [FAIL] ${success + failed}/${total}: ${lead.name} - ${result.error}\n`);
    }

    if (i % 10 === 0) await sleep(500);
  }

  console.log(`\nDone: ${success} imported, ${failed} failed out of ${total}`);
}

main().catch(console.error);
