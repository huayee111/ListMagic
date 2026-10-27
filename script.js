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
        let orderNo = row[1] ? row[1].trim() : "";       
        let contact = row[3] ? row[3].trim() : "";       
        let logisticsRaw = row[6] ? row[6].trim() : "";  
        let addressMemo = row[7] ? row[7].trim() : "";   
        let itemName = row[8] ? row[8].trim() : "";      
        let quantity = row[9] ? row[9].trim() : "";      
        let totalAmount = row[12] ? row[12].trim() : ""; 

        // 全面掃描整列中的每一格，找出真正的訂單編號 (10~20碼英數字)
        row.forEach(cell => {
            if (cell && /^[0-9A-Z]{10,25}$/.test(cell) && !cell.includes("TW") && !cell.includes("CD01")) {
                if (cell !== "FALSE" && cell !== "₫") {
                    orderNo = cell;
                }
            }
        });

        if (orderNo) {
            currentOrderNo = orderNo;
        }

        if (!currentOrderNo) return;

        // 全面掃描整列，尋找物流與物流碼 (自動分離黏在一起的 7-11G97576... 或類似格式)
        let foundLogistics = "超商寄送";
        let foundAddressMemo = "";
        let foundMemo = "";

        row.forEach(cell => {
            if (cell) {
                // 抓取物流與物流碼
                if (cell.includes("7-11") || cell.includes("全家") || cell.includes("蝦皮店到店") || cell.includes("萊爾富") || cell.includes("OK")) {
                    if (cell.length > 10) {
                        // 例如 7-11G97576... 自動拆開
                        let match = cell.match(/^(7-11|全家|蝦皮店到店|萊爾富|OK)(.*)$/);
                        if (match) {
                            foundLogistics = match[1];
                            foundAddressMemo = match[2].trim();
                        } else {
                            foundAddressMemo = cell;
                        }
                    } else {
                        foundLogistics = cell;
                    }
                } else if (cell.startsWith("TW") || /^[A-Z0-9]{12,}$/.test(cell)) {
                    foundAddressMemo = cell;
                }

                // 抓取 ➤ 備註
                if (cell.includes("➤")) {
                    let parts = cell.split("➤");
                    if (parts[1] && parts[1].trim() !== "") {
                        let memoCandidate = parts[1].trim();
                        if (!foundMemo.includes(memoCandidate)) {
                            foundMemo = foundMemo ? foundMemo + " " + memoCandidate : memoCandidate;
                        }
                    }
                }
            }
        });

        if (!orders[currentOrderNo]) {
            orders[currentOrderNo] = {
                date: formattedDate,
                orderNo: currentOrderNo,
                contact: contact && contact.length < 15 && contact !== "FALSE" ? contact : "未命名",
                logistics: foundLogistics,
                addressMemo: foundAddressMemo || foundLogistics,
                memo: foundMemo,
                totalAmount: totalAmount && !isNaN(totalAmount) ? totalAmount : "0",
                items: []
            };
        } else {
            if (contact && contact.length < 15 && contact !== "FALSE") orders[currentOrderNo].contact = contact;
            if (foundLogistics && foundLogistics !== "超商寄送") orders[currentOrderNo].logistics = foundLogistics;
            if (foundAddressMemo) orders[currentOrderNo].addressMemo = foundAddressMemo;
            if (foundMemo && !orders[currentOrderNo].memo.includes(foundMemo)) {
                orders[currentOrderNo].memo = orders[currentOrderNo].memo ? orders[currentOrderNo].memo + " " + foundMemo : foundMemo;
            }
            if ((!orders[currentOrderNo].totalAmount || orders[currentOrderNo].totalAmount === "0") && totalAmount && !isNaN(totalAmount)) {
                orders[currentOrderNo].totalAmount = totalAmount;
            }
        }

        // 智慧過濾商品名稱與數量
        row.forEach(cell => {
            if (cell && cell.length > 1 && cell !== "FALSE" && cell !== "₫" && cell !== "←" && !cell.includes("CD01") && !cell.includes("TW") && !cell.includes("G975") && !cell.includes("261027")) {
                // 排除看起來像訂單編號或物流碼的字串
                if (cell === currentOrderNo || cell === foundAddressMemo) return;

                // 嘗試分離商品名稱與後方黏在一起的長串編號
                let cleanName = cell;
                let cleanQty = "";

                let codeMatch = cleanName.match(/^(.*?)(\d{6,})$/);
                if (codeMatch) {
                    cleanName = codeMatch[1].trim();
                }

                // 檢查結尾是否帶有數量
                let match = cleanName.match(/(.*?)(\d{1,2})$/);
                if (match && !cleanName.includes("50G") && !cleanName.includes("150ml")) {
                    // 避免把容量誤認為數量
                }

                // 如果這格包含中文字或常見商品關鍵字，視為有效商品
                if (cleanName.includes("白身") || cleanName.includes("加速劑") || cleanName.includes("膠") || cleanName.includes("名片") || cleanName.includes("50G") || cleanName.includes("春")) {
                    // 檢查有沒有重複加進去
                    let exists = orders[currentOrderNo].items.some(i => i.name === cleanName);
                    if (!exists) {
                        orders[currentOrderNo].items.push({
                            name: cleanName,
                            qty: quantity && !isNaN(quantity) ? quantity : ""
                        });
                    }
                }
            }
        });
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
物流碼：${ord.addressMemo}
--------------------\n`;

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
