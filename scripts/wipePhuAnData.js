const PROJECT_ID = "quanlyxe-phuan";
const TENANT_ID = "internal-tenant-phuan";

const collections = [
    'vehicles', 'drivers', 'customers', 'routes', 'trips', 
    'expenses', 'transportOrders', 'maintenance', 'inventory', 
    'inventoryTransactions', 'tires', 'purchaseOrders', 'alerts', 
    'trip_location_logs', 'expenseCategories', 'accountingPeriods', 
    'partners', 'costs'
];

async function deleteDocuments(collectionName) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
  
  const queryBody = {
    structuredQuery: {
      from: [{ collectionId: collectionName }],
      where: {
        fieldFilter: {
          field: { fieldPath: "tenant_id" },
          op: "EQUAL",
          value: { stringValue: TENANT_ID }
        }
      }
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody)
    });
    
    if (!res.ok) {
        console.log(`⚠️ Skipped ${collectionName} (No read access or missing index)`);
        return;
    }
    
    const results = await res.json();
    let count = 0;
    
    for (const item of results) {
      if (item.document && item.document.name) {
        // Delete document
        await fetch(`https://firestore.googleapis.com/v1/${item.document.name}`, {
            method: 'DELETE'
        });
        count++;
      }
    }
    
    if (count > 0) {
        console.log(`✅ ${collectionName}: Deleted ${count} documents`);
    }
  } catch (e) {
      console.log(`Error in ${collectionName}: ${e.message}`);
  }
}

(async () => {
    console.log(`\n🧹 Đang dọn dẹp dữ liệu rác/demo cho tenant ${TENANT_ID}...\n`);
    for (const coll of collections) {
        await deleteDocuments(coll);
    }
    console.log(`\n🎉 Hoàn tất dọn dẹp!\n`);
})();
