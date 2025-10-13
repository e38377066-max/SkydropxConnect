import * as XLSX from 'xlsx';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function importZipCodes() {
  console.log('📖 Leyendo archivo Excel...');
  
  const workbook = XLSX.readFile('attached_assets/CPdescarga_1760384692615.xls');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('📊 Registros encontrados:', jsonData.length);
  console.log('📋 Estructura de la primera fila:');
  console.log(JSON.stringify(jsonData[0], null, 2));
  console.log('\n📋 Primeras 5 filas:');
  console.log(jsonData.slice(0, 5).map((row, i) => `${i + 1}. ${JSON.stringify(row)}`).join('\n'));
}

importZipCodes().catch(console.error);
