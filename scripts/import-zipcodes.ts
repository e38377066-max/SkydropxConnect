import XLSX from 'xlsx';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { zipCodes } from '../shared/schema';

function sanitizeString(value: any): string {
  return String(value || '').replace(/'/g, "''");
}

async function importZipCodes() {
  console.log('📖 Leyendo archivo Excel...');
  
  const workbook = XLSX.readFile('attached_assets/CPdescarga_1760384692615.xls');
  console.log('📑 Hojas encontradas:', workbook.SheetNames.length);
  
  let totalRecords = 0;
  let importedRecords = 0;
  const batchSize = 500;
  
  // Limpiar tabla antes de importar
  console.log('🗑️  Limpiando tabla anterior...');
  await db.execute(sql`TRUNCATE TABLE zip_codes`);
  console.log('✅ Tabla limpiada\n');
  
  // Importar todas las hojas excepto "Nota"
  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'Nota') {
      console.log('⏭️  Saltando hoja "Nota"\n');
      continue;
    }
    
    console.log(`📍 Importando ${sheetName}...`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    totalRecords += jsonData.length;
    
    // Importar en lotes usando Drizzle
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, Math.min(i + batchSize, jsonData.length));
      
      const records = batch
        .filter((row: any) => row.d_codigo)
        .map((row: any) => ({
          codigoPostal: String(row.d_codigo).trim(),
          colonia: sanitizeString(row.d_asenta),
          tipoAsentamiento: row.d_tipo_asenta ? sanitizeString(row.d_tipo_asenta) : null,
          municipio: sanitizeString(row.D_mnpio),
          estado: sanitizeString(row.d_estado),
          ciudad: row.d_ciudad ? sanitizeString(row.d_ciudad) : null,
        }));
      
      if (records.length > 0) {
        await db.insert(zipCodes).values(records);
        importedRecords += records.length;
      }
      
      if ((i + batchSize) % 5000 === 0) {
        console.log(`   📊 Progreso: ${importedRecords} registros...`);
      }
    }
    
    console.log(`   ✅ ${jsonData.length} registros procesados`);
  }
  
  console.log(`\n🎉 Importación completada!`);
  console.log(`📊 Total de registros en Excel: ${totalRecords}`);
  console.log(`✅ Registros importados: ${importedRecords}`);
  
  process.exit(0);
}

importZipCodes().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
