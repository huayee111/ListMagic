let generatedReceipts = []; 

// ==========================================
// 💡 【隨時自由編輯區】商品專屬貼心小叮嚀設定
// ==========================================
const memoRules = [
    {
        keyword: "樣品",
        content: "\n親愛的買家您好！\n感謝您購買本公司的產品\n在此附贈樣品供您試用\n歡迎加入客服或來電詢問\n期待再次替您服務！"
    },
    {
        keyword: "UV光速膠",
        content: "【貼心小叮嚀】：\n感謝您購買UV光速膠\n開封後請盡速使用完畢以免膠體硬化，如未使用完請確實密封完全，並盡可能的盡速使用完畢喲！\n期待再次替您服務！"
    },
    {
        keyword: "2：1 AB膠",
        content: "【貼心小叮嚀】：\n感謝您購買2：1 AB膠\n請用【重量比】2：1 的方式以同方向混合、切忌不規則攪拌，請務必確實混合才能確保AB膠完全硬化喲！可放置在50度左右的烘箱中去除氣泡！\n期待再次替您服務！"
    },
    {
        keyword: "(加強型4hr)",
        content: "【貼心小叮嚀】：\n感謝您購買加強型 AB膠\n請用【體積比】1：1的方式以同方向混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化喲！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體！\n期待再次替您服務！"
    },
    {
        keyword: "(基本型4hr)",
        content: "【貼心小叮嚀】：\n感謝您購買基本型 AB膠\n請用【體積比】1：1的方式以同方向混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化喲！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體！\n期待再次替您服務！"
    },
    {
        keyword: "(5分)",
        content: "【貼心小叮嚀】：\n感謝您購買AB膠(5分)\n請用【體積比】1：1的方式以同方向混合、切忌不規則攪拌，「請勿大量混合」及攪拌過久導致膠體瞬間硬化！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體！\n期待再次替您服務！"
    },
    {
        keyword: "(30分)",
        content: "【貼心小叮嚀】：\n感謝您購買AB膠(30分)\n請用【體積比】1：1的方式以同方向混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化喲！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體！\n期待再次替您服務！"
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

    const rawLines = rawText.split('\n');
    let rows = [];
    let currentRow = [];

    rawLines.forEach(line => {
        let trimmed = line.trim();
        if (line.includes('\t')) {
            if (currentRow.length > 0) {
                rows.push(currentRow);
                currentRow = [];
            }
            let cols = line.split('\t').map(c => c.trim());
            rows.push(cols);
        } else if (trimmed !== "") {
            currentRow.push(trimmed);
        }
    });
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    let orders = {};
    let currentOrderNo = "";

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    rows.forEach(row => {
        let orderNo = row[1] ? row[1].trim() : "";       // B 訂單編號
        let contact = row[3] ? row[3].trim() : "";       // D 聯絡人
        let logisticsRaw = row[6] ? row[6].trim() : "";  // G 欄：寄送方式（可能帶有 ➤ 備註）
        let itemName = row[8] ? row[8].trim() : "";      // I 商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 總金額

        // 智慧尋找訂單編號
        if (!orderNo || orderNo.length < 5 || orderNo.includes('₫') || orderNo.includes('FALSE')) {
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

        // 專門解析 G 欄：分離物流名稱與 ➤ 後方的備註
        let logistics = logisticsRaw;
        let foundMemo = "";
        if (logisticsRaw.includes("➤")) {
            let parts = logisticsRaw.split("➤");
            logistics = parts[0].trim();
            if (parts[1] && parts[1].trim() !== "") {
                foundMemo = parts[1].trim();
            }
        }

        if (!orders[currentOrderNo]) {
            orders[currentOrderNo] = {
                date: formattedDate,
                orderNo: currentOrderNo,
                contact: contact || "未命名",
                logistics: logistics || "超商寄送",
                memo: foundMemo,
                totalAmount: totalAmount || "0",
                items: []
            };
        } else {
            if (!orders[currentOrderNo].contact && contact && contact !== "FALSE") orders[currentOrderNo].contact = contact;
            if (!orders[currentOrderNo].logistics && logistics && logistics !== "FALSE" && logistics !== "") orders[currentOrderNo].logistics = logistics;
            if (!orders[currentOrderNo].memo && foundMemo) orders[currentOrderNo].memo = foundMemo;
            if (!orders[currentOrderNo].totalAmount || orders[currentOrderNo].totalAmount === "0") {
                if (totalAmount && !isNaN(totalAmount)) orders[currentOrderNo].totalAmount = totalAmount;
            }
        }

        if (itemName && itemName !== "FALSE" && itemName !== "₫" && itemName !== "←") {
            let cleanQty = quantity;
            let cleanName = itemName;

            if (!cleanQty || isNaN(cleanQty)) {
                let match = itemName.match(/(.*?)(\d+)$/);
                if (match && match[2].length <= 2) {
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

    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

        let mainReceipt = 
`━━━━━━━━━━━━━━
日期：${ord.date}
編號：${ord.orderNo}
姓名：${ord.contact}
━━━━━━━━━━━━━━
寄送方式：${ord.logistics}
物流碼：${ord.logistics}
--------------------\n`;

        ord.items.forEach(item => {
            let qtyStr = item.qty ? item.qty.trim() : "";
            let qtyDisplay = qtyStr !== "" ? `【${qtyStr}】` : `➤`;
            mainReceipt += `${qtyDisplay}${item.name}\n`;
        });

        if (ord.memo) {
            mainReceipt += `備註：${ord.memo}\n`;
        }

        mainReceipt += 
`--------------------
總金額：$${ord.totalAmount}
━━━━━━━━━━━━━━`;

        generatedReceipts.push({ type: 'main', content: mainReceipt });
        previewHtml += mainReceipt + "\n\n================ [ 主單裁切處 ] ================\n\n";

        // 小叮嚀卡片
        let printedKeywords = new Set();
        ord.items.forEach(item => {
            memoRules.forEach(rule => {
                if (item.name.includes(rule.keyword) && !printedKeywords.has(rule.keyword)) {
                    printedKeywords.add(rule.keyword);
                    let slipText = 
`━━━━━━━━━━━━━━
${rule.content}
━━━━━━━━━━━━━━`;
                    generatedReceipts.push({ type: 'memo', content: slipText });
                    previewHtml += slipText + "\n\n---------------- [ 小叮嚀卡片裁切處 (置中) ] ----------------\n\n";
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
                    max-width: 58mm;
                    margin: 0; 
                    padding: 2px; 
                    box-sizing: border-box;
                }
                pre { 
                    white-space: pre-wrap; 
                    margin: 0; 
                    width: 100%;
                    word-break: break-all;
                }
                .receipt-box {
                    page-break-after: always;
                    margin-bottom: 10px;
                    width: 58mm;
                }
                .receipt-main {
                    text-align: left;
                }
                .receipt-memo {
                    text-align: center;
                }
            </style>
        </head>
        <body>
    `;
    
    generatedReceipts.forEach(item => {
        let className = item.type === 'memo' ? 'receipt-memo' : 'receipt-main';
        fullHtml += `<div class="receipt-box ${className}"><pre>${item.content}</pre></div>`;
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
