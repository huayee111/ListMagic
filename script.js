let generatedReceipts = []; // 儲存打包好的各張訂單純文字
let bluetoothDevice = null;
let bluetoothCharacteristic = null;

/**
 * 核心處理函式：解析貼上的文字、處理合併儲存格、組合 H 欄備註、排版
 */
function processOrders() {
    const rawText = document.getElementById('rawInputData').value;
    if (!rawText.trim()) {
        alert('請先貼上從 Google 試算表複製的資料！');
        return;
    }

    // 將貼上的文字以 Tab (分頁複製預設分隔符號) 切割成二維陣列
    const rows = rawText.split('\n').map(row => row.split('\t'));
    
    let orders = {};
    let currentOrderNo = "";

    // 1. 逐列掃描與「向下填滿」邏輯
    rows.forEach(row => {
        if (row.length < 13) return; // 確保有涵蓋到 M 欄 (索引 0~12)

        let date = row[0] ? row[0].trim() : "";          // A 日期
        let orderNo = row[1] ? row[1].trim() : "";       // B 訂單編號
        let contact = row[3] ? row[3].trim() : "";       // D 聯絡人
        let logistics = row[6] ? row[6].trim() : "";     // G 物流
        let addressMemo = row[7] ? row[7].trim() : "";   // H 物流編號/地址/備註
        let itemName = row[8] ? row[8].trim() : "";      // I 商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 總金額

        // 如果 B 欄有值就更新訂單編號，若是空白則沿用上一筆（對應合併儲存格）
        if (orderNo !== "") {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return; // 沒有訂單編號則跳過

        // 初始化訂單結構
        if (!orders[currentOrderNo]) {
            orders[currentOrderNo] = {
                date: date || "(無日期)",
                orderNo: currentOrderNo,
                contact: contact,
                logistics: logistics,
                addressMemo: addressMemo,
                totalAmount: totalAmount,
                items: []
            };
        }

        // 收集商品明細
        if (itemName) {
            orders[currentOrderNo].items.push({
                name: itemName,
                qty: quantity
            });
        }
    });

    // 2. 依照你指定的樣式進行純文字排版
    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

        // 組合你指定的格式
        let text = 
`================================
${ord.date}
${ord.orderNo}       ${ord.contact}
================================
物流: ${ord.logistics}
地址: ${ord.addressMemo}`;

        // 檢查 H 欄是否有額外備註（若地址欄內容有換行或特定備註，這裡會直接完整帶出）
        // 如果有獨立判斷備註的需求，也可以在這裡擴充

        text += 
`
--------------------------------
品名                             數量
--------------------------------\n`;

        ord.items.forEach(item => {
            // 欄位對齊簡單處理
            let paddedName = item.name.padEnd(28, ' ');
            text += `${paddedName} ${item.qty}\n`;
        });

        text += 
`================================
總金額:                          $${ord.totalAmount}

-----裁切------\n\n`;

        generatedReceipts.push(text);
        previewHtml += text + "\n--------------------------------------------------\n\n";
    }

    // 顯示在畫面上預覽
    document.getElementById('previewBox').textContent = previewHtml;
    alert(`成功轉換！共解析出 ${generatedReceipts.length} 張訂單。`);
}

/**
 * 連接藍牙熱感應發票機 (支援 Web Bluetooth API)
 */
async function connectPrinter() {
    try {
        alert('請在彈出的視窗中選擇你的藍牙熱感應發票機...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455'] // 常見發票機服務 UUID
        });

        const server = await bluetoothDevice.gatt.connect();
        // 這裡會嘗試抓取印表機的寫入通道
        const services = await server.getPrimaryServices();
        for (let service of services) {
            const characteristics = await service.getCharacteristics();
            for (let characteristic of characteristics) {
                if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                    bluetoothCharacteristic = characteristic;
                    alert('發票機藍牙連線成功！');
                    return;
                }
            }
        }
        alert('找到藍牙裝置，但找不到可寫入的列印通道。');
    } catch (error) {
        console.error(error);
        alert('連線失敗或取消連線：' + error.message);
    }
}

/**
 * 批次列印並加上 ESC/POS 自動切紙指令
 */
async function batchPrintAndCut() {
    if (generatedReceipts.length === 0) {
        alert('目前沒有可列印的訂單，請先點擊「轉換並預覽格式」！');
        return;
    }

    if (!bluetoothCharacteristic) {
        // 如果沒有連線藍牙，改用網頁預設列印視窗作為備用方案
        if (confirm('尚未連接藍牙發票機，是否改用系統預設列印視窗 (Ctrl+P)？')) {
            printViaBrowserWindow();
        }
        return;
    }

    try {
        const encoder = new TextEncoder();
        
        // ESC/POS 全切紙指令 (Cut Command)
        // 常用十六進位碼: 1D 56 41 00 (或 1B 6D)
        const cutCommand = new Uint8Array([0x1D, 0x56, 0x41, 0x00]);

        for (let i = 0; i < generatedReceipts.length; i++) {
            // 將文字轉為二進位資料
            let printData = encoder.encode(generatedReceipts[i]);
            
            // 組合「訂單文字 + 切紙指令」
            let combined = new Uint8Array(printData.length + cutCommand.length);
            combined.set(printData);
            combined.set(cutCommand, printData.length);

            // 透過藍牙發送給發票機
            await bluetoothCharacteristic.maxValueLength ? 
                await bluetoothCharacteristic.writeValueWithoutResponse(combined) : 
                await bluetoothCharacteristic.writeValue(combined);
            
            // 稍停 0.5 秒讓印表機順暢切紙
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        alert('批次列印與自動裁斷完成！');
    } catch (error) {
        console.error(error);
        alert('列印過程發生錯誤：' + error.message);
    }
}

/**
 * 備用方案：透過瀏覽器預設列印視窗
 */
function printViaBrowserWindow() {
    let printWindow = window.open('', '_blank');
    let fullHtml = `
        <html>
        <head>
            <style>
                body { font-family: monospace; font-size: 12px; line-height: 1.3; width: 58mm; margin: 0; padding: 5px; }
                pre { white-space: pre-wrap; margin: 0; }
                .page-break { page-break-after: always; }
            </style>
        </head>
        <body>
    `;
    
    generatedReceipts.forEach(receipt => {
        fullHtml += `<pre>${receipt}</pre><div class="page-break"></div>`;
    });
    
    fullHtml += `</body></html>`;
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
}
