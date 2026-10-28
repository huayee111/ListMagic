let generatedReceipts = []; 

// ==========================================
// 💡 【隨時自由編輯區】商品專屬貼心小叮嚀設定
// ==========================================
const memoRules = [
    {
        keyword: "樣品",
        content: "\n親愛的買家您好！\n感謝您購買本公司的產品\n在此附贈樣品供您試用\n歡迎掃描名片加入客服\n或來電由專人替您服務\n非常期待您再次光臨！"
    },
    {
        keyword: "春單",
        content: "\n親愛的買家您好！\n感謝您購買本公司的產品\n在此附贈樣品供您試用\n歡迎掃描名片加入客服\n或來電由專人替您服務\n非常期待您再次光臨！"
    },
    {
        keyword: "UV光速膠",
        content: "【貼心小叮嚀】：\n感謝您購買UV光速膠\n開封後請盡速使用避免膠體硬化，如未使用完請確實密封完全，建議盡速使用完畢喲！\n期待再次替您服務！"
    },
    {
        keyword: "2：1 AB膠",
        content: "【貼心小叮嚀】：\n感謝您購買2：1 AB膠\n請用【重量比】2：1 的方式以同方向攪拌混合、切忌不規則攪拌，請務必確實混合才能確保AB膠能完全硬化！可放置在60~80度左右的烘箱中放置30~60分鐘去除氣泡喲！\n期待再次替您服務！"
    },
    {
        keyword: "(加強型4hr)",
        content: "【貼心小叮嚀】：\n感謝您購買加強型 AB膠\n請用【體積比】1：1的方式以同方向攪拌混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體喲！\n期待再次替您服務！"
    },
    {
        keyword: "(基本型4hr)",
        content: "【貼心小叮嚀】：\n感謝您購買基本型 AB膠\n請用【體積比】1：1的方式以同方向攪拌混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體喲！\n期待再次替您服務！"
    },
    {
        keyword: "(5分)",
        content: "【貼心小叮嚀】：\n感謝您購買AB膠(5分)\n請用【體積比】1：1的方式以同方向攪拌混合、切忌不規則攪拌，「請勿大量混合」及攪拌過久導致膠體瞬間硬化！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體喲！\n期待再次替您服務！"
    },
    {
        keyword: "(30分)",
        content: "【貼心小叮嚀】：\n感謝您購買AB膠(30分)\n請用【體積比】1：1的方式以同方向攪拌混合、切忌不規則攪拌，連同容器邊緣與刮刀上的膠都要刮下來，確實混合才能確保AB膠完全硬化！若覺得混合前的膠體難以攪拌，可以隔水加熱軟化膠體喲！\n期待再次替您服務！"
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
    const rawText = document.getElementById('rawInputData');
    const previewBox = document.getElementById('previewBox');

    if (!rawText || !rawText.value.trim()) {
        previewBox.textContent = "尚未貼上資料，請在上方文字框貼上試算表內容。";
        generatedReceipts = [];
        return;
    }

    let textValue = rawText.value;
    textValue = textValue.replace(/"([^"]*?)"/g, (match, p1) => {
        return '"' + p1.replace(/[\r\n]+/g, ' ') + '"';
    });

    const rawLines = textValue.split('\n');
    let rows = [];
    let currentRow = [];

    rawLines.forEach(line => {
        let trimmed = line.trim();
        if (line.includes('\t')) {
            if (currentRow.length > 0) {
                rows.push(currentRow);
                currentRow = [];
            }
            let cols = line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
            rows.push(cols);
        } else if (trimmed !== "") {
            currentRow.push(trimmed.replace(/^"|"$/g, ''));
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
        let contactRaw = row[3] ? row[3].trim() : "";    // D 欄：聯絡人
        let extraInfo = row[4] ? row[4].trim() : "";     // E 欄：附加資訊 (如電話、分機)
        let logisticsRaw = row[6] ? row[6].trim() : "";  // G 欄：物流
        let addressMemoRaw = row[7] ? row[7].trim() : "";// H 欄：物流碼
        let itemName = row[8] ? row[8].trim() : "";      // I 欄：商品名稱
        let quantity = row[9] ? row[9].trim() : "";      // J 欄：數量
        let totalAmount = row[12] ? row[12].trim() : ""; // M 欄：總金額

        // 智慧尋找訂單編號
        row.forEach(cell => {
            if (cell && /^[0-9A-Z]{10,25}$/.test(cell) && !cell.includes("TW") && !cell.includes("CG01") && !cell.includes("CD01")) {
                if (cell !== "FALSE" && cell !== "₫" && cell !== "💀") {
                    orderNo = cell;
                }
            }
        });

        if (orderNo) {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return;

        // 💡【姓名與 E 欄組合邏輯】如果 E 欄有有效文字且不是 FALSE，則變成 姓名(E欄文字)
        let contact = "未命名";
        if (contactRaw && contactRaw.length < 15 && contactRaw !== "FALSE") {
            contact = contactRaw;
            if (extraInfo && extraInfo !== "FALSE" && extraInfo !== "" && extraInfo !== "₫") {
                contact += `(${extraInfo})`;
            }
        }

        // 嚴格過濾 G 欄與 H 欄，排除下拉選單的 ← 符號
        let logistics = "";
        if (logisticsRaw && logisticsRaw !== "←" && !logisticsRaw.startsWith("←")) {
            logistics = logisticsRaw;
        }

        let addressMemo = "";
        if (addressMemoRaw && addressMemoRaw !== "←" && !addressMemoRaw.startsWith("←")) {
            addressMemo = addressMemoRaw;
        }

        let foundMemo = "";

        // 1. 檢查 G 欄是否帶有 ➤ 備註
        if (logisticsRaw.includes("➤")) {
            let parts = logisticsRaw.split("➤");
            logistics = parts[0].trim();
            if (parts[1] && parts[1].trim() !== "") {
                foundMemo = parts[1].trim();
            }
        }

        // 2. 檢查 H 欄是否帶有 ➤ 備註
        if (addressMemoRaw.includes("➤")) {
            let parts = addressMemoRaw.split("➤");
            addressMemo = parts[0].trim();
            if (parts[1] && parts[1].trim() !== "") {
                let memoCandidate = parts[1].trim();
                foundMemo = foundMemo ? foundMemo + " " + memoCandidate : memoCandidate;
            }
        }

        if (!orders[currentOrderNo]) {
            orders[currentOrderNo] = {
                date: formattedDate,
                orderNo: currentOrderNo,
                contact: contact,
                logistics: logistics || "超商寄送",
                addressMemo: addressMemo && addressMemo !== "FALSE" && addressMemo !== "₫" ? addressMemo : "無物流碼",
                memo: foundMemo,
                totalAmount: totalAmount && !isNaN(totalAmount) ? totalAmount : "0",
                items: []
            };
        } else {
            if (contactRaw && contactRaw.length < 15 && contactRaw !== "FALSE") {
                orders[currentOrderNo].contact = contact;
            }
            if (logistics && logistics !== "" && logistics !== "←") orders[currentOrderNo].logistics = logistics;
            if (addressMemo && addressMemo !== "FALSE" && addressMemo !== "" && addressMemo !== "←") orders[currentOrderNo].addressMemo = addressMemo;
            if (foundMemo && !orders[currentOrderNo].memo.includes(foundMemo)) {
                orders[currentOrderNo].memo = orders[currentOrderNo].memo ? orders[currentOrderNo].memo + " " + foundMemo : foundMemo;
            }
            if ((!orders[currentOrderNo].totalAmount || orders[currentOrderNo].totalAmount === "0") && totalAmount && !isNaN(totalAmount)) {
                orders[currentOrderNo].totalAmount = totalAmount;
            }
        }

        // 精準鎖定 I 欄商品，保留所有文字，並自動切除後方黏到的長串條碼數字
        if (itemName && itemName !== "FALSE" && itemName !== "₫" && itemName !== "←" && itemName !== "💀" && !itemName.startsWith("←")) {
            let cleanName = itemName;
            let codeMatch = cleanName.match(/^(.*?)(\d{8,})$/);
            if (codeMatch) {
                cleanName = codeMatch[1].trim();
            }

            let exists = orders[currentOrderNo].items.some(i => i.name === cleanName);
            if (!exists) {
                orders[currentOrderNo].items.push({
                    name: cleanName,
                    qty: quantity && !isNaN(quantity) ? quantity : ""
                });
            }
        }
    });

    generatedReceipts = [];
    let previewHtml = "";

    for (let key in orders) {
        let ord = orders[key];

        let mainReceipt = 
`━━━━━━━━━━━━
日期：${ord.date}
編號：${ord.orderNo}
姓名：${ord.contact}
━━━━━━━━━━━━
寄送方式：${ord.logistics}
物流碼：${ord.addressMemo}
---------------------\n`;

        if (ord.items.length > 0) {
            ord.items.forEach(item => {
                let qtyStr = item.qty ? item.qty.trim() : "";
                let qtyDisplay = qtyStr !== "" ? `【${qtyStr}】` : `➤`;
                mainReceipt += `${qtyDisplay}${item.name}\n`;
            });
        } else {
            mainReceipt += `➤(請核對原始資料商品)\n`;
        }

        if (ord.memo) {
            mainReceipt += `備註：${ord.memo}\n`;
        }

        mainReceipt += 
`---------------------
總金額：$${ord.totalAmount}
━━━━━━━━━━━━`;

        generatedReceipts.push({ type: 'main', content: mainReceipt });
        previewHtml += mainReceipt + "\n\n================ [ 主單裁切處 ] ================\n\n";

        // 小叮嚀卡片
        let printedKeywords = new Set();
        ord.items.forEach(item => {
            memoRules.forEach(rule => {
                if (item.name.includes(rule.keyword) && !printedKeywords.has(rule.keyword)) {
                    printedKeywords.add(rule.keyword);
                    let slipText = rule.content;
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
                    font-size: 14px; 
                    font-weight: bold;
                    line-height: 1.3; 
                    /* 💡 總寬度微調改為 53mm */
                    width: 53mm; 
                    max-width: 53mm;
                    margin: 0; 
                    padding: 0; 
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
                    width: 53mm;
                }
                .receipt-main {
                    text-align: left; /* 主出貨單靠左 */
                }
                .receipt-memo {
                    text-align: center; /* 小叮嚀卡片置中 */
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
