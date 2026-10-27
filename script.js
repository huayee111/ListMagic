let generatedReceipts = []; 

// 當使用者在文字框貼上或輸入資料時，自動執行轉換與預覽
document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('rawInputData');
    if (inputArea) {
        inputArea.addEventListener('input', processOrders);
    }
});

function processOrders() {
    const rawText = document.getElementById('rawInputData').value;
    const previewBox = document.getElementById('previewBox');

    if (!rawText.trim()) {
        previewBox.textContent = "尚未貼上資料，請在上方文字框貼上試算表內容。";
        generatedReceipts = [];
        return;
    }

    const rows = rawText.split('\n').map(row => row.split('\t'));
    let orders = {};
    let currentOrderNo = "";

    // 1. 抓取與向下填滿邏輯 (處理合併儲存格)
    rows.forEach(row => {
        if (row.length < 13) return;

        let date = row[0] ? row[0].trim() : "";          // A 日期
        let orderNo = row[1] ? row[1].trim() : "";       // B 訂單編號
        let contact = row[3] ? row[3].trim() : "";       // D 聯絡人
        let logistics = row[6] ? row[6].trim() : "";     // G 物流
        let addressMemo = row[7] ? row[7].trim() : "";   // H 物流編號/地址/備註
        let itemName = row[8] ? row[8].trim() : "";      // I 商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 總金額

        if (orderNo !== "") {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return;

        if (!orders[currentOrderNo]) {
            orders[currentOrderNo] = {
                date: date || "",
                orderNo: currentOrderNo,
                contact: contact,
                logistics: logistics,
                addressMemo: addressMemo,
                totalAmount: totalAmount,
                items: []
            };
        }

        if (itemName) {
            orders[currentOrderNo].items.push({
                name: itemName,
                qty: quantity
            });
        }
    });

    // 2. 重新排版（強化理貨辨識度、左右對齊、重點放大）
    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

        // 組合出貨單純文字格式 (不含多餘的裁切文字)
        let text = 
`================================
日期: ${ord.date}
訂單: ${ord.orderNo}
收件: ${ord.contact}
================================
物流: ${ord.logistics}
[地址]: ${ord.addressMemo}
--------------------------------
[品名]                      [數量]
--------------------------------\n`;

        ord.items.forEach(item => {
            // 讓品名與數量有明顯的寬度隔離，方便理貨人員核對
            let nameFormatted = item.name.length > 18 ? item.name.substring(0, 16) + ".." : item.name;
            let paddedName = nameFormatted.padEnd(22, ' ');
            text += `${paddedName} x ${item.qty}\n`;
        });

        text += 
`================================
總金額: $${ord.totalAmount}
================================`;

        generatedReceipts.push(text);
        previewHtml += text + "\n\n================ [ 頁面分隔線 ] ================\n\n";
    }

    previewBox.textContent = previewHtml;
}

/**
 * 透過系統預設列印視窗批次送出
 */
function printViaBrowserWindow() {
    if (generatedReceipts.length === 0) {
        alert('目前沒有可列印的訂單，請先貼上資料！');
        return;
    }

    let printWindow = window.open('', '_blank');
    let fullHtml = `
        <html>
        <head>
            <title>批次列印出貨單</title>
            <style>
                body { 
                    font-family: monospace; 
                    font-size: 14px; 
                    line-height: 1.4; 
                    width: 58mm; 
                    margin: 0; 
                    padding: 5px; 
                }
                pre { 
                    white-space: pre-wrap; 
                    margin: 0; 
                    font-weight: bold;
                }
                .receipt-box {
                    page-break-after: always;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
    `;
    
    generatedReceipts.forEach(receipt => {
        fullHtml += `<div class="receipt-box"><pre>${receipt}</pre></div>`;
    });
    
    fullHtml += `
        </body>
        </html>
    `;
    
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { 
        printWindow.print(); 
    }, 500);
}
