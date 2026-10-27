let generatedReceipts = []; 

// ==========================================
// 💡 【隨時自由編輯區】商品專屬貼心小叮嚀設定
// 只要商品名稱包含左邊的「關鍵字」，就會在出貨單後方獨立印出一張小叮嚀卡片
// ==========================================
const memoRules = [
    {
        keyword: "缺氧膠",
        content: "📌 【貼心小叮嚀】：\n感謝您購買台製缺氧膠\n使用時請保持通風，若不慎接觸皮膚\n請用大量清水沖洗並尋求協助。"
    },
    {
        keyword: "加速劑",
        content: "📌 【貼心小叮嚀】：\n感謝您購買加速劑\n本產品具揮發性，請存放於陰涼處\n並避免兒童接觸。"
    }
    // 如果未來想新增更多，直接在這裡繼續往下加逗號即可，例如：
    // { keyword: "新商品名稱", content: "📌 【貼心小叮嚀】：\n這是新商品的說明內容..." }
];


// 當使用者貼上或輸入資料時，自動執行轉換與預覽
document.addEventListener('DOMContentLoaded', () => {
    const inputArea = document.getElementById('rawInputData');
    if (inputArea) {
        inputArea.addEventListener('input', processOrders);
        inputArea.addEventListener('keyup', processOrders);
        inputArea.addEventListener('paste', () => {
            setTimeout(processOrders, 100);
        });
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

    // 取得今日日期 (格式: YYYY-MM-DD)
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. 抓取與向下填滿邏輯 (支援 A 到 P 欄完整對應)
    rows.forEach(row => {
        if (row.length < 10) return; // 確保至少涵蓋到數量欄位

        let orderNo = row[1] ? row[1].trim() : "";       // B 訂單編號
        let contact = row[3] ? row[3].trim() : "";       // D 聯絡人
        let logistics = row[6] ? row[6].trim() : "";     // G 物流 (可能帶有 ➤ 備註)
        let addressMemo = row[7] ? row[7].trim() : "";   // H 物流編號/地址
        let itemName = row[8] ? row[8].trim() : "";      // I 商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 總金額

        if (orderNo !== "") {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return;

        if (!orders[currentOrderNo]) {
            // 檢查 G 欄是否包含 ➤ 備註
            let memoText = "";
            if (logistics.includes("➤")) {
                let parts = logistics.split("➤");
                logistics = parts[0].trim(); 
                memoText = parts[1].trim();  
            }

            orders[currentOrderNo] = {
                date: formattedDate,
                orderNo: currentOrderNo,
                contact: contact,
                logistics: logistics,
                addressMemo: addressMemo,
                memo: memoText,
                totalAmount: totalAmount,
                items: []
            };
        } else {
            if (!orders[currentOrderNo].memo && logistics.includes("➤")) {
                let parts = logistics.split("➤");
                logistics = parts[0].trim();
                orders[currentOrderNo].memo = parts[1].trim();
                orders[currentOrderNo].logistics = logistics;
            }
        }

        if (itemName) {
            orders[currentOrderNo].items.push({
                name: itemName,
                qty: quantity
            });
        }
    });

    // 2. 重新排版：粗實線、全形冒號不空格、商品【數量】緊黏、小叮嚀卡片獨立切分
    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

        // 主出貨單內容
        let mainReceipt = 
`━━━━━━━━━━━━━━━━━━━━━━━
日期：${ord.date}
編號：${ord.orderNo}
姓名：${ord.contact}
━━━━━━━━━━━━━━━━━━━━━━━
寄送方式：${ord.logistics}
物流碼：${ord.addressMemo}
--------------------------------\n`;

        ord.items.forEach(item => {
            let qtyStr = item.qty ? item.qty.trim() : "";
            let qtyDisplay = qtyStr !== "" ? `【${qtyStr}】` : `【注意】`;
            mainReceipt += `${qtyDisplay}${item.name}\n`;
        });

        // 如果 G 欄有抓到 ➤ 後面的備註，顯示在商品下方
        if (ord.memo) {
            mainReceipt += `備註：${ord.memo}\n`;
        }

        mainReceipt += 
`--------------------------------
總金額：$${ord.totalAmount}
━━━━━━━━━━━━━━━━━━━━━━━`;

        // 放入主出貨單
        generatedReceipts.push(mainReceipt);
        previewHtml += mainReceipt + "\n\n================ [ 主單裁切處 ] ================\n\n";

        // 3. 掃描該訂單的所有商品，檢查是否觸發「貼心小叮嚀」規則
        // 如果有命中，就額外產生一張獨立的小叮嚀卡片加入列印序列中
        ord.items.forEach(item => {
            memoRules.forEach(rule => {
                if (item.name.includes(rule.keyword)) {
                    let slipText = `\n${rule.content}\n`;
                    generatedReceipts.push(slipText);
                    previewHtml += slipText + "\n---------------- [ 小叮嚀卡片裁切處 ] ----------------\n\n";
                }
            });
        });
    }

    previewBox.textContent = previewHtml;
}

/**
 * 透過系統預設列印視窗批次送出（強制 58mm 滿版、邊距歸零、自動獨立分頁裁切）
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
                @page {
                    size: 58mm auto;
                    margin: 0;
                }
                body { 
                    font-family: monospace; 
                    font-size: 15px; 
                    font-weight: bold;
                    line-height: 1.3; 
                    width: 58mm; 
                    margin: 0; 
                    padding: 2px; 
                }
                pre { 
                    white-space: pre-wrap; 
                    margin: 0; 
                }
                .receipt-box {
                    page-break-after: always;
                    margin-bottom: 10px;
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
