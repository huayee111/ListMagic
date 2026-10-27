let generatedReceipts = []; 

// ==========================================
// 💡 【隨時自由編輯區】商品專屬貼心小叮嚀設定
// 只要商品名稱包含左邊的「關鍵字」，就會在出貨單後方獨立印出一張小叮嚀卡片
// ==========================================
const memoRules = [
    {
        keyword: "樣品",
        content: "\n親愛的買家您好！\n感謝您購買本公司的產品\n在此附贈樣品供您試用\n歡迎加入客服或來電詢問\n期待再次替您服務！"
    },
    {
        keyword: "UV光速膠",
        content: "📌 【貼心小叮嚀】：\n感謝您購買UV光速膠\n開封後請盡速使用完畢以免膠體硬化\n如未使用完請確實密封完全\n並盡可能的盡速使用完畢喲！"
    },
    {
        keyword: "2：1 AB膠",
        content: "📌 【貼心小叮嚀】：\n感謝您購買2：1 AB膠\n使用時請以【重量比】2：1 的方式\n以同方向混合、切忌不規則攪拌，\n請務必確實混合才能確保AB膠完全硬化喲！\n可放置在50度左右的烘箱中去除氣泡！\n期待再次替您服務！"
    },
    {
        keyword: "(加強型4hr)",
        content: "📌 【貼心小叮嚀】：\n感謝您購買加強型 AB膠\n請用【體積比】1：1的方式以同方向混合\n連同容器邊緣與刮刀上的膠都要刮下來\n確實混合才能確保AB膠完全硬化喲！\n若覺得混合前的膠體難以攪拌，\n可以隔水加熱軟化膠體！期待再次替您服務！"
    },
    {
        keyword: "(基本型4hr)",
        content: "📌 【貼心小叮嚀】：\n感謝您購買基本型 AB膠\n請用【體積比】1：1的方式以同方向混合\n連同容器邊緣與刮刀上的膠都要刮下來\n確實混合才能確保AB膠完全硬化喲！\n若覺得混合前的膠體難以攪拌，\n可以隔水加熱軟化膠體！期待再次替您服務！"
    },
    {
        keyword: "(5分)",
        content: "📌 【貼心小叮嚀】：\n感謝您購買AB膠(5分)\n使用時請以量杯秤【體積比】1：1的方式\n以同方向混合、切忌不規則攪拌，\n請勿大量混合及攪拌過久導致膠體瞬間硬化喲！\n期待再次替您服務！"
    },
    {
        keyword: "(30分)",
        content: "📌 【貼心小叮嚀】：\n感謝您購買AB膠(30分)\n請用【體積比】1：1的方式以同方向混合\n連同容器邊緣與刮刀上的膠都要刮下來\n確實混合才能確保AB膠完全硬化喲！\n若覺得混合前的膠體難以攪拌，\n可以隔水加熱軟化膠體！期待再次替您服務！"
    }
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

    // 以行為單位進行初步清理，濾除空行與純雜訊行
    const rawLines = rawText.split('\n');
    let rows = [];
    let currentRow = [];

    rawLines.forEach(line => {
        let trimmed = line.trim();
        // 如果遇到含有 Tab (代表一列的完整欄位切分)，視為一筆完整或部分列
        if (line.includes('\t')) {
            if (currentRow.length > 0) {
                rows.push(currentRow);
                currentRow = [];
            }
            let cols = line.split('\t').map(c => c.trim());
            rows.push(cols);
        } else if (trimmed !== "") {
            // 如果是被拆散的單行文字，暫存起來準備進行黏合
            currentRow.push(trimmed);
        }
    });
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    let orders = {};
    let currentOrderNo = "";

    // 取得今日日期 (格式: YYYY-MM-DD)
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 走訪每一列資料進行智慧解析
    rows.forEach(row => {
        // 如果這一列是陣列但長度太短，嘗試從中萃取關鍵資訊
        let orderNo = row[1] ? row[1].trim() : "";       // B 訂單編號
        let contact = row[3] ? row[3].trim() : "";       // D 聯絡人
        let logistics = row[6] ? row[6].trim() : "";     // G 物流 (可能帶有 ➤ 備註)
        let addressMemo = row[7] ? row[7].trim() : "";   // H 物流編號/地址
        let itemName = row[8] ? row[8].trim() : "";      // I 商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 欄或可能位移的數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 總金額

        // 防呆：如果 row[1] 不是訂單編號格式，嘗試在整行文字中尋找符合訂單編號特徵的字串
        if (!orderNo || orderNo.length < 5 || orderNo.includes('₫') || orderNo.includes('FALSE')) {
            // 尋找整行中有沒有像訂單編號的文字
            row.forEach(cell => {
                if (cell && cell.length >= 10 && /^[0-9A-Z]{10,20}$/.test(cell)) {
                    orderNo = cell;
                }
            });
        }

        if (orderNo && orderNo !== "FALSE" && orderNo !== "₫") {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return;

        if (!orders[currentOrderNo]) {
            // 清理物流與 G 欄備註
            let memoText = "";
            if (logistics.includes("➤")) {
                let parts = logistics.split("➤");
                logistics = parts[0].trim(); 
                memoText = parts[1].trim();  
            }

            orders[currentOrderNo] = {
                date: formattedDate,
                orderNo: currentOrderNo,
                contact: contact || "未命名",
                logistics: logistics || "超商寄送",
                addressMemo: addressMemo || "",
                memo: memoText,
                totalAmount: totalAmount || "0",
                items: []
            };
        } else {
            // 補充更新空白欄位
            if (!orders[currentOrderNo].contact && contact && contact !== "FALSE") orders[currentOrderNo].contact = contact;
            if (!orders[currentOrderNo].logistics && logistics && logistics !== "FALSE") orders[currentOrderNo].logistics = logistics;
            if (!orders[currentOrderNo].addressMemo && addressMemo && addressMemo !== "FALSE") orders[currentOrderNo].addressMemo = addressMemo;
            if (!orders[currentOrderNo].totalAmount || orders[currentOrderNo].totalAmount === "0") {
                if (totalAmount && !isNaN(totalAmount)) orders[currentOrderNo].totalAmount = totalAmount;
            }
        }

        // 智慧過濾商品名稱與數量（排除系統雜訊如 ₫, FALSE, ← 等）
        if (itemName && itemName !== "FALSE" && itemName !== "₫" && itemName !== "←") {
            // 如果數量欄位有抓到，直接使用；若沒抓到，嘗試從品名結尾分離數量
            let cleanQty = quantity;
            let cleanName = itemName;

            if (!cleanQty || isNaN(cleanQty)) {
                // 檢查品名後面是否有數字黏在一起的情況
                let match = itemName.match(/(.*?)(\d+)$/);
                if (match && match[2].length <= 2) { // 假設數量通常在 1~2 位數以內
                    cleanName = match[1].trim();
                    cleanQty = match[2];
                }
            }

            orders[currentOrderNo].items.push({
                name: cleanName,
                qty: cleanQty
            });
        }
    });

    // 重新排版與預覽產出
    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

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

        if (ord.memo) {
            mainReceipt += `備註：${ord.memo}\n`;
        }

        mainReceipt += 
`--------------------------------
總金額：$${ord.totalAmount}
━━━━━━━━━━━━━━━━━━━━━━━`;

        generatedReceipts.push(mainReceipt);
        previewHtml += mainReceipt + "\n\n================ [ 主單裁切處 ] ================\n\n";

        // 檢查小叮嚀卡片規則
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
